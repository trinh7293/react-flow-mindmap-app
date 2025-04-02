import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  ConnectionLineType,
  NodeOrigin,
  OnConnectEnd,
  OnConnectStart,
  useReactFlow,
  useStoreApi,
  Controls,
  Panel,
  InternalNode,
} from "@xyflow/react";
import { useShallow } from "zustand/react/shallow";

import useStore, { RFState } from "./store";
import MindMapNode from "./MindMapNode";
import MindMapEdge from "./MindMapEdge";

// we need to import the React Flow styles to make it work
import "@xyflow/react/dist/style.css";
import { getUserFlowDataServer, setUserFlowDataServer } from "../flowService";

const selector = (state: RFState) => ({
  user: state.user,
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  addChildNode: state.addChildNode,
  setDataLocal: state.setDataLocal,
  initNode: state.initNode,
});

const nodeTypes = {
  mindmap: MindMapNode,
};

const edgeTypes = {
  mindmap: MindMapEdge,
};

const nodeOrigin: NodeOrigin = [0.5, 0.5];

const connectionLineStyle = { stroke: "#F6AD55", strokeWidth: 3 };
const defaultEdgeOptions = { style: connectionLineStyle, type: "mindmap" };

function Flow() {
  const store = useStoreApi();
  const {
    user,
    setDataLocal,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    addChildNode,
    initNode,
  } = useStore(useShallow(selector));
  const { screenToFlowPosition } = useReactFlow();
  useEffect(() => {
    if (user) {
      getUserFlowDataServer(user.id, setDataLocal);
    }
  }, []);
  const connectingNodeId = useRef<string | null>(null);

  const getChildNodePosition = (
    event: MouseEvent | TouchEvent,
    parentNode?: InternalNode
  ) => {
    const { domNode } = store.getState();

    if (
      !domNode ||
      // we need to check if these properites exist, because when a node is not initialized yet,
      // it doesn't have a positionAbsolute nor a width or height
      !parentNode?.internals.positionAbsolute ||
      !parentNode?.measured.width ||
      !parentNode?.measured.height
    ) {
      return;
    }

    // we need to remove the wrapper bounds, in order to get the correct mouse position
    const panePosition = screenToFlowPosition({
      x: "clientX" in event ? event.clientX : event.touches[0].clientX,
      y: "clientY" in event ? event.clientY : event.touches[0].clientY,
    });

    // we are calculating with positionAbsolute here because child nodes are positioned relative to their parent
    return {
      x: panePosition.x - parentNode.internals.positionAbsolute.x,
      y: panePosition.y - parentNode.internals.positionAbsolute.y,
    };
  };

  const onConnectStart: OnConnectStart = useCallback((_, { nodeId }) => {
    // we need to remember where the connection started so we can add the new node to the correct parent on connect end
    connectingNodeId.current = nodeId;
  }, []);

  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      const { nodeLookup } = store.getState();
      const targetIsPane = (event.target as Element).classList.contains(
        "react-flow__pane"
      );
      const node = (event.target as Element).closest(".react-flow__node");

      if (node) {
        node.querySelector("input")?.focus({ preventScroll: true });
      } else if (targetIsPane && connectingNodeId.current) {
        const parentNode = nodeLookup.get(connectingNodeId.current);

        if (parentNode) {
          const childNodePosition = getChildNodePosition(event, parentNode);

          if (childNodePosition) {
            addChildNode(parentNode, childNodePosition);
          }
        }
      }
    },
    [getChildNodePosition]
  );

  const handleSave = async () => {
    const flowData = {
      nodes,
      edges,
    };
    await setUserFlowDataServer(user.id, flowData);
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnectStart={onConnectStart}
      onConnectEnd={onConnectEnd}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodeOrigin={nodeOrigin}
      defaultEdgeOptions={defaultEdgeOptions}
      connectionLineStyle={connectionLineStyle}
      connectionLineType={ConnectionLineType.Straight}
      fitView
    >
      <Controls showInteractive={false} />
      <Panel position="top-left" className="header">
        React Flow Mind Map
      </Panel>
      <Panel position="top-right">
        {nodes.length === 0 ? <button onClick={initNode}>Init</button> : null}
        <button onClick={handleSave}>Save</button>
      </Panel>
    </ReactFlow>
  );
}

export default Flow;
