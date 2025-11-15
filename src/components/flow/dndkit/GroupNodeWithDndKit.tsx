import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import { Node } from '@flow/react';
import { DraggableChildNode } from './DraggableChildNode';
import { Box, Flex, Text } from '@chakra-ui/react';
import { DividerWithHover } from '../nodes/GroupNode';
import { createPortal } from 'react-dom';

interface GroupNodeWithDndKitProps {
  localChildNodes: Node[];
  draggedChildId: string | null;
  isDragOver: boolean;
  dragOverIndex: number;
  isDragging: boolean;
  onDragStart: (node: Node) => void;
  onDragEnd: () => void;
  onDrop: (active: Node, overId?: string, index?: number) => void;
}

export const GroupNodeWithDndKit = ({
  localChildNodes,
  draggedChildId,
  isDragOver,
  dragOverIndex,
  isDragging,
  onDragStart,
  onDragEnd,
  onDrop,
}: GroupNodeWithDndKitProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const node = localChildNodes.find((n) => n.id === active.id);
    if (node) onDragStart(node);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    onDragEnd();
    if (!over) {
      // soltou fora do grupo → extrair para o canvas
      const node = localChildNodes.find((n) => n.id === active.id);
      if (node) onDrop(node);
      return;
    }
    // soltou dentro do grupo → reordenar (opcional)
    const overId = over.id as string;
    const overIndex = localChildNodes.findIndex((n) => n.id === overId);
    const node = localChildNodes.find((n) => n.id === active.id);
    if (node && overIndex !== -1) onDrop(node, overId, overIndex);
  };

  const activeNode = activeId ? localChildNodes.find((n) => n.id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SortableContext items={localChildNodes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
        <Box className="view-content">
          {/* Divider no topo */}
          {localChildNodes.length > 0 && (
            <DividerWithHover
              isDragging={isDragging}
              isActive={dragOverIndex === 0 && draggedChildId !== localChildNodes[0]?.id}
            />
          )}
          {localChildNodes.map((childNode, index) => {
            const isHidden = draggedChildId === childNode.id;
            const isActive = dragOverIndex === index + 1 && draggedChildId !== childNode.id;
            return (
              <Box key={childNode.id} className={`view-child ${isHidden ? 'no-space' : ''}`}>
                <DraggableChildNode
                  node={childNode}
                  index={index}
                  isDragOver={isDragOver}
                  hidden={isHidden}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                />
                <DividerWithHover isDragging={isDragging} isActive={isActive} />
              </Box>
            );
          })}
        </Box>
      </SortableContext>
      {typeof document !== 'undefined'
        ? createPortal(
            <DragOverlay>
              {activeNode ? (
                <Box
                  className="dragging-previews"
                  style={{
                    width: '18rem',
                    border: '3px solid #ea580c',
                    background: 'rgb(24 24 27)',
                    opacity: 1,
                    borderRadius: 8,
                    filter: 'none',
                    transform: 'rotate(0deg)',
                    transition: 'box-shadow 0.2s, border 0.2s, transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    padding: '7.5px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <Flex align="center" gap="2">
                    <Text fontSize="lg">{(activeNode.data as any).element?.icon}</Text>
                    <Text fontSize="sm" fontWeight="medium" color="white">
                      {(activeNode.data as any).label}
                    </Text>
                  </Flex>
                </Box>
              ) : null}
            </DragOverlay>,
            document.body
          )
        : null}
    </DndContext>
  );
};