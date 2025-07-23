import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import {
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
} from '@xyflow/react';
import { FlowElement } from '@/types/flow';
import StartNode from './nodes/StartNode';
import TextNode from './nodes/TextNode';
import ImageNode from './nodes/ImageNode';
import AudioNode from './nodes/AudioNode';
import { GroupNode } from './nodes/GroupNode';
import { CustomEdge } from './CustomEdge';

const NODE_SIZES: Record<string, { width: number; height: number }> = {
  'start': { width: 240, height: 60 },
  'imagem': { width: 180, height: 80 },
  'audio': { width: 180, height: 80 },
  'texto': { width: 180, height: 80 },
  'default': { width: 180, height: 80 },
};

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'startNode',
    position: { x: 400, y: 100 },
    width: 140,
    height: 60,
    data: {
      label: 'Início',
      element: {
        id: 'start',
        type: 'start',
        category: 'bubbles' as const,
        label: 'Início',
        icon: '🚀',
      },
    },
  },
];

const initialEdges: Edge[] = [];

function handleConnect(params: Connection, setEdges: (fn: (edges: Edge[]) => Edge[]) => void, nodes: Node[], edges: Edge[]) {
  const sourceId = params.source;
  const targetId = params.target;
  // Permitir apenas uma conexão de saída por nó: remove todas as edges com source igual ao sourceId
  const newEdges = edges.filter(e => e.source !== sourceId);
  const newEdge = {
    id: `edge-${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
    type: 'custom',
    style: {
      stroke: '#ffffff',
      strokeWidth: 0.5,
      strokeDasharray: '7 5',
      animation: 'dashdraw 1s linear infinite',
      cursor: 'pointer',
    },
  };
  setEdges(() => [...newEdges, newEdge]);
}

export function useFlowLogic() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(1);
  const [groupId, setGroupId] = useState(1);
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const [pendingGroupDrop, setPendingGroupDrop] = useState<{
    groupId: string;
    elementData: string;
    position: { x: number; y: number };
  } | null>(null);

  // Remover box selection state e handlers

  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setEdges((edges) =>
      edges.map((e) =>
        e.id === edge.id
          ? { ...e, data: { ...(e.data || {}), showDelete: true } }
          : { ...e, data: { ...(e.data || {}), showDelete: false } }
      )
    );
    setSelectedEdgeId(edge.id);
  }, [setEdges]);

  // Função para deselecionar edges ao clicar fora
  const clearEdgeSelection = useCallback(() => {
    setEdges((edges) =>
      edges.map((e) => ({ ...e, data: { ...(e.data || {}), showDelete: false } }))
    );
    setSelectedEdgeId(null);
  }, [setEdges]);

  useEffect(() => {
    const handleGroupDrop = (event: CustomEvent) => {
      setPendingGroupDrop(event.detail);
    };
    window.addEventListener('groupDrop', handleGroupDrop as EventListener);
    return () => {
      window.removeEventListener('groupDrop', handleGroupDrop as EventListener);
    };
  }, []);

  useEffect(() => {
    if (pendingGroupDrop) {
      try {
        const element = JSON.parse(pendingGroupDrop.elementData) as FlowElement;
        const targetGroup = nodes.find(n => n.id === pendingGroupDrop.groupId);
        if (targetGroup) {
          const existingChildren = nodes.filter(n => n.parentId === targetGroup.id);
          const childIndex = existingChildren.length;
          const padding = 16;
          const childWidth = 250;
          const childHeight = 80;
          const maxChildrenPerRow = 1;
          const row = Math.floor(childIndex / maxChildrenPerRow);
          const col = childIndex % maxChildrenPerRow;
          const relativeX = padding + (col * (childWidth + 8));
          const relativeY = 80 + (row * (childHeight + 8));
          const finalPosition = {
            x: targetGroup.position.x + relativeX,
            y: targetGroup.position.y + relativeY,
          };
          // Corrigir o type do node
          const typeMap: Record<string, string> = {
            start: 'startNode',
            texto: 'textNode',
            imagem: 'imageNode',
            audio: 'audioNode',
          };
          const elementType = (element.type || '').toLowerCase();
          const nodeType = typeMap[elementType] || 'textNode';
          const newNode: Node = {
            id: `${element.type}-${nodeId}`,
            type: nodeType,
            position: finalPosition,
            data: {
              label: element.label,
              element,
            },
            parentId: targetGroup.id,
          };
          setNodes((nds) => nds.concat(newNode));
          setNodeId((id) => id + 1);
        }
      } catch (error) {
        // erro
      }
      setPendingGroupDrop(null);
    }
  }, [pendingGroupDrop, nodes, nodeId, setNodes]);

  useEffect(() => {
    if (pendingGroupDrop) {
      const timeout = setTimeout(() => {
        setPendingGroupDrop(null);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [pendingGroupDrop]);

  const onConnect = useCallback(
    (params: Connection) => handleConnect(params, setEdges, nodes, edges),
    [setEdges, nodes, edges]
  );

  // Substituir handleNodesChange por repasse direto do onNodesChange
  const handleNodesChange = useCallback(
    (changes: any[]) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const processDrop = useCallback((
    event: React.DragEvent,
    elementData: string,
    reactFlowBounds: DOMRect
  ) => {
    try {
      const element = JSON.parse(elementData) as FlowElement;
      let dropPosition;
      if (reactFlowRef.current) {
        const reactFlowInstance = reactFlowRef.current;
        const point = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        dropPosition = point;
      } else {
        dropPosition = {
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        };
      }
      const groupNodes = nodes.filter(node => node.type === 'groupNode');
      let targetGroup = null;
      for (const node of groupNodes) {
        const childNodes = nodes.filter(n => n.parentId === node.id);
        const baseHeight = 160;
        const childHeight = childNodes.length * 80;
        const groupHeight = Math.max(baseHeight, childHeight);
        const groupWidth = 320;
        const tolerance = 10;
        const isInsideGroup =
          dropPosition.x >= (node.position.x - tolerance) &&
          dropPosition.x <= (node.position.x + groupWidth + tolerance) &&
          dropPosition.y >= (node.position.y - tolerance) &&
          dropPosition.y <= (node.position.y + groupHeight + tolerance);
        if (isInsideGroup) {
          targetGroup = node;
          break;
        }
      }
      let finalPosition = dropPosition;
      let parentId: string | undefined = undefined;
      let nodeWidth: number | undefined = undefined;
      let nodeHeight: number | undefined = undefined;
      if (targetGroup) {
        const offsetX = dropPosition.x - targetGroup.position.x;
        const offsetY = dropPosition.y - targetGroup.position.y;
        const headerHeight = 60;
        const minY = Math.max(offsetY, headerHeight + 8);
        finalPosition = {
          x: targetGroup.position.x + offsetX,
          y: targetGroup.position.y + minY,
        };
        parentId = targetGroup.id;
      }
      if (!targetGroup) {
        const elementType = (element.type || '').toLowerCase();
        const { width, height } = NODE_SIZES[elementType] || NODE_SIZES['default'];
        finalPosition = {
          x: dropPosition.x - width / 2,
          y: dropPosition.y - height / 2,
        };
        nodeWidth = width;
        nodeHeight = height;
      }
      const typeMap: Record<string, string> = {
        start: 'startNode',
        texto: 'textNode',
        imagem: 'imageNode',
        audio: 'audioNode',
      };
      const elementType = (element.type || '').toLowerCase();
      const nodeType = typeMap[elementType] || 'textNode';
      const newNode: Node = {
        id: `${element.type}-${nodeId}`,
        type: nodeType,
        position: finalPosition,
        data: {
          label: element.label,
          element,
          width: typeof nodeWidth !== 'undefined' ? nodeWidth : undefined,
          height: typeof nodeHeight !== 'undefined' ? nodeHeight : undefined,
          tempHeightZero: true,
        },
        parentId: parentId,
      };
      console.log('Novo elemento criado:', newNode);
      setNodes((nds) => {
        const newNodes = nds.concat(newNode);
        setTimeout(() => {
          if (reactFlowRef.current) {
            const viewport = reactFlowRef.current.getViewport();
            reactFlowRef.current.setViewport(viewport);
          }
        }, 0);
        return newNodes;
      });
      setNodeId((id) => id + 1);
    } catch (error) {
      // erro
    }
  }, [nodeId, setNodes, nodes]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const elementData = event.dataTransfer.getData('application/reactflow');
      if (!elementData) return;
      setTimeout(() => {
        if (pendingGroupDrop) return;
        processDrop(event, elementData, reactFlowBounds);
      }, 50);
    },
    [nodeId, setNodes, nodes, pendingGroupDrop, processDrop]
  );

  const createGroup = useCallback(() => {
    const newGroup: Node = {
      id: `group-${groupId}`,
      type: 'groupNode',
      position: { x: 200, y: 200 },
      data: {
        title: `Group #${groupId}`,
        nodes: [],
      },
    };
    setNodes((nds) => {
      const newNodes = nds.concat(newGroup);
      // Removido: ajuste automático da visualização (fitView)
      return newNodes;
    });
    setGroupId((id) => id + 1);
  }, [groupId, setNodes]);

  const nodeColor = useMemo(() => {
    return (node: Node) => {
      switch (node.type) {
        case 'startNode':
          return '#16a34a';
        case 'groupNode':
          return '#1a1a2e';
        case 'flowNode':
          const element = (node.data as any)?.element;
          if (element?.category === 'bubbles') return '#16a34a';
          if (element?.category === 'inputs') return '#2563eb';
          if (element?.category === 'conditionals') return '#ea580c';
          return '#6b7280';
        default:
          return '#6b7280';
      }
    };
  }, []);

  const visibleNodes = useMemo(() => {
    const filtered = nodes.filter(node => !node.parentId);
    return filtered;
  }, [nodes]);

  const processedNodes = useMemo(() => {
    return visibleNodes.map(node => {
      if (node.type === 'groupNode') {
        const childNodes = nodes.filter(n => n.parentId === node.id);
        return {
          ...node,
          data: {
            ...node.data,
            childNodes,
          },
        };
      }
      return node;
    });
  }, [visibleNodes, nodes]);

  const processedEdges = useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      type: 'custom',
    }));
  }, [edges]);

  return {
    nodes: processedNodes,
    edges: processedEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    nodeTypes: {
      startNode: StartNode,
      textNode: TextNode,
      imageNode: ImageNode,
      audioNode: AudioNode,
      groupNode: GroupNode,
    },
    edgeTypes: {
      custom: CustomEdge,
    },
    selectedEdgeId,
    onEdgeClick,
    onInit: (instance: ReactFlowInstance) => {
      reactFlowRef.current = instance;
    },
    fitView: true,
    nodeColor,
    onDrop,
    onDragOver,
    createGroup,
    onPaneClick: clearEdgeSelection,
    reactFlowRef, // exporta a ref
    // Remover exportação dos handlers de box selection
  };
} 