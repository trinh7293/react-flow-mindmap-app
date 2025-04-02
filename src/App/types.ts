import { Edge, type Node } from "@xyflow/react";

export type NodeData = {
  label: string;
};

export type MindMapNode = Node<NodeData, "mindmap">;

export type FlowData = {
  nodes: MindMapNode[];
  edges: Edge[];
};

export type HandleDataFromServer = (data: FlowData) => void;

export type UserDoc = {
  flowData: FlowData;
};
