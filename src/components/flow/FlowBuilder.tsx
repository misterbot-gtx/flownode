import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  MiniMap,
  Node,
  BackgroundVariant,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { FlowSidebar } from './FlowSidebar';
import { FlowNode } from './nodes/FlowNode';
import { GroupNode } from './nodes/GroupNode';
import { FlowElement } from '@/types/flow';
import { handleConnect } from './flowConnectionHandler';

const nodeTypes = {
  flowNode: FlowNode,
  groupNode: GroupNode,
};

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'flowNode',
    position: { x: 400, y: 100 },
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

export function FlowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(1);
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const [pendingGroupDrop, setPendingGroupDrop] = useState<{
    groupId: string;
    elementData: string;
    position: { x: number; y: number };
  } | null>(null);

  // Listener para drops diretos no grupo
  useEffect(() => {
    const handleGroupDrop = (event: CustomEvent) => {
      console.log('Group drop event received:', event.detail);
      setPendingGroupDrop(event.detail);
    };

    window.addEventListener('groupDrop', handleGroupDrop as EventListener);
    
    return () => {
      window.removeEventListener('groupDrop', handleGroupDrop as EventListener);
    };
  }, []);

  // Processar drop pendente quando o estado mudar
  useEffect(() => {
    if (pendingGroupDrop) {
      console.log('Processing pending group drop:', pendingGroupDrop);
      
      try {
        const element = JSON.parse(pendingGroupDrop.elementData) as FlowElement;
        const targetGroup = nodes.find(n => n.id === pendingGroupDrop.groupId);
        
        if (targetGroup) {
          console.log('✅ Processing drop for group:', targetGroup.id);
          
          // Calcular posição baseada no número de filhos existentes
          const existingChildren = nodes.filter(n => n.parentId === targetGroup.id);
          const childIndex = existingChildren.length;
          
          // Posicionar em uma grade simples dentro do grupo
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
          
          const newNode: Node = {
            id: `${element.type}-${nodeId}`,
            type: 'flowNode',
            position: finalPosition,
            data: {
              label: element.label,
              element,
            },
            parentId: targetGroup.id,
          };
          
          console.log('Creating new node from group drop:', newNode);
          
          setNodes((nds) => {
            const newNodes = nds.concat(newNode);
            console.log('Updated nodes from group drop:', newNodes);
            console.log('Child nodes for target group:', newNodes.filter(n => n.parentId === targetGroup.id));
            return newNodes;
          });
          setNodeId((id) => id + 1);
        }
      } catch (error) {
        console.error('Error processing group drop:', error);
      }
      
      setPendingGroupDrop(null);
    }
  }, [pendingGroupDrop, nodes, nodeId, setNodes]);

  // Limpar estado pendente após um tempo se não for processado
  useEffect(() => {
    if (pendingGroupDrop) {
      const timeout = setTimeout(() => {
        console.log('Clearing pending group drop due to timeout');
        setPendingGroupDrop(null);
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [pendingGroupDrop]);

  const onConnect = useCallback(
    (params: Connection) => handleConnect(params, setEdges),
    [setEdges]
  );

  // Handler personalizado para impedir movimento de nós filhos
  const handleNodesChange = useCallback(
    (changes: any[]) => {
      const processedChanges: any[] = [];

      changes.forEach((change) => {
        // Se for uma mudança de posição
        if (change.type === 'position') {
          const node = nodes.find((n) => n.id === change.id);
          
          if (node && node.parentId) {
            // Se é um nó filho sendo arrastado, mover o grupo pai
            if (change.dragging) {
              console.log('Movendo grupo pai devido ao drag do nó filho:', node.parentId);
              
              // Calcular a diferença de posição
              const deltaX = change.position.x - node.position.x;
              const deltaY = change.position.y - node.position.y;
              
              // Encontrar o grupo pai
              const parentGroup = nodes.find((n) => n.id === node.parentId);
              if (parentGroup) {
                // Mover o grupo pai
                processedChanges.push({
                  type: 'position',
                  id: parentGroup.id,
                  position: {
                    x: parentGroup.position.x + deltaX,
                    y: parentGroup.position.y + deltaY,
                  },
                  dragging: true,
                });
              }
            }
            
            // Não aplicar a mudança original do nó filho
            return;
          }
        }
        
        // Para outras mudanças, permitir
        processedChanges.push(change);
      });

      // Aplicar as mudanças processadas
      onNodesChange(processedChanges);
    },
    [nodes, onNodesChange]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const elementData = event.dataTransfer.getData('application/reactflow');

      console.log('Drop event triggered');
      console.log('Element data:', elementData);

      if (!elementData) {
        console.log('No element data found');
        return;
      }

      // Aguardar um pouco para ver se há um drop pendente no grupo
      setTimeout(() => {
        if (pendingGroupDrop) {
          console.log('Skipping main drop handler due to pending group drop');
          return;
        }
        
        // Processar o drop normal aqui
        processDrop(event, elementData, reactFlowBounds);
      }, 50); // Aumentei o timeout para dar mais tempo para o drop no grupo ser processado
    },
    [nodeId, setNodes, nodes, pendingGroupDrop]
  );

  // Função separada para processar o drop
  const processDrop = useCallback((
    event: React.DragEvent,
    elementData: string,
    reactFlowBounds: DOMRect
  ) => {
    try {
      const element = JSON.parse(elementData) as FlowElement;
        
        // Calcular posição relativa ao canvas usando as transformações do ReactFlow
        let dropPosition;
        
        if (reactFlowRef.current) {
          // Usar o método do ReactFlow para converter coordenadas do viewport para coordenadas do canvas
          const reactFlowInstance = reactFlowRef.current;
          const point = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });
          dropPosition = point;
          console.log('Using ReactFlow coordinate conversion');
        } else {
          // Fallback para o método anterior
          dropPosition = {
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
          };
          console.log('Using fallback coordinate calculation');
        }

        console.log('Drop position:', dropPosition);
        console.log('ReactFlow bounds:', reactFlowBounds);

        // Verificar se o drop foi feito dentro de algum grupo
        const groupNodes = nodes.filter(node => node.type === 'groupNode');
        console.log('Available groups:', groupNodes);
        console.log('Total nodes:', nodes.length);
        console.log('Group nodes count:', groupNodes.length);
        
        let targetGroup = null;
        
        // Primeiro, tentar encontrar o grupo usando as coordenadas
        for (const node of groupNodes) {
          // Calcular altura dinâmica baseada no número de filhos
          const childNodes = nodes.filter(n => n.parentId === node.id);
          const baseHeight = 160; // Altura base do grupo
          const childHeight = childNodes.length * 80; // Altura estimada por filho
          const groupHeight = Math.max(baseHeight, childHeight);
          
          // Dimensões do grupo
          const groupWidth = 320; // Largura fixa
          
          // Adicionar uma pequena margem de tolerância
          const tolerance = 10; // Aumentei a tolerância
          
          const isInsideGroup = 
            dropPosition.x >= (node.position.x - tolerance) &&
            dropPosition.x <= (node.position.x + groupWidth + tolerance) &&
            dropPosition.y >= (node.position.y - tolerance) &&
            dropPosition.y <= (node.position.y + groupHeight + tolerance);
          
          console.log(`Checking group ${node.id}:`, {
            groupPos: node.position,
            groupBounds: {
              x: [node.position.x - tolerance, node.position.x + groupWidth + tolerance],
              y: [node.position.y - tolerance, node.position.y + groupHeight + tolerance]
            },
            dropPos: dropPosition,
            isInside: isInsideGroup,
            childCount: childNodes.length,
            calculatedHeight: groupHeight,
            tolerance
          });
          
          if (isInsideGroup) {
            targetGroup = node;
            break;
          }
        }
        
        // Se não encontrou nenhum grupo, não usar fallback - deixar o nó no canvas
        if (!targetGroup) {
          console.log('No group found by coordinates - adding node to canvas');
        }

        console.log('Target group:', targetGroup);

        // Calcular posição final do novo nó
        let finalPosition = dropPosition;
        let parentId: string | undefined = undefined;

        if (targetGroup) {
          console.log('✅ Group found! Adding node to group:', targetGroup.id);
          
          // Se foi dropado dentro de um grupo, calcular posição relativa ao grupo
          // Calcular posição baseada no número de filhos existentes
          const existingChildren = nodes.filter(n => n.parentId === targetGroup.id);
          const childIndex = existingChildren.length;
          
          // Posicionar em uma grade simples dentro do grupo
          const padding = 16;
          const childWidth = 250;
          const childHeight = 80;
          const maxChildrenPerRow = 1; // Uma coluna
          
          const row = Math.floor(childIndex / maxChildrenPerRow);
          const col = childIndex % maxChildrenPerRow;
          
          const relativeX = padding + (col * (childWidth + 8));
          const relativeY = 80 + (row * (childHeight + 8)); // 80px para o header
          
          // Calcular posição absoluta no canvas (posição do grupo + posição relativa)
          finalPosition = {
            x: targetGroup.position.x + relativeX,
            y: targetGroup.position.y + relativeY,
          };
          parentId = targetGroup.id;
          console.log('Node will be added to group:', targetGroup.id, 'at position:', finalPosition);
          console.log('Group position:', targetGroup.position, 'Relative position:', { x: relativeX, y: relativeY });
        } else {
          console.log('❌ No group found. Adding node to canvas at:', dropPosition);
        }

        const newNode: Node = {
          id: `${element.type}-${nodeId}`,
          type: 'flowNode',
          position: finalPosition,
          data: {
            label: element.label,
            element,
          },
          parentId: parentId,
        };

        console.log('Creating new node:', newNode);
        console.log('New node parentId:', parentId);
        console.log('Target group ID:', targetGroup?.id);

        setNodes((nds) => {
          const newNodes = nds.concat(newNode);
          console.log('Updated nodes:', newNodes);
          console.log('Nodes with parentId:', newNodes.filter(n => n.parentId));
          console.log('Child nodes for target group:', newNodes.filter(n => n.parentId === targetGroup?.id));
          return newNodes;
        });
        setNodeId((id) => id + 1);
        
        console.log('Node created successfully');
      } catch (error) {
        console.error('Error creating node:', error);
      }
    },
    [nodeId, setNodes, nodes]
  );

  // Create group function
  const createGroup = useCallback(() => {
    const newGroup: Node = {
      id: `group-${nodeId}`,
      type: 'groupNode',
      position: { x: 200, y: 200 },
      data: {
        title: `Group #${nodeId}`,
        nodes: [],
      },
    };

    setNodes((nds) => nds.concat(newGroup));
    setNodeId((id) => id + 1);
  }, [nodeId, setNodes]);

  const nodeColor = useMemo(() => {
    return (node: Node) => {
      switch (node.type) {
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

  // Filtrar nós para ocultar os filhos dos grupos do ReactFlow
  const visibleNodes = useMemo(() => {
    const filtered = nodes.filter(node => !node.parentId);
    console.log('Filtered visible nodes:', filtered.length, filtered.map(n => ({ id: n.id, type: n.type })));
    return filtered;
  }, [nodes]);

  // Preparar dados dos grupos com seus nós filhos
  const processedNodes = useMemo(() => {
    console.log('Processing nodes - Total nodes:', nodes.length);
    console.log('Visible nodes:', visibleNodes.length);
    
    return visibleNodes.map(node => {
      if (node.type === 'groupNode') {
        // Encontrar todos os nós filhos deste grupo
        const childNodes = nodes.filter(n => n.parentId === node.id);
        console.log(`Group ${node.id} - childNodes found:`, childNodes.length, childNodes);
        
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

  return (
    <div 
      className="flex h-screen bg-flow-canvas"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <FlowSidebar />
      
      <div className="flex-1 relative">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button
            onClick={createGroup}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors shadow-lg"
          >
            Criar Grupo
          </button>
        </div>

        <ReactFlow
          nodes={processedNodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onInit={(instance) => {
            reactFlowRef.current = instance;
          }}
          fitView
          className="bg-flow-canvas"
          attributionPosition="bottom-left"
        >
          <Controls 
            className="bg-flow-node border-none border-border/20 rounded-lg shadow-lg"
            position="bottom-right"
          />
          <MiniMap 
            nodeColor={nodeColor}
            className="bg-flow-node border border-border/20 rounded-lg shadow-lg"
            position="bottom-left"
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#374151"
          />
        </ReactFlow>
      </div>
    </div>
  );
}