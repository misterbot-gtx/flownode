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
  'startNode': { width: 240, height: 60 },
  'imagem': { width: 180, height: 80 },
  'imageNode': { width: 180, height: 80 },
  'audio': { width: 180, height: 80 },
  'audioNode': { width: 180, height: 80 },
  'texto': { width: 180, height: 80 },
  'textNode': { width: 180, height: 80 },
  'default': { width: 180, height: 80 },
};

// Constantes para layout dos grupos
const GROUP_PADDING = 16; // Padding interno do grupo
const HEADER_HEIGHT = 60; // Altura do header do grupo
const CHILD_SPACING = 8; // Espaçamento entre filhos
const CHILD_WIDTH = 180; // Largura padrão dos filhos
const CHILD_HEIGHT = 80; // Altura padrão dos filhos
const GROUP_DEFAULT_WIDTH = 280; // Largura padrão do grupo
const GROUP_MIN_WIDTH = 280; // Largura mínima do grupo
const GROUP_MIN_HEIGHT = 120; // Altura mínima do grupo

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
    elementData?: string;
    insertIndex?: number;
    isRemoval?: boolean;
    elementId?: string;
    draggedElement?: Node;
    dropPosition?: { x: number; y: number };
    position: { x: number; y: number };
  } | null>(null);
  
  // REMOVIDO: Estados para handlers React Flow - funcionalidade já implementada via DOM

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
    const handleRemoveFromGroup = (event: CustomEvent) => {
      setPendingGroupDrop({
        ...event.detail,
        isRemoval: true,
      });
    };
    const handleSelectChildNode = (event: CustomEvent) => {
      // Permitir seleção de elementos individuais dentro dos grupos
      const { nodeId, node } = event.detail;
      // Aqui poderíamos implementar lógica adicional de seleção se necessário
    };
    window.addEventListener('groupDrop', handleGroupDrop as EventListener);
    window.addEventListener('removeFromGroup', handleRemoveFromGroup as EventListener);
    window.addEventListener('selectChildNode', handleSelectChildNode as EventListener);
    return () => {
      window.removeEventListener('groupDrop', handleGroupDrop as EventListener);
      window.removeEventListener('removeFromGroup', handleRemoveFromGroup as EventListener);
      window.removeEventListener('selectChildNode', handleSelectChildNode as EventListener);
    };
  }, []);

  useEffect(() => {
    if (pendingGroupDrop) {
      try {
        if (pendingGroupDrop.isRemoval && pendingGroupDrop.elementId && pendingGroupDrop.draggedElement) {
          // Lógica de remoção do grupo
          const targetGroup = nodes.find(n => n.id === pendingGroupDrop.groupId);
          if (targetGroup) {
            const dropPosition = pendingGroupDrop.dropPosition || pendingGroupDrop.position;
            
            // Calcular posição para colocar o elemento fora do grupo
            let finalPosition;
            if (reactFlowRef.current) {
              const reactFlowInstance = reactFlowRef.current;
              const point = reactFlowInstance.screenToFlowPosition({
                x: dropPosition.x,
                y: dropPosition.y,
              });
              finalPosition = point;
            } else {
              finalPosition = dropPosition;
            }
            
            // Remover parentId para tirar o elemento do grupo
            const updatedElement = {
              ...pendingGroupDrop.draggedElement,
              parentId: undefined,
              position: finalPosition,
            };
            
            setNodes((nds) =>
              nds.map(node =>
                node.id === pendingGroupDrop.elementId ? updatedElement : node
              )
            );
            
          }
        } else if (pendingGroupDrop.elementData) {
          // NOVA LÓGICA: Usar posicionamento automático
          const element = JSON.parse(pendingGroupDrop.elementData) as FlowElement;
          
          console.log('🎯 Adicionando elemento ao grupo com posicionamento automático:', element);
          
          addChildToGroup(
            pendingGroupDrop.groupId,
            element,
            pendingGroupDrop.insertIndex
          );
        }
      } catch (error) {
        console.error('❌ Erro ao processar group drop:', error);
      }
      setPendingGroupDrop(null);
    }
  }, [pendingGroupDrop, nodes, nodeId, setNodes, reactFlowRef]);

  const onConnect = useCallback(
    (params: Connection) => handleConnect(params, setEdges, nodes, edges),
    [setEdges, nodes, edges]
  );

  const handleNodesChange = useCallback(
    (changes: any[]) => {
      // Intercepta remoção do node 'start'
      const filteredChanges = changes.filter(change => {
        if (change.type === 'remove' && change.id === 'start') {
          return false; // bloqueia remoção do start
        }
        return true;
      });
      onNodesChange(filteredChanges);
    },
    [onNodesChange]
  );

  // Handler para desagrupamento automático apenas quando nó sai do grupo
  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.parentId) {
      // O desagrupamento automático foi REMOVIDO
      // Agora só acontece quando o elemento é explicitamente solto fora do grupo
      // ou através do sistema de drag-and-drop próprio dos grupos
      console.log('Nó iniciado com parentId:', node.id, 'grupo:', node.parentId);
    }
  }, [nodes, setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    // Verifica se há dados sendo arrastados
    const childNodeData = event.dataTransfer.getData('application/reactflow-child');
    const elementData = event.dataTransfer.getData('application/reactflow');
  }, []);

  const processDrop = useCallback((
    event: React.DragEvent,
    elementData: string,
    reactFlowBounds: DOMRect
  ) => {
    try {
      const element = JSON.parse(elementData) as FlowElement;
      let dropPosition;
      
      // Usa sempre o ReactFlow para converter coordenadas da tela para coordenadas do flow
      if (reactFlowRef.current) {
        const reactFlowInstance = reactFlowRef.current;
        const point = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        dropPosition = point;
      } else {
        // Fallback se o ReactFlow não estiver disponível
        dropPosition = {
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        };
      }
      
      // SEMPRE criar um novo grupo para qualquer componente
      const newGroup: Node = {
        id: `group-${groupId}`,
        type: 'groupNode',
        position: { x: dropPosition.x - 150, y: dropPosition.y - 80 },
        data: {
          title: `Grupo #${groupId}`,
          nodes: [],
        },
      };
      
      // Calcular posição do componente dentro do grupo
      const elementType = (element.type || '').toLowerCase();
      const { width, height } = NODE_SIZES[elementType] || NODE_SIZES['default'];
      const componentPosition = {
        x: newGroup.position.x + 16,
        y: newGroup.position.y + 80,
      };
      
      const typeMap: Record<string, string> = {
        start: 'startNode',
        texto: 'textNode',
        imagem: 'imageNode',
        audio: 'audioNode',
      };
      const nodeType = typeMap[elementType] || 'textNode';
      
      const newNode: Node = {
        id: `${element.type}-${nodeId}`,
        type: nodeType,
        position: componentPosition,
        data: {
          label: element.label,
          element,
          width,
          height,
          tempHeightZero: true,
        },
        parentId: newGroup.id,
        extent: 'parent' as const,
      };
      
      // Adicionar grupo e componente ao estado
      setNodes((nds) => {
        const newNodes = [...nds, newGroup, newNode];
        return newNodes;
      });
      
      setNodeId((id) => id + 1);
      setGroupId((id) => id + 1);
      
    } catch (error) {
      console.error('Erro ao processar drop:', error);
      throw error; // Re-throw para ser capturado pelo caller
    }
  }, [nodeId, groupId, setNodes, setNodeId, setGroupId]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const elementData = event.dataTransfer.getData('application/reactflow');
      const childNodeData = event.dataTransfer.getData('application/reactflow-child');
      
      if (!elementData && !childNodeData) {
        return;
      }
      
      // Verificar se há um grupo no ponto do drop
      const dropPosition = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };
      
      // Convertendo para coordenadas do flow para verificar se há um grupo
      let finalDropPosition = dropPosition;
      if (reactFlowRef.current) {
        const reactFlowInstance = reactFlowRef.current;
        finalDropPosition = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
      }
      
      // Buscar grupo no ponto do drop
      const groupAtDropPoint = nodes.find(node => {
        if (node.type !== 'groupNode') return false;
        
        const nodeBounds = {
          left: node.position.x,
          top: node.position.y,
          right: node.position.x + (node.width || 280),
          bottom: node.position.y + (node.height || 120),
        };
        
        return (
          finalDropPosition.x >= nodeBounds.left &&
          finalDropPosition.x <= nodeBounds.right &&
          finalDropPosition.y >= nodeBounds.top &&
          finalDropPosition.y <= nodeBounds.bottom
        );
      });
      
      // Processa o drop
      if (!pendingGroupDrop) {
        if (groupAtDropPoint && elementData) {
          // Drop sobre grupo existente - usar lógica de groupDrop
          const customEvent = new CustomEvent('groupDrop', {
            detail: {
              groupId: groupAtDropPoint.id,
              elementData: elementData,
              insertIndex: 0, // Será calculado pelo GroupNode
              position: {
                x: event.clientX,
                y: event.clientY,
              },
            },
          });
          window.dispatchEvent(customEvent);
        } else {
          // Drop em área vazia - criar novo grupo
          processDrop(event, elementData, reactFlowBounds);
        }
      }
    },
    [nodeId, setNodes, nodes, pendingGroupDrop, processDrop]
  );

  // ========== FUNÇÕES DE POSICIONAMENTO AUTOMÁTICO ==========
  
  /**
   * Calcula a posição relativa de um filho dentro do grupo
   * @param index Índice do filho no grupo
   * @param totalChildren Total de filhos no grupo
   * @returns Posição relativa (x, y) dentro do grupo
   */
  const calculateChildPosition = useCallback((index: number, totalChildren: number) => {
    const padding = GROUP_PADDING;
    const headerHeight = HEADER_HEIGHT;
    
    const x = padding; // Sempre alinhado à esquerda com padding
    const y = headerHeight + (index * (CHILD_HEIGHT + CHILD_SPACING)) + padding;
    
    return { x, y };
  }, []);

  /**
   * Calcula as dimensões recomendadas do grupo baseado no número de filhos
   * @param childCount Número de filhos
   * @returns Dimensões recomendadas (width, height)
   */
  const calculateGroupDimensions = useCallback((childCount: number) => {
    const width = GROUP_DEFAULT_WIDTH;
    const minHeight = GROUP_MIN_HEIGHT;
    
    // Altura mínima + altura dos filhos + espaçamentos + padding
    const calculatedHeight = HEADER_HEIGHT +
      (childCount * CHILD_HEIGHT) +
      ((childCount - 1) * CHILD_SPACING) +
      (GROUP_PADDING * 2);
    
    const height = Math.max(minHeight, calculatedHeight);
    
    return { width, height };
  }, []);

  /**
   * Atualiza as posições de todos os filhos do grupo
   * @param groupId ID do grupo
   * @param childNodes Lista de nós filhos
   */
  const updateChildrenPositions = useCallback((groupId: string, childNodes: Node[]) => {
    setNodes((nds) => {
      const updatedNodes = [...nds];
      
      // Atualizar cada filho com nova posição relativa
      childNodes.forEach((child, index) => {
        const newPosition = calculateChildPosition(index, childNodes.length);
        
        const childIndex = updatedNodes.findIndex(n => n.id === child.id);
        if (childIndex !== -1) {
          updatedNodes[childIndex] = {
            ...updatedNodes[childIndex],
            position: newPosition,
          };
        }
      });
      
      return updatedNodes;
    });
  }, [calculateChildPosition, setNodes]);

  /**
   * Redimensiona o grupo baseado no número de filhos
   * @param groupId ID do grupo
   * @param childNodes Lista de nós filhos
   */
  const resizeGroup = useCallback((groupId: string, childNodes: Node[]) => {
    const newDimensions = calculateGroupDimensions(childNodes.length);
    
    setNodes((nds) => {
      return nds.map(node => {
        if (node.id === groupId) {
          return {
            ...node,
            width: newDimensions.width,
            height: newDimensions.height,
          };
        }
        return node;
      });
    });
  }, [calculateGroupDimensions, setNodes]);

  /**
   * Processa a reorganização de filhos em um grupo
   * @param groupId ID do grupo
   * @param newChildrenOrder Nova ordem dos filhos
   */
  const reorganizeGroupChildren = useCallback((groupId: string, newChildrenOrder: Node[]) => {
    updateChildrenPositions(groupId, newChildrenOrder);
    resizeGroup(groupId, newChildrenOrder);
  }, [updateChildrenPositions, resizeGroup]);

  /**
   * Adiciona um novo filho ao grupo com posição automática
   * @param groupId ID do grupo
   * @param element Elemento a ser adicionado
   * @param insertIndex Índice de inserção (opcional)
   */
  const addChildToGroup = useCallback((
    groupId: string,
    element: FlowElement,
    insertIndex?: number
  ) => {
    // Buscar grupo atual
    const targetGroup = nodes.find(n => n.id === groupId);
    if (!targetGroup) return;

    // Buscar filhos existentes
    const existingChildren = nodes.filter(n => n.parentId === groupId);
    const finalIndex = insertIndex !== undefined ?
      Math.max(0, Math.min(insertIndex, existingChildren.length)) :
      existingChildren.length;

    // Calcular posição do novo filho
    const childPosition = calculateChildPosition(finalIndex, existingChildren.length + 1);

    // Mapear tipo do elemento
    const typeMap: Record<string, string> = {
      'start': 'startNode',
      'texto': 'textNode',
      'textBubble': 'textNode',
      'imagem': 'imageNode',
      'imageBubble': 'imageNode',
      'audio': 'audioNode',
      'audioBubble': 'audioNode',
    };
    const elementType = (element.type || '').toLowerCase();
    const nodeType = typeMap[elementType] || 'textNode';

    // Calcular dimensões do novo nó
    const { width, height } = NODE_SIZES[elementType] || NODE_SIZES['default'];

    // Criar novo nó com posicionamento relativo
    const newNode: Node = {
      id: `${element.type}-${nodeId}`,
      type: nodeType,
      position: childPosition, // Posição relativa ao grupo
      data: {
        label: element.label,
        element,
        width,
        height,
      },
      parentId: targetGroup.id,
      extent: 'parent' as const, // CRÍTICO: mantém posição relativa
    };

    // Adicionar o novo nó
    setNodes((nds) => [...nds, newNode]);
    
    // Atualizar posições de todos os filhos
    const newChildrenOrder = [...existingChildren];
    newChildrenOrder.splice(finalIndex, 0, newNode);
    
    // Reorganizar e redimensionar
    setTimeout(() => {
      reorganizeGroupChildren(groupId, newChildrenOrder);
    }, 0);
    
    setNodeId((id) => id + 1);

    console.log(`✅ Novo filho adicionado ao grupo ${groupId}:`, newNode);
  }, [nodes, calculateChildPosition, nodeId, reorganizeGroupChildren, setNodes, setNodeId]);

  const createGroup = useCallback(() => {
    const emptyGroupDimensions = calculateGroupDimensions(0);
    
    const newGroup: Node = {
      id: `group-${groupId}`,
      type: 'groupNode',
      position: { x: 200, y: 200 },
      width: emptyGroupDimensions.width,
      height: emptyGroupDimensions.height,
      data: {
        title: `Group #${groupId}`,
        nodes: [],
      },
    };
    setNodes((nds) => {
      const newNodes = nds.concat(newGroup);
      return newNodes;
    });
    setGroupId((id) => id + 1);
    
    console.log('✅ Novo grupo criado com dimensões automáticas:', emptyGroupDimensions);
  }, [groupId, setNodes, calculateGroupDimensions]);

  const nodeColor = useMemo(() => {
    return (node: Node) => {
      switch (node.type) {
        case 'startNode':
          return '#2563eb';
        case 'groupNode':
          return '#641172';
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
    // CRÍTICO: NÃO filtrar nós com parentId - eles precisam ser renderizados dentro dos grupos
    // Removida a filtragem para permitir que nós filhos sejam exibidos
    return nodes;
  }, [nodes]);

  const processedNodes = useMemo(() => {
    return visibleNodes.map(node => {
      if (node.type === 'groupNode') {
        // Remove childNodes do data do grupo - todos os nós devem estar no array raiz
        return {
          ...node,
          data: {
            ...node.data,
            // Remove propriedades específicas de childNodes se existirem
            childNodes: undefined,
            childNodesIds: undefined,
            _updateTimestamp: undefined,
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

  // Função para exportar o flow
  const exportFlow = useCallback(() => {
    // Exportar TODOS os nós (pais e filhos) no array raiz conforme React Flow
    const flowData = {
      nodes: nodes, // Usar todos os nós, não apenas processedNodes
      edges: processedEdges,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(flowData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Flow exportado com sucesso:', flowData);
    console.log('📊 Total de nós exportados:', nodes.length, '(incluindo', nodes.filter(n => n.parentId).length, 'nós filhos)');
  }, [nodes, processedEdges]);

  // Função para importar o flow
  const importFlow = useCallback((flowData: any) => {
    try {
      // Validar estrutura dos dados
      if (!flowData.nodes || !flowData.edges) {
        throw new Error('Estrutura de dados inválida:缺少 nodes ou edges');
      }

      // PASSO 1: Processar todos os nós do export
      const importedNodes: Node[] = flowData.nodes.map((exportNode: any) => {
        if (exportNode.type === 'startNode') {
          // Garantir que startNode tenha dados corretos
          return {
            ...exportNode,
            data: {
              label: 'Início',
              element: {
                id: 'start',
                type: 'start',
                category: 'bubbles' as const,
                label: 'Início',
                icon: '🚀',
              },
              ...exportNode.data
            }
          };
        } else if (exportNode.type === 'groupNode') {
          // Remover childNodes dos dados do grupo - todos os nós devem estar no array raiz
          return {
            ...exportNode,
            data: {
              ...exportNode.data,
              // Remove propriedades de childNodes se existirem
              childNodes: undefined,
              childNodesIds: undefined,
              _updateTimestamp: undefined,
            },
          };
        } else {
          // Outros nós - garantir que tenha extent: 'parent' se tiver parentId
          if (exportNode.parentId) {
            return {
              ...exportNode,
              extent: 'parent' as const,
            };
          }
          return exportNode;
        }
      });

      // PASSO 2: Verificar e preservar conexões
      const finalEdges = flowData.edges.map((edge: any) => ({
        ...edge,
        type: 'custom', // Garantir que todas as edges usem o tipo custom
        style: {
          stroke: '#ffffff',
          strokeWidth: 0.5,
          strokeDasharray: '7 5',
          animation: 'dashdraw 1s linear infinite',
          cursor: 'pointer',
          ...edge.style
        }
      }));

      // PASSO 3: Atualizar o estado
      setNodes(() => importedNodes);
      setEdges(() => finalEdges);

      console.log('✅ Flow importado com sucesso:', {
        totalNodes: importedNodes.length,
        childNodes: importedNodes.filter(n => n.parentId).length,
        groupNodes: importedNodes.filter(n => n.type === 'groupNode').length,
      });

      return true;
    } catch (error) {
      console.error('Erro ao importar flow:', error);
      return false;
    }
  }, [setNodes, setEdges]);

  return {
    nodes: processedNodes,
    edges: processedEdges,
    onNodesChange: handleNodesChange,
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
    nodeColor,
    onDrop,
    onDragOver,
    createGroup,
    onPaneClick: clearEdgeSelection,
    onNodeDragStart, // Handler para desagrupamento automático
    reactFlowRef, // exporta a ref
    // 🔧 NOVOS: Funções de posicionamento automático para grupos
    calculateChildPosition,
    calculateGroupDimensions,
    updateChildrenPositions,
    resizeGroup,
    reorganizeGroupChildren,
    addChildToGroup,
    // Handlers para desaninhamento de nós filhos
    // REMOVIDO: Handlers foram removidos, pois a funcionalidade já existe no GroupNode.tsx
    exportFlow,
    importFlow,
  };
}