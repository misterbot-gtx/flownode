import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useEffect, useRef, useState } from 'react';
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
  onDrop: (active: Node, overId?: string, index?: number, event?: DragEndEvent) => void;
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
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const [overlayHidden, setOverlayHidden] = useState(false);

  useEffect(() => {
    const onPointerMove = (ev: PointerEvent) => {
      lastPointerRef.current = { x: ev.clientX, y: ev.clientY };
      (window as any).__lastPointer = lastPointerRef.current;
    };
    const onTouchMove = (ev: TouchEvent) => {
      const t = ev.touches && ev.touches[0];
      if (t) {
        lastPointerRef.current = { x: t.clientX, y: t.clientY };
        (window as any).__lastPointer = lastPointerRef.current;
      }
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('touchmove', onTouchMove);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setOverlayHidden(false);
    const node = localChildNodes.find((n) => n.id === active.id);
    if (node) onDragStart(node);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    // Verifica se o drop foi fora do grupo
    if (!over) {
      // soltou fora do grupo → extrair para o canvas
      const node = localChildNodes.find((n) => n.id === active.id);
      if (node) {
        setOverlayHidden(true);
        // Usa coordenadas reais do evento de ponteiro, evitando usar delta
        const nativeEvent = (event as any).event as MouseEvent | PointerEvent | TouchEvent | undefined;
        let finalX: number | undefined;
        let finalY: number | undefined;

        if (nativeEvent && 'clientX' in nativeEvent && 'clientY' in nativeEvent) {
          finalX = (nativeEvent as any).clientX;
          finalY = (nativeEvent as any).clientY;
        } else if (nativeEvent && 'touches' in nativeEvent && (nativeEvent as any).touches?.length > 0) {
          const touch = (nativeEvent as any).touches[0];
          finalX = touch.clientX;
          finalY = touch.clientY;
        }

        console.log('🎯 DNDKIT DRAG END - FORA DO GRUPO (coords resolvidas):', {
          nodeId: node.id,
          nodeName: (node.data as any)?.label,
          hasNativeEvent: !!nativeEvent,
          finalX,
          finalY
        });

        if (typeof finalX === 'number' && typeof finalY === 'number') {
          // Dispara evento global com coordenadas exatas
          const customEvent = new CustomEvent('groupExtract', {
            detail: { 
              groupId: undefined, // será preenchido pelo GroupNode
              node: node,
              clientX: finalX,
              clientY: finalY,
              timestamp: Date.now(),
              source: 'dndkit-extract-native'
            },
          });
          window.dispatchEvent(customEvent);
          console.log('✅ Evento groupExtract disparado pelo DnDKit com coordenadas:', { finalX, finalY });
          onDragEnd();
        } else {
          const lp = lastPointerRef.current || (window as any).__lastPointer;
          if (lp && typeof lp.x === 'number' && typeof lp.y === 'number') {
            const customEvent = new CustomEvent('groupExtract', {
              detail: {
                groupId: undefined,
                node: node,
                clientX: lp.x,
                clientY: lp.y,
                timestamp: Date.now(),
                source: 'dndkit-extract-last-pointer'
              },
            });
            window.dispatchEvent(customEvent);
            console.log('✅ groupExtract usando lastPointer', lp);
            onDragEnd();
          } else {
            console.warn('⚠️ Coordenadas não disponíveis, fallback para onDrop');
            onDrop(node, undefined, undefined, event);
            onDragEnd();
          }
        }
      }
      return;
    }
    
    // soltou dentro do grupo → reordenar (opcional)
    const overId = over.id as string;
    const overIndex = localChildNodes.findIndex((n) => n.id === overId);
    const node = localChildNodes.find((n) => n.id === active.id);
    if (node && overIndex !== -1) onDrop(node, overId, overIndex, event);
    onDragEnd();
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
            <DragOverlay dropAnimation={null}>
              {activeNode ? (
                <Box
                  className="dragging-previews"
                  style={{
                    width: '18rem',
                    border: '3px solid #ea580c',
                    background: 'rgb(24 24 27)',
                    opacity: overlayHidden ? 0 : 1,
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
