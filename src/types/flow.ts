export interface FlowElement {
  id: string;
  type: string;
  category: 'bubbles' | 'inputs' | 'conditionals';
  label: string;
  icon: string;
  description?: string;
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    element: FlowElement;
    isEditing?: boolean;
  };
  parentId?: string;
}

export interface FlowGroup {
  id: string;
  title: string;
  nodes: FlowNode[];
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: Record<string, any>;
}