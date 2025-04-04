import {
  Edge,
  EdgeChange,
  NodeChange,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  XYPosition,
  InternalNode,
} from "@xyflow/react";
import { create } from "zustand";
import { nanoid } from "nanoid/non-secure";

import { HandleDataFromServer, MindMapNode } from "./types";

export type RFState = {
  user: {
    id: string;
  };
  nodes: MindMapNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange<MindMapNode>;
  onEdgesChange: OnEdgesChange;
  updateNodeLabel: (nodeId: string, label: string) => void;
  addChildNode: (parentNode: InternalNode, position: XYPosition) => void;
  setDataLocal: HandleDataFromServer;
  initNode: () => void;
};

const useStore = create<RFState>((set, get) => ({
  user: {
    id: "personal",
  },
  nodes: [],
  edges: [],
  onNodesChange: (changes: NodeChange<MindMapNode>[]) => {
    set({
      nodes: applyNodeChanges<MindMapNode>(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  updateNodeLabel: (nodeId: string, label: string) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          // it's important to create a new node here, to inform React Flow about the changes
          return {
            ...node,
            data: { ...node.data, label },
          };
        }

        return node;
      }),
    });
  },
  addChildNode: (parentNode: InternalNode, position: XYPosition) => {
    const newNode: MindMapNode = {
      id: nanoid(),
      type: "mindmap",
      data: { label: "New Node" },
      position,
      dragHandle: ".dragHandle",
      parentId: parentNode.id,
    };

    const newEdge = {
      id: nanoid(),
      source: parentNode.id,
      target: newNode.id,
    };

    set({
      nodes: [...get().nodes, newNode],
      edges: [...get().edges, newEdge],
    });
  },
  setDataLocal: (data) => {
    set({
      nodes: data.nodes || [],
      edges: data.edges || [],
    });
  },
  initNode: () => {
    const nodes = get().nodes;
    if (nodes.length > 0) {
      return;
    }
    const newNode: MindMapNode = {
      id: "root",
      type: "mindmap",
      data: { label: "React Flow Mind Map" },
      position: { x: 0, y: 0 },
      dragHandle: ".dragHandle",
    };

    set({
      nodes: [...get().nodes, newNode],
    });
  },
}));

export default useStore;
