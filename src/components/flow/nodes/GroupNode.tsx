import { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps, Node, useSidebarDragPreview } from '@flow/react';
import { Edit3, Plus, Settings } from 'lucide-react';
import { Box, Flex, Text, Input } from '@chakra-ui/react';

interface GroupNodeData {
  title: string;
  nodes: string[];
  childNodes?: Node[];
  isEditing?: boolean;
}

interface GroupNodeProps extends NodeProps {
  childNodes?: Node[];
}

// Componente para renderizar nós filhos com suporte a drag-over/drop
const GroupChildNode = memo(
  ({
    node,
    index,
    isDragOver,
    hidden,
  }: {
    node: Node;
    index: number;
    isDragOver?: boolean;
    hidden?: boolean;
  }) => {
    const nodeData = node.data as any;
    const { startPreview, stopPreview } = useSidebarDragPreview<{ icon: string; label: string }>({
      render: (payload) => {
        const el = document.createElement('div');
        el.className = 'dragging-previews';
        el.innerHTML = `
          <span style="font-size: 1.5rem;">${payload.icon}</span>
          <span style="font-size: 1rem; color: white; margin-left: 8px;">${payload.label}</span>
        `;
        return el;
      },
    });

    const handleDragStart = (e: React.DragEvent) => {
      // Define o tipo de arrasto como saída do grupo
      e.dataTransfer.setData('application/reactflow-child-from-group', node.id);
      e.dataTransfer.setData('application/reactflow-child', node.id);
      e.dataTransfer.setData('application/reactflow-child-node-data', JSON.stringify(node));
      e.dataTransfer.effectAllowed = 'move';
      
      const invisibleImg = document.createElement('div');
      invisibleImg.style.width = '1px';
      invisibleImg.style.height = '1px';
      invisibleImg.style.opacity = '0';
      document.body.appendChild(invisibleImg);
      e.dataTransfer.setDragImage(invisibleImg, 0, 0);
      setTimeout(() => document.body.removeChild(invisibleImg), 0);

      startPreview(e.nativeEvent, {
        icon: nodeData.element?.icon || '📄',
        label: nodeData.label,
      });
      
      console.log(`🚀 Iniciando arrasto do elemento "${nodeData.label}" (${node.id}) para fora do grupo`);
      
      // Dispara evento global para notificar que um elemento do grupo está sendo arrastado
      const dragStartEvent = new CustomEvent('childNodeDragStart', {
        detail: {
          childNodeId: node.id,
          groupId: node.parentId,
          nodeData: node,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(dragStartEvent);
    };

    return (
      <Box
        position="relative"
        w="full"
        p="3"
        borderRadius="lg"
        borderWidth="1px"
        borderColor={isDragOver ? 'hsl(var(--primary))' : 'hsl(var(--border) / 0.3)'}
        bg={isDragOver ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--flow-node) / 0.8)'}
        transition="all 0.2s"
        boxShadow={isDragOver ? 'lg' : 'none'}
        opacity={0.9}
        className="nodrag"
        draggable
        onDragStart={handleDragStart}
        onDragEnd={(e) => {
          console.log(`✅ Arrasto do elemento "${nodeData.label}" (${node.id}) finalizado`);
          stopPreview();
        }}
        style={{ visibility: hidden ? 'hidden' : 'visible' }}
      >
        <Flex align="center" gap="2" mb="2">
          <Text fontSize="sm">{nodeData.element?.icon}</Text>
          <Text fontSize="xs" fontWeight="medium" color="hsl(var(--foreground))">
            {nodeData.label}
          </Text>
          <Box as="span" fontSize="xs" color="hsl(var(--muted-foreground))" bg="hsl(var(--muted))" px="1" py="0.5" borderRadius="sm">
            Grupo
          </Box>
        </Flex>

        <Text fontSize="xs" color="hsl(var(--muted-foreground))">
          {nodeData.content || 'Clique para editar...'}
        </Text>
      </Box>
    );
  }
);

export const GroupNode = memo(({ data, id, selected }: GroupNodeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false); // novo estado para controlar preview
  const [isPreviewStable, setIsPreviewStable] = useState(false); // novo estado para preview estável
  const groupData = data as unknown as GroupNodeData;
  const [isEditing, setIsEditing] = useState(groupData.isEditing || false);
  const [title, setTitle] = useState(groupData.title || 'Group #1');
  const [localChildNodes, setLocalChildNodes] = useState<Node[]>(groupData.childNodes || []);
  const dragRef = useRef<HTMLDivElement>(null);
  const [draggedChildId, setDraggedChildId] = useState<string | null>(null);
  const draggedChildNodeRef = useRef<Node | null>(null);
  const previousDragOverIndexRef = useRef<number>(-1); // Para comparar índices
  // NOVO: Armazenar a calculatedPosition para posicionamento exato
  const [calculatedPosition, setCalculatedPosition] = useState<{x: number, y: number} | null>(null);
  
  // Usar ref para armazenar o timestamp da última atualização
  const lastUpdateRef = useRef<number>((groupData as any)._updateTimestamp || 0);

  useEffect(() => {
    // Só atualiza se houver mudanças reais nos filhos e não estiver em modo de preview
    if (!isPreviewMode && groupData.childNodes) {
      const currentTimestamp = (groupData as any)._updateTimestamp || 0;
      
      // Evita atualizações desnecessárias se não houve mudanças significativas
      if (currentTimestamp > lastUpdateRef.current) {
        setLocalChildNodes(groupData.childNodes);
        lastUpdateRef.current = currentTimestamp;
      }
    }
  }, [groupData.childNodes, (groupData as any)._updateTimestamp, isPreviewMode]);

  useEffect(() => {
    // Escuta global para detectar drag em andamento
    const handleDragStart = (e: any) => {
      setIsDragging(true);
      // Detecta se é um nó filho sendo arrastado
      if (e && e.dataTransfer) {
        const childId = e.dataTransfer.getData('application/reactflow-child');
        if (childId) setDraggedChildId(childId);
      }
    };
    const handleDragEnd = () => {
      setIsDragging(false);
      setDraggedChildId(null);
    };
    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('dragend', handleDragEnd);
    const onChildNodeDragStart = (ev: any) => {
      const detail = ev?.detail || {};
      if (detail.childNodeId) {
        setIsDragging(true);
        setDraggedChildId(detail.childNodeId);
        draggedChildNodeRef.current = detail.nodeData as Node;
        setIsPreviewMode(true);
        setIsPreviewStable(true);
      }
    };
    window.addEventListener('childNodeDragStart', onChildNodeDragStart as any);
    return () => {
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('dragend', handleDragEnd);
      window.removeEventListener('childNodeDragStart', onChildNodeDragStart as any);
    };
  }, []);

  useEffect(() => {
    // Reseta preview estável quando um novo drag é detectado
    const handleNewDragStart = () => {
      if (isPreviewStable) {
        setIsPreviewStable(false);
        console.log('🔄 PREVIEW ESTÁVEL RESETADO (novo drag detectado) no grupo:', title);
      }
    };

    window.addEventListener('dragstart', handleNewDragStart);
    return () => {
      window.removeEventListener('dragstart', handleNewDragStart);
    };
  }, [isPreviewStable, title]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleTitleSave = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    
    // LÓGICA DE PREVIEW ESTÁVEL: Só ativa preview se não estiver estável ainda
    if (!isPreviewStable) {
      setIsPreviewMode(true);
      setIsPreviewStable(true);
      console.log('🔒 PREVIEW ESTABILIZADO para grupo:', title);
    }
    
    const draggedNodeId = e.dataTransfer.getData('application/reactflow-child');
    const elementData = e.dataTransfer.getData('application/reactflow');
    
    // Calcular a posição exata do preview (calculatedPosition)
    const groupRect = e.currentTarget.getBoundingClientRect();
    const mouseXInGroup = e.clientX - groupRect.left;
    const mouseYInGroup = e.clientY - groupRect.top;
    
    // Calcular posição considerando header e padding
    const previewPosition = {
      x: Math.max(16, Math.min(mouseXInGroup, groupRect.width - 180)),
      y: Math.max(80, Math.min(mouseYInGroup, groupRect.height - 80))
    };
    
    // Atualizar calculatedPosition se mudou significativamente
    const currentPos = calculatedPosition;
    if (!currentPos ||
        Math.abs(currentPos.x - previewPosition.x) > 5 ||
        Math.abs(currentPos.y - previewPosition.y) > 5) {
      setCalculatedPosition(previewPosition);
      console.log('🎯 CALCULATED POSITION ATUALIZADA:', previewPosition);
    }
    
    // Calcular índice de drop baseado na posição Y
    let newIndex = 0;
    if (localChildNodes.length > 0) {
      const offsetY = e.clientY - groupRect.top;
      const itemHeight = 88; // altura padrão dos componentes
      newIndex = Math.floor((offsetY - 80) / itemHeight);
      newIndex = Math.max(0, Math.min(newIndex, localChildNodes.length));
    }
    
    // Atualizar dragOverIndex se mudou
    if (newIndex !== previousDragOverIndexRef.current) {
      console.log(`🎯 DropIndex alterado: ${previousDragOverIndexRef.current} → ${newIndex}`);
      previousDragOverIndexRef.current = newIndex;
    }
    
    setDragOverIndex(newIndex);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Verifica se realmente saiu do grupo (não apenas mudou para um divider interno)
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      const isLeavingGroup =
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom;
      
      // Log quando sai do foco do grupo
      if (isLeavingGroup && isDragOver) {
        const draggedNodeId = e.dataTransfer.getData('application/reactflow-child');
        const isChildNode = draggedNodeId !== '';
        
        if (isChildNode) {
          console.log(`❌ Nó filho '${draggedNodeId}' saiu do foco do grupo '${title}'`);
          // NÃO removemos o child da lista local aqui.
          // Mantemos apenas oculto via 'hidden' enquanto o drag estiver ativo,
          // evitando que o elemento desapareça caso o drop ocorra fora do grupo
          // e falhe por qualquer motivo.
          const removedEv = new CustomEvent('childNodeViewRemoved', {
            detail: { groupId: id, childNodeId: draggedNodeId }
          });
          window.dispatchEvent(removedEv);
        } else {
          const elementData = e.dataTransfer.getData('application/reactflow');
          if (elementData) {
            try {
              const element = JSON.parse(elementData);
              console.log(`❌ Elemento '${element.label}' saiu do foco do grupo '${title}'`);
            } catch (err) {
              console.log(`❌ Elemento saiu do foco do grupo '${title}'`);
            }
          }
        }
      }
      
      // Só reseta os estados se realmente saiu do grupo
      if (isLeavingGroup) {
        setIsDragOver(false);
        setDragOverIndex(-1);
        setIsPreviewMode(false); // Desativa modo preview
        setIsPreviewStable(false); // Reseta preview estável
        console.log('🔓 PREVIEW ESTÁVEL RESETADO para grupo:', title);
        previousDragOverIndexRef.current = -1; // Reset para próxima vez
      }
    } else {
      // Fallback se não conseguir verificar a posição
      setIsDragOver(false);
      setDragOverIndex(-1);
      setIsPreviewMode(false);
      setIsPreviewStable(false);
      previousDragOverIndexRef.current = -1;
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // RESET DOS ESTADOS DE PREVIEW
    setIsDragOver(false);
    setIsPreviewMode(false);
    setIsPreviewStable(false);
    console.log('🔓 PREVIEW ESTÁVEL RESETADO após DROP no grupo:', title);
    previousDragOverIndexRef.current = -1;
    
    const elementData = e.dataTransfer.getData('application/reactflow');
    if (elementData) {
      // USAR AS COORDENADAS JÁ CALCULADAS DURANTE O PREVIEW
      const finalDropIndex = dragOverIndex >= 0 ? dragOverIndex : 0;
      
      // Usar calculatedPosition direta, sem re-calcular
      const finalPosition = calculatedPosition || { x: 16, y: 120 }; // fallback
      
      console.log('🎯 DROP USANDO CALCULATED POSITION:', {
        calculatedPosition: finalPosition,
        dropIndex: finalDropIndex,
        isConsistent: true
      });
      
      // Dispara evento com dados consistentes do preview
      const customEvent = new CustomEvent('groupDrop', {
        detail: {
          groupId: id,
          elementData: elementData,
          // USAR calculatedPosition como posição final
          calculatedPosition: finalPosition,
          dropIndex: finalDropIndex,
          // Mantém dados originais para compatibilidade
          mouseRelativePosition: finalPosition,
          debug: {
            groupTitle: title,
            timestamp: Date.now(),
            method: 'calculated-position-consistent'
          }
        },
      });
      window.dispatchEvent(customEvent);
      
      console.log('✅ Evento groupDrop com posição consistente:', {
        groupId: id,
        finalPosition,
        dropIndex: finalDropIndex
      });
    }
    
    // Se for um nó filho sendo movido dentro do grupo
    const draggedNodeId = e.dataTransfer.getData('application/reactflow-child');
    if (draggedNodeId) {
      const draggedExisting = localChildNodes.find((node) => node.id === draggedNodeId);
      const draggedNode = draggedExisting || draggedChildNodeRef.current;
      if (draggedNode) {
        const updatedNodes = [...localChildNodes];
        const draggedIndex = updatedNodes.findIndex((node) => node.id === draggedNodeId);
        if (draggedIndex !== -1) {
          updatedNodes.splice(draggedIndex, 1);
        }
        const insertIndex = dragOverIndex >= 0 ? dragOverIndex : updatedNodes.length;
        updatedNodes.splice(insertIndex, 0, draggedNode);
        setLocalChildNodes(updatedNodes);

        const customEvent = new CustomEvent('childNodeDrop', {
          detail: {
            groupId: id,
            targetIndex: insertIndex,
            elementId: draggedNodeId,
            updatedNodes: updatedNodes,
            position: {
              x: e.clientX,
              y: e.clientY,
            },
          },
        });
        window.dispatchEvent(customEvent);
      }
    }
    
    // Reset calculatedPosition após drop
    setCalculatedPosition(null);
    setDragOverIndex(-1);
    draggedChildNodeRef.current = null;
  };

  return (
    <Box
      position="relative"
      minW="280px"
      minH="120px"
      p="4"
      borderRadius="xl"
      borderWidth="2px"
      bg={'hsl(var(--flow-group))'}
      transition="all 0.2s"
      boxShadow={isDragOver ? '2xl' : selected ? 'lg' : 'none'}
      borderColor={selected || isDragOver ? 'hsl(var(--primary))' : 'hsl(var(--border) / 0.3)'}
      zIndex={isDragOver ? 20 : 'auto'}
      role="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Flex align="center" justify="space-between" mb="4" pb="2" borderBottom="1px solid hsl(var(--border) / 0.2)">
        {isEditing ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleKeyDown}
            fontSize="sm"
            fontWeight="semibold"
            variant="unstyled"
            size="sm"
            h="1.25rem"
            lineHeight="1.25rem"
            py={0}
            px={0}
            bg="transparent"
            border={0}
            outline="none"
            color="hsl(var(--foreground))"
            autoFocus
          />
        ) : (
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="hsl(var(--foreground))"
            cursor="pointer"
            onClick={handleEditClick}
          >
            {title}
          </Text>
        )}

        <Flex
          align="center"
          gap="1"
          opacity={selected || isHovered ? 1 : 0}
          transition="opacity 0.2s"
        >
          <button className="icones" onClick={handleEditClick} style={{ padding: 4, borderRadius: 6 }}>
            <Edit3 className="w-3 h-3" />
          </button>
          <button className="icones" style={{ padding: 4, borderRadius: 6 }}>
            <Settings className="w-3 h-3" />
          </button>
        </Flex>
      </Flex>

      <Box
        ref={dragRef as any}
        className={`${isDragOver ? 'view' : 'view'} nodrag`}
      >
        {localChildNodes && localChildNodes.length > 0 ? (
          <Box className="view-content">
            {/* Divider no topo */}
            {(() => {
              if (localChildNodes.length === 0) return null;
              let isActive = dragOverIndex === 0;
              if (
                draggedChildId &&
                localChildNodes[0]?.id === draggedChildId &&
                dragOverIndex === 0
              ) {
                isActive = false;
              }
              // Se está em dragOver e não há dragOverIndex, manter o divider topo aberto
              if (isDragOver && dragOverIndex === -1 && localChildNodes.length > 0) {
                isActive = true;
              }
              return <DividerWithHover isDragging={isDragging} isActive={isActive} />;
            })()}
            {/* Renderiza filhos e dividers abaixo de cada filho */}
            {localChildNodes.map((childNode, index) => {
              let isActive = dragOverIndex === index + 1;
              if (draggedChildId && childNode.id === draggedChildId && dragOverIndex === index + 1) {
                isActive = false;
              }
              return (
                <Box
                  key={childNode.id + '-' + index}
                  className={`view-child ${draggedChildId === childNode.id ? 'no-space' : ''}`}
                >
                  <GroupChildNode
                    node={childNode}
                    index={index}
                    isDragOver={false}
                    hidden={draggedChildId === childNode.id}
                  />
                  <DividerWithHover
                    isDragging={isDragging}
                    isActive={isActive}
                    extraClass={draggedChildId === childNode.id ? 'close' : ''}
                  />
                </Box>
              );
            })}
          </Box>
        ) : (
          <Flex align="center" justify="center" color="hsl(var(--muted-foreground))" fontSize="sm" py="4" mt="2" mb="2">
            <Box textAlign="center">
              <Plus className="w-5 h-5" style={{ margin: '0 auto', marginBottom: '4px', opacity: 0.5 }} />
              <Text opacity={0.7}>Arraste elementos aqui</Text>
            </Box>
          </Flex>
        )}
      </Box>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 border-2 border-primary bg-background transition-transform"
        style={{ top: '-1px', width: 7 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 border-2 border-primary bg-background transition-transform"
        style={{ bottom: '-1px', width: 7 }}
      />
    </Box>
  );
});

function DividerWithHover({
  isDragging,
  isActive,
  extraClass,
}: {
  isDragging: boolean;
  isActive: boolean;
  extraClass?: string;
}) {
  return (
    <div
      className={`view-divider ${isActive && isDragging ? 'active' : ''} ${extraClass || ''}`}
    />
  );
}
