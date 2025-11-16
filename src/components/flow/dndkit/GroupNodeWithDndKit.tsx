import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, DragOverEvent, PointerSensor, useSensor, useSensors, MeasuringStrategy, closestCenter } from '@dnd-kit/core';
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
  groupId: string;
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
  groupId,
}: GroupNodeWithDndKitProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const [overlayHidden, setOverlayHidden] = useState(false);
  const dragStartInfoRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const [overlaySize, setOverlaySize] = useState<{ width: number; height: number } | null>(null);
  const [projectedIndex, setProjectedIndex] = useState<number | null>(null);
  const [placeholderStage, setPlaceholderStage] = useState<'close' | 'active' | 'disabled' | null>(null);

  const EXTRACT_MIN_DISTANCE = 24; // distância mínima para considerar extração
  const EXTRACT_PRESS_DELAY = 180; // ms de press delay para considerar extração

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
      activationConstraint: { delay: 120, tolerance: 5 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setOverlayHidden(false);
    try {
      const el = document.querySelector(`.react-flow__node[data-id="${groupId}"] .view .view-child [data-node-id="${active.id}"]`) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        setOverlaySize({ width: r.width, height: r.height });
      } else {
        setOverlaySize(null);
      }
    } catch {
      setOverlaySize(null);
    }
    const nativeEvent = (event as any).event as MouseEvent | PointerEvent | TouchEvent | undefined;
    if (nativeEvent && 'clientX' in nativeEvent && 'clientY' in nativeEvent) {
      dragStartInfoRef.current = { x: (nativeEvent as any).clientX, y: (nativeEvent as any).clientY, t: Date.now() };
    } else {
      const lp = lastPointerRef.current || (window as any).__lastPointer;
      if (lp) {
        dragStartInfoRef.current = { x: lp.x, y: lp.y, t: Date.now() };
      } else {
        dragStartInfoRef.current = { x: 0, y: 0, t: Date.now() };
      }
    }
    const node = localChildNodes.find((n) => n.id === active.id);
    if (node) onDragStart(node);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setProjectedIndex(null);
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
    const groupEl = document.querySelector(`.react-flow__node[data-id="${groupId}"]`) as HTMLElement | null;
    const outsideGroup = (() => {
      const pointer = (typeof finalX === 'number' && typeof finalY === 'number')
        ? { x: finalX, y: finalY }
        : (lastPointerRef.current || (window as any).__lastPointer);
      if (!groupEl || !pointer) return false;
      const r = groupEl.getBoundingClientRect();
      return pointer.x < r.left || pointer.x > r.right || pointer.y < r.top || pointer.y > r.bottom;
    })();

    if (!over || outsideGroup) {
      // soltou fora do grupo → extrair para o canvas
      const node = localChildNodes.find((n) => n.id === active.id);
      if (node) {
        const startInfo = dragStartInfoRef.current;
        const now = Date.now();
        const pressDuration = startInfo ? now - startInfo.t : 0;
        const dx = typeof finalX === 'number' && startInfo ? finalX - startInfo.x : 0;
        const dy = typeof finalY === 'number' && startInfo ? finalY - startInfo.y : 0;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const canExtract = distance >= EXTRACT_MIN_DISTANCE || pressDuration >= EXTRACT_PRESS_DELAY;

        if (!canExtract) {
          setOverlayHidden(false);
          onDragEnd();
          return;
        }
        setOverlayHidden(true);

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
    const finalIndex = projectedIndex != null ? projectedIndex : overIndex;
    if (node && finalIndex !== -1) onDrop(node, overId, finalIndex, event);
    onDragEnd();
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!active || !over) {
      setProjectedIndex(null);
      setPlaceholderStage(null);
      return;
    }
    const overIndex = localChildNodes.findIndex((n) => n.id === (over.id as string));
    const activeIndex = localChildNodes.findIndex((n) => n.id === (active.id as string));
    if (overIndex !== -1) {
      const idx = activeIndex < overIndex ? overIndex + 1 : overIndex;
      const clamped = Math.max(0, Math.min(idx, localChildNodes.length));
      setProjectedIndex(clamped);
      setPlaceholderStage('close');
      setTimeout(() => setPlaceholderStage('active'), 0);
    } else {
      setProjectedIndex(null);
      setPlaceholderStage(null);
    }
  };

  const activeNode = activeId ? localChildNodes.find((n) => n.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      collisionDetection={closestCenter}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
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
                {activeId != null && projectedIndex === index ? (
                  <DividerWithHover
                    isDragging={true}
                    isActive={placeholderStage === 'active'}
                    extraClass={placeholderStage === 'close' ? 'close' : ''}
                  />
                ) : null}
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
          {activeId != null && projectedIndex === localChildNodes.length ? (
            <DividerWithHover
              isDragging={true}
              isActive={placeholderStage === 'active'}
              extraClass={placeholderStage === 'close' ? 'close' : ''}
            />
          ) : null}
        </Box>
      </SortableContext>
      {typeof document !== 'undefined'
        ? createPortal(
            <DragOverlay dropAnimation={null}>
              {activeNode ? (
                <Box
                  opacity={overlayHidden ? 0 : 1}
                  style={overlaySize ? { width: `${overlaySize.width}px`, height: `${overlaySize.height}px` } : undefined}
                  borderWidth="1px"
                  borderRadius="lg"
                  borderColor="hsl(var(--border) / 0.3)"
                  bg="hsl(var(--flow-node) / 1.0)"
                  p="3"
                  boxShadow="lg"
                  pointerEvents="none"
                  userSelect="none"
                >
                  <Flex align="center" gap="2" mb="2">
                    <Text fontSize="sm">{(activeNode.data as any).element?.icon}</Text>
                    <Text fontSize="xs" fontWeight="medium" color="hsl(var(--foreground))">
                      {(activeNode.data as any).label}
                    </Text>
                    <Box as="span" fontSize="xs" color="hsl(var(--muted-foreground))" bg="hsl(var(--muted))" px="1" py="0.5" borderRadius="sm">
                      Grupo
                    </Box>
                  </Flex>
                  <Text fontSize="xs" color="hsl(var(--muted-foreground))">
                    {(activeNode.data as any).content || 'Clique para editar...'}
                  </Text>
                </Box>
              ) : null}
            </DragOverlay>,
            document.body
          )
        : null}
    </DndContext>
  );
};
