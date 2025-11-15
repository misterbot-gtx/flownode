import { memo, useState, useEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Handle, Position, NodeProps, Node, useSidebarDragPreview } from '@flow/react';
import { Edit3, Plus, Settings } from 'lucide-react';
import { Box, Flex, Text, Input } from '@chakra-ui/react';
import { GroupNodeWithDndKit } from '@/components/flow/dndkit/GroupNodeWithDndKit';

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
        className={`nodrag ${hidden ? 'dragging-hidden' : ''}`}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={(e) => {
          console.log(`✅ Arrasto do elemento "${nodeData.label}" (${node.id}) finalizado`);
          stopPreview();
        }}
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
  const [calculatedPosition, setCalculatedPosition] = useState<{ x: number, y: number } | null>(null);
  const { setNodeRef } = useDroppable({ id });

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
    const onSidebarDragStart = () => setIsDragging(true);
    const onSidebarDragEnd = () => setIsDragging(false);
    window.addEventListener('sidebarDragStart', onSidebarDragStart as any);
    window.addEventListener('sidebarDragEnd', onSidebarDragEnd as any);
    const onChildNodeDragStart = (ev: any) => {
      const detail = ev?.detail || {};
      if (detail.childNodeId) {
        // Atualiza o estado, mas adia a renderização visual por 1 frame
        // para não interferir no arrasto
        setIsDragging(true);
        draggedChildNodeRef.current = detail.nodeData as Node;
        setIsPreviewMode(true);
        setIsPreviewStable(true);

        // Adia a atribuição de draggedChildId por 1 frame
        setTimeout(() => {
          setDraggedChildId(detail.childNodeId);
          console.log(`🎯 Visual do filho "${detail.childNodeId}" será ocultado após estabilização`);
        }, 0);
      }
    };
    window.addEventListener('childNodeDragStart', onChildNodeDragStart as any);
    return () => {
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('dragend', handleDragEnd);
      window.removeEventListener('sidebarDragStart', onSidebarDragStart as any);
      window.removeEventListener('sidebarDragEnd', onSidebarDragEnd as any);
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

    const childrenEls = Array.from(dragRef.current?.querySelectorAll('.view-child') || []).filter((el) => !el.classList.contains('no-space')) as HTMLElement[];
    let newIndex = 0;
    for (let i = 0; i < childrenEls.length; i++) {
      const r = childrenEls[i].getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (e.clientY < mid) { newIndex = i; break; }
      newIndex = i + 1;
    }

    // Atualizar dragOverIndex se mudou
    if (newIndex !== previousDragOverIndexRef.current) {
      console.log(`🎯 DropIndex alterado: ${previousDragOverIndexRef.current} → ${newIndex}`);
      previousDragOverIndexRef.current = newIndex;
    }

    setDragOverIndex(newIndex);
  };

  useEffect(() => {
    const onGroupPreview = (ev: any) => {
      const detail = ev?.detail || {};
      if (detail.groupId !== id) return;
      setIsDragOver(true);
      if (!isPreviewStable) {
        setIsPreviewMode(true);
        setIsPreviewStable(true);
      }
      const rect = dragRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseXInGroup = detail.clientX - rect.left;
      const mouseYInGroup = detail.clientY - rect.top;
      const previewPosition = {
        x: Math.max(16, Math.min(mouseXInGroup, rect.width - 180)),
        y: Math.max(80, Math.min(mouseYInGroup, rect.height - 80))
      };
      setCalculatedPosition(previewPosition);
      const childrenEls = Array.from(dragRef.current?.querySelectorAll('.view-child') || []).filter((el) => !el.classList.contains('no-space')) as HTMLElement[];
      let newIndex = 0;
      for (let i = 0; i < childrenEls.length; i++) {
        const r = childrenEls[i].getBoundingClientRect();
        const mid = r.top + r.height / 2;
        if (detail.clientY < mid) { newIndex = i; break; }
        newIndex = i + 1;
      }
      if (newIndex !== previousDragOverIndexRef.current) {
        previousDragOverIndexRef.current = newIndex;
      }
      setDragOverIndex(newIndex);
    };
    const onGroupPreviewLeave = (ev: any) => {
      const detail = ev?.detail || {};
      if (detail.groupId !== id) return;
      setIsDragOver(false);
      setDragOverIndex(-1);
      setIsPreviewMode(false);
      setIsPreviewStable(false);
      previousDragOverIndexRef.current = -1;
    };
    window.addEventListener('groupDndPreview', onGroupPreview as any);
    window.addEventListener('groupDndPreviewLeave', onGroupPreviewLeave as any);
    return () => {
      window.removeEventListener('groupDndPreview', onGroupPreview as any);
      window.removeEventListener('groupDndPreviewLeave', onGroupPreviewLeave as any);
    };
  }, [id, localChildNodes, isPreviewStable, calculatedPosition]);

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

      <Box ref={(el) => { (dragRef as any).current = el; setNodeRef(el as any); }} className={`${isDragOver ? 'view' : 'view'} nodrag`}>
        {localChildNodes && localChildNodes.length > 0 ? (
          <GroupNodeWithDndKit
            localChildNodes={localChildNodes}
            draggedChildId={draggedChildId}
            isDragOver={isDragOver}
            dragOverIndex={dragOverIndex}
            isDragging={isDragging}
            onDragStart={(node) => {
              setDraggedChildId(node.id);
              setIsDragging(true);
            }}
            onDragEnd={() => {
              setDraggedChildId(null);
              setIsDragging(false);
            }}
            onDrop={(active, overId, index, evt) => {
              if (!overId) {
                // soltou fora do grupo → extrair para o canvas
                const nativeEv = (evt as any)?.event as MouseEvent | PointerEvent | TouchEvent | undefined;
                const clientX = nativeEv && 'clientX' in nativeEv ? (nativeEv as any).clientX : undefined;
                const clientY = nativeEv && 'clientY' in nativeEv ? (nativeEv as any).clientY : undefined;
                const customEvent = new CustomEvent('groupExtract', {
                  detail: { groupId: id, node: active, clientX, clientY },
                });
                window.dispatchEvent(customEvent);
                // remove da lista local
                setLocalChildNodes((prev) => prev.filter((n) => n.id !== active.id));
              } else {
                // soltou dentro do grupo → reordenar
                setLocalChildNodes((prev) => {
                  const copy = [...prev];
                  const from = copy.findIndex((n) => n.id === active.id);
                  if (from === -1) return prev;
                  const [removed] = copy.splice(from, 1);
                  const to = index ?? copy.length;
                  copy.splice(to, 0, removed);
                  return copy;
                });
              }
            }}
          />
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

export function DividerWithHover({
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
