import { memo, useState } from 'react';
import { Handle, Position, NodeProps, Node, useSidebarDragPreview } from '@flow/react';
import { Edit3, Plus, Settings } from 'lucide-react';
import { Box, Flex, Text, Input } from '@chakra-ui/react';
import { GroupNodeWithDndKit } from '@/components/flow/dndkit/GroupNodeWithDndKit';
import { useGroup } from './useGroup';

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
        bg={isDragOver ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--flow-node) / 1.0)'}
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
  const groupData = data as unknown as GroupNodeData;
  const [isEditing, setIsEditing] = useState(groupData.isEditing || false);
  const [title, setTitle] = useState(groupData.title || 'Group #1');
  const {
    isDragOver,
    dragOverIndex,
    isDragging,
    draggedChildId,
    setDraggedChildId,
    setIsDragging,
    localChildNodes,
    setLocalChildNodes,
    dragRef,
    setNodeRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useGroup(id, groupData);

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
            variant="outline"
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
            groupId={id}
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
                const nativeEv = (evt as any)?.event as MouseEvent | PointerEvent | TouchEvent | undefined;
                let clientX: number | undefined;
                let clientY: number | undefined;

                if (nativeEv && 'clientX' in nativeEv && 'clientY' in nativeEv) {
                  clientX = (nativeEv as any).clientX;
                  clientY = (nativeEv as any).clientY;
                } else if (nativeEv && 'touches' in nativeEv && (nativeEv as any).touches?.length > 0) {
                  const touch = (nativeEv as any).touches[0];
                  clientX = touch.clientX;
                  clientY = touch.clientY;
                } else {
                  const lp = (window as any).__lastPointer;
                  if (lp) {
                    clientX = lp.x;
                    clientY = lp.y;
                  }
                }

                if (typeof clientX === 'number' && typeof clientY === 'number') {
                  const customEvent = new CustomEvent('groupExtract', {
                    detail: { groupId: id, node: active, clientX, clientY, timestamp: Date.now(), source: 'group-node-extract-final' },
                  });
                  window.dispatchEvent(customEvent);
                } else {
                  const customEvent = new CustomEvent('groupExtract', {
                    detail: { groupId: id, node: active, fallback: true, timestamp: Date.now(), source: 'group-node-extract-error' },
                  });
                  window.dispatchEvent(customEvent);
                }

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
                const reorderEvent = new CustomEvent('childNodeDrop', {
                  detail: {
                    groupId: id,
                    targetIndex: index ?? 0,
                    elementId: active.id,
                  },
                });
                window.dispatchEvent(reorderEvent);
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
