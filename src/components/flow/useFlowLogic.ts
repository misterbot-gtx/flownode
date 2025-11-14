import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import {
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
} from '@flow/react';
import { FlowElement } from '../../types/flow';
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
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [pendingGroupDrop, setPendingGroupDrop] = useState<{
    groupId: string;
    elementData: string;
    position: { x: number; y: number };
  } | null>(null);
  const [draggingChildNode, setDraggingChildNode] = useState<{
    nodeId: string;
    originalNodeId: string;
    groupNodeId: string;
    nodeData: Node;
  } | null>(null);

  // Remover box selection state e handlers

  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  
  // Função de logging para debugging
  const addDebugLog = useCallback((type: 'info' | 'warning' | 'error' | 'success', message: string, data?: any) => {
    const logEntry = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      data,
    };
    setDebugLogs(prev => [logEntry, ...prev].slice(0, 100));
    console.log(`🔧 [${type.toUpperCase()}] ${message}`, data || '');
  }, []);

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
    addDebugLog('info', 'Edge selecionado', { edgeId: edge.id, source: edge.source, target: edge.target });
  }, [setEdges, addDebugLog]);

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
      addDebugLog('info', 'Group drop event recebido', event.detail);
    };
    window.addEventListener('groupDrop', handleGroupDrop as EventListener);
    return () => {
      window.removeEventListener('groupDrop', handleGroupDrop as EventListener);
    };
  }, [addDebugLog]);

  useEffect(() => {
    if (pendingGroupDrop) {
      try {
        const element = JSON.parse(pendingGroupDrop.elementData) as FlowElement;
        const targetGroup = nodes.find(n => n.id === pendingGroupDrop.groupId);
        if (targetGroup) {
          // USAR DADOS CONSISTENTES DO PREVIEW
          const calculatedPosition = (pendingGroupDrop as any).calculatedPosition;
          const dropIndex = (pendingGroupDrop as any).dropIndex || 0;
          
          console.log('🎯 PROCESSANDO GROUP DROP COM DADOS CONSISTENTES:', {
            calculatedPosition,
            dropIndex,
            targetGroupPosition: targetGroup.position
          });
          
          // POSIÇÃO FINAL: grupo position + calculatedPosition (sem conversões)
          const finalPosition = {
            x: targetGroup.position.x + calculatedPosition.x,
            y: targetGroup.position.y + calculatedPosition.y,
          };
          
          console.log('🎯 POSIÇÃO FINAL CALCULADA:', {
            groupPosition: targetGroup.position,
            calculatedPosition,
            finalPosition
          });
          
          // Corrigir o type do node
          const typeMap: Record<string, string> = {
            start: 'startNode',
            texto: 'textNode',
            imagem: 'imageNode',
            audio: 'audioNode',
          };
          const elementType = (element.type || '').toLowerCase();
          const nodeType = typeMap[elementType] || 'textNode';
          
          // Obter dimensões do elemento
          const elementDimensions = NODE_SIZES[elementType] || NODE_SIZES['default'];
          
          const newNode: Node = {
            id: `${element.type}-${nodeId}`,
            type: nodeType,
            position: finalPosition,
            data: {
              label: element.label,
              element,
              width: elementDimensions.width,
              height: elementDimensions.height,
              // MARCAR COMO CHILD DO GRUPO
              parentGroupId: targetGroup.id,
            },
            parentId: targetGroup.id,
          };
          
          setNodes((nds) => {
            // INSERIR NA ORDEM CORRETA NO GRUPO
            const newNodes = [...nds];
            const groupChildNodes = newNodes.filter(n => n.parentId === targetGroup.id);
            
            // INSERIR O NOVO NÓ NA POSIÇÃO CORRETA
            if (dropIndex >= groupChildNodes.length) {
              // Inserir no final
              newNodes.push(newNode);
            } else {
              // Encontrar onde inserir baseado no dropIndex
              const nonGroupNodes = newNodes.filter(n => !n.parentId || n.parentId !== targetGroup.id);
              const childrenToInsert = [...groupChildNodes];
              childrenToInsert.splice(dropIndex, 0, newNode);
              
              // Recompor a lista mantendo a ordem: nós não-filhos + filhos do grupo na ordem correta
              const finalNodes = [
                ...nonGroupNodes,
                ...childrenToInsert
              ];
              
              addDebugLog('success', `🎯 COMPONENTE INSERIDO NA POSIÇÃO DO PREVIEW!`, {
                nodeId: newNode.id,
                type: newNode.type,
                groupId: targetGroup.id,
                position: finalPosition,
                elementLabel: element.label,
                dropIndex: dropIndex,
                method: 'calculated-position-consistent',
                finalPosition
              });
              
              return finalNodes;
            }
            
            return newNodes;
          });
          
          setNodeId((id) => id + 1);
        }
      } catch (error) {
        console.error('Erro ao processar group drop:', error);
        addDebugLog('error', 'Erro ao processar group drop', error);
      }
      setPendingGroupDrop(null);
    }
  }, [pendingGroupDrop, nodes, nodeId, setNodes, addDebugLog]);

  // Removido o timeout desnecessário que poderia interferir com o posicionamento

  const onConnect = useCallback(
    (params: Connection) => handleConnect(params, setEdges, nodes, edges),
    [setEdges, nodes, edges]
  );

  // Substituir handleNodesChange por repasse direto do onNodesChange
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

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    // Debug: Log global de drag over
    console.log('🌊 GLOBAL DRAG OVER:', {
      clientX: event.clientX,
      clientY: event.clientY,
      types: Array.from(event.dataTransfer.types || [])
    });
    
    // Verifica se há dados sendo arrastados
    const childNodeData = event.dataTransfer.getData('application/reactflow-child');
    const childFromGroupData = event.dataTransfer.getData('application/reactflow-child-from-group');
    const elementData = event.dataTransfer.getData('application/reactflow');
    
    if (childFromGroupData) {
      console.log('🚀 Nó filho sendo arrastado para fora do grupo:', childFromGroupData);
      // Permite o drop no canvas
      event.dataTransfer.dropEffect = 'copy';
    } else if (childNodeData) {
      console.log('🔄 Nó filho sendo arrastado globalmente:', childNodeData);
    }
    if (elementData) {
      try {
        const element = JSON.parse(elementData);
        console.log('📦 Elemento sendo arrastado globalmente:', element.label);
      } catch (err) {
        console.log('📦 Elemento sendo arrastado globalmente (dados inválidos)');
      }
    }
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
          title: `Group #${groupId}`,
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
      };
      
      // Adicionar grupo e componente ao estado
      setNodes((nds) => {
        const newNodes = [...nds, newGroup, newNode];
        addDebugLog('success', 'Grupo e componente criados', {
          group: { id: newGroup.id, title: newGroup.data.title },
          component: { id: newNode.id, type: newNode.type }
        });
        return newNodes;
      });
      
      setNodeId((id) => id + 1);
      setGroupId((id) => id + 1);
      
      console.log('Grupo e componente criados:', { group: newGroup, component: newNode });
    } catch (error) {
      console.error('Erro ao processar drop:', error);
      addDebugLog('error', 'Erro ao processar drop', error);
    }
  }, [nodeId, groupId, setNodes, setNodeId, setGroupId, addDebugLog]);

  // Função para remover elemento do grupo e criar nó independente
  const handleRemoveChildFromGroup = useCallback((
    event: React.DragEvent,
    childNodeId: string,
    childNodeData?: Node
  ) => {
    try {
      // 1️⃣ Busca o nó filho (prioriza parâmetro, senão busca no estado)
      let childNode = childNodeData ?? nodes.find(n => n.id === childNodeId);
      if (!childNode) {
        console.error('❌ Nó filho não encontrado:', childNodeId);
        return;
      }

      // 2️⃣ Identifica o grupo pai
      const parentGroup = nodes.find(n => n.id === childNode.parentId);
      if (!parentGroup) {
        console.error('❌ Grupo pai não encontrado para:', childNodeId);
        return;
      }

      // 3️⃣ Converte a posição da tela para coordenadas do flow (mesmo helper usado em @flow/system)
      const dropPosition = reactFlowRef.current
        ? reactFlowRef.current.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          })
        : {
            x: event.clientX - event.currentTarget.getBoundingClientRect().left,
            y: event.clientY - event.currentTarget.getBoundingClientRect().top,
          };

      console.log('🎯 REMOVENDO ELEMENTO DO GRUPO:', {
        childNodeId: childNode.id,
        childLabel: childNode.data?.label,
        groupId: parentGroup.id,
        groupTitle: parentGroup.data?.title,
        dropPosition,
      });

      // 4️⃣ Cria o nó independente com ID único e limpa referências ao grupo
      const newIndependentNode: Node = {
        ...childNode,
        id: `${childNode.id}-independent-${Date.now()}`,
        position: dropPosition,
        parentId: undefined,
        data: {
          ...childNode.data,
          parentGroupId: undefined,
          isEditing: false,
        },
      };

      // 5️⃣ Atualiza o estado:
      //    • Remove o filho original do array de nós
      //    • Atualiza o grupo removendo o ID do filho de `childNodes`
      //    • Insere o novo nó independente
      setNodes(current => {
        const withoutChild = current.filter(n => n.id !== childNode.id);
        const updatedGroup = withoutChild.map(n =>
          n.id === parentGroup.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  childNodes: (n.data as any)?.childNodes?.filter(
                    (c: any) => c.id !== childNode.id
                  ),
                },
              }
            : n
        );

        const finalNodes = [...updatedGroup, newIndependentNode];

        addDebugLog('success', 'Elemento removido do grupo e tornado independente', {
          originalChildId: childNode.id,
          newIndependentId: newIndependentNode.id,
          groupId: parentGroup.id,
          dropPosition,
          method: 'drag-outside-group',
        });

        return finalNodes;
      });

      // 6️⃣ Limpa estado de arrasto
      setDraggingChildNode(null);
    } catch (error) {
      console.error('❌ Erro ao remover elemento do grupo:', error);
      addDebugLog('error', 'Erro ao remover elemento do grupo', error);
    }
  }, [nodes, setNodes, addDebugLog]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const elementData =
        event.dataTransfer.getData('application/reactflow') ||
        event.dataTransfer.getData('application/json') ||
        event.dataTransfer.getData('text/plain');
      const childNodeData = event.dataTransfer.getData('application/reactflow-child');
      const childFromGroupData = event.dataTransfer.getData('application/reactflow-child-from-group');
      const childNodeDataJson = event.dataTransfer.getData('application/reactflow-child-node-data');
      
      console.log('🎯 DROP EVENT:', {
        hasElementData: !!elementData,
        types: Array.from(event.dataTransfer?.types || []),
        hasChildNodeData: !!childNodeData,
        hasChildFromGroupData: !!childFromGroupData,
        elementLabel: elementData ? (() => {
          try { return JSON.parse(elementData).label; } catch { return 'unknown'; }
          })() : null,
        childNodeId: childNodeData,
        childFromGroupId: childFromGroupData,
        hasChildNodeDataJson: !!childNodeDataJson,
        clientX: event.clientX,
        clientY: event.clientY
      });
      
      // Lida com a retirada de elemento do grupo
      if (childFromGroupData) {
        let parsedChildNodeData: Node | undefined;
        if (childNodeDataJson) {
          try {
            parsedChildNodeData = JSON.parse(childNodeDataJson);
          } catch (error) {
            console.warn('❌ Erro ao parsear childNodeDataJson:', error);
          }
        }
        
        handleRemoveChildFromGroup(event, childFromGroupData, parsedChildNodeData);
        return;
      }
      
      if (!elementData && !childNodeData) {
        console.log('⚠️ Nenhum dado encontrado no drop');
        return;
      }
      
      // Só processa drops globais se não há pendência de grupo
      if (!pendingGroupDrop && !childNodeData) {
        processDrop(event, elementData, reactFlowBounds);
      }
    },
    [nodeId, setNodes, nodes, pendingGroupDrop, processDrop, handleRemoveChildFromGroup, addDebugLog]
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
      addDebugLog('info', 'Grupo criado manualmente', {
        groupId: newGroup.id,
        title: newGroup.data.title,
        position: newGroup.position
      });
      return newNodes;
    });
    setGroupId((id) => id + 1);
  }, [groupId, setNodes, addDebugLog]);

  const nodeColor = useMemo(() => {
    return (node: Node) => {
      switch (node.type) {
        case 'startNode':
          return '#60a5fa';
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
        // Filtra nós filhos de forma estável
        const childNodes = nodes.filter(n => n.parentId === node.id);
        
        // Evita atualizar o data se não houve mudanças significativas nos filhos
        const existingChildIds = (node.data as any)?.childNodesIds || [];
        const newChildIds = childNodes.map(n => n.id).sort();
        
        // Compara apenas os IDs dos filhos para detectar mudanças
        const hasChanged = existingChildIds.length !== newChildIds.length ||
          existingChildIds.some((id: string, index: number) => id !== newChildIds[index]);
        
        return {
          ...node,
          data: hasChanged ? {
            ...node.data,
            childNodes,
            childNodesIds: newChildIds,
            _updateTimestamp: Date.now(),
          } : node.data,
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
    reactFlowRef, // exporta a ref
    debugLogs,
    addDebugLog,
  };
}