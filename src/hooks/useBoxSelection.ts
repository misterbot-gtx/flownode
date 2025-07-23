import { useState, useCallback } from 'react';

export function useBoxSelection(flow: any) {
  const [boxSelect, setBoxSelect] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

  // Handler para mouse down: inicia seleção de área se shift estiver pressionado
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    console.log('handleMouseDown', { shift: e.shiftKey, button: e.button });
    if (!e.shiftKey || e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setBoxSelect({
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      endX: e.clientX - rect.left,
      endY: e.clientY - rect.top,
    });
    setIsBoxSelecting(true);
  }, []);

  // Handler para mouse move: atualiza área de seleção
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isBoxSelecting || !boxSelect) return;
    console.log('handleMouseMove', { isBoxSelecting, boxSelect });
    const rect = e.currentTarget.getBoundingClientRect();
    setBoxSelect({
      ...boxSelect,
      endX: e.clientX - rect.left,
      endY: e.clientY - rect.top,
    });
  }, [isBoxSelecting, boxSelect]);

  // Handler para mouse up: finaliza seleção de área e seleciona nodes
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isBoxSelecting || !boxSelect) return;
    console.log('handleMouseUp', { isBoxSelecting, boxSelect });
    setIsBoxSelecting(false);
    if (flow.reactFlowRef?.current) {
      const instance = flow.reactFlowRef.current;
      const { startX, startY, endX, endY } = boxSelect;
      const x1 = Math.min(startX, endX);
      const y1 = Math.min(startY, endY);
      const x2 = Math.max(startX, endX);
      const y2 = Math.max(startY, endY);
      // Converter para coordenadas do flow
      const p1 = instance.screenToFlowPosition({ x: x1, y: y1 });
      const p2 = instance.screenToFlowPosition({ x: x2, y: y2 });
      const minX = Math.min(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxX = Math.max(p1.x, p2.x);
      const maxY = Math.max(p1.y, p2.y);
      // Selecionar nodes
      const selectedIds = flow.nodes
        .filter((node: any) => {
          const nx = node.position.x;
          const ny = node.position.y;
          return nx >= minX && nx <= maxX && ny >= minY && ny <= maxY;
        })
        .map((node: any) => node.id);
      setSelectedNodeIds(selectedIds);
      if (selectedIds.length > 0 && flow.onNodesChange) {
        flow.onNodesChange(selectedIds.map((id: string) => ({ id, type: 'select', selected: true })));
      }
    }
    setBoxSelect(null);
  }, [isBoxSelecting, boxSelect, flow]);

  return {
    boxSelect,
    isBoxSelecting,
    selectedNodeIds,
    setSelectedNodeIds,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
} 