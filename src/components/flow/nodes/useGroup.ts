import { useEffect, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Node } from '@flow/react';

export function useGroup(id: string, groupData: any) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedChildId, setDraggedChildId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPreviewStable, setIsPreviewStable] = useState(false);
  const [localChildNodes, setLocalChildNodes] = useState<Node[]>(groupData.childNodes || []);
  const dragRef = useRef<HTMLDivElement>(null);
  const draggedChildNodeRef = useRef<Node | null>(null);
  const previousDragOverIndexRef = useRef<number>(-1);
  const [calculatedPosition, setCalculatedPosition] = useState<{ x: number; y: number } | null>(null);
  const { setNodeRef } = useDroppable({ id });
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const lastUpdateRef = useRef<number>((groupData as any)._updateTimestamp || 0);

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

  useEffect(() => {
    if (!isPreviewMode && groupData.childNodes) {
      const currentTimestamp = (groupData as any)._updateTimestamp || 0;
      if (currentTimestamp > lastUpdateRef.current) {
        setLocalChildNodes(groupData.childNodes);
        lastUpdateRef.current = currentTimestamp;
      }
    }
  }, [groupData.childNodes, (groupData as any)._updateTimestamp, isPreviewMode]);

  useEffect(() => {
    const handleDragStart = (e: any) => {
      setIsDragging(true);
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
        setIsDragging(true);
        draggedChildNodeRef.current = detail.nodeData as Node;
        setIsPreviewMode(true);
        setIsPreviewStable(true);
        setTimeout(() => {
          setDraggedChildId(detail.childNodeId);
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
    const handleNewDragStart = () => {
      if (isPreviewStable) {
        setIsPreviewStable(false);
      }
    };
    window.addEventListener('dragstart', handleNewDragStart);
    return () => {
      window.removeEventListener('dragstart', handleNewDragStart);
    };
  }, [isPreviewStable]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    if (!isPreviewStable) {
      setIsPreviewMode(true);
      setIsPreviewStable(true);
    }
    const groupRect = e.currentTarget.getBoundingClientRect();
    const mouseXInGroup = e.clientX - groupRect.left;
    const mouseYInGroup = e.clientY - groupRect.top;
    const previewPosition = {
      x: Math.max(16, Math.min(mouseXInGroup, groupRect.width - 180)),
      y: Math.max(80, Math.min(mouseYInGroup, groupRect.height - 80)),
    };
    const currentPos = calculatedPosition;
    if (!currentPos || Math.abs(currentPos.x - previewPosition.x) > 5 || Math.abs(currentPos.y - previewPosition.y) > 5) {
      setCalculatedPosition(previewPosition);
    }
    const childrenEls = Array.from(dragRef.current?.querySelectorAll('.view-child') || []).filter((el) => !el.classList.contains('no-space')) as HTMLElement[];
    let newIndex = 0;
    for (let i = 0; i < childrenEls.length; i++) {
      const r = childrenEls[i].getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (e.clientY < mid) {
        newIndex = i;
        break;
      }
      newIndex = i + 1;
    }
    if (newIndex !== previousDragOverIndexRef.current) {
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
        y: Math.max(80, Math.min(mouseYInGroup, rect.height - 80)),
      };
      setCalculatedPosition(previewPosition);
      const childrenEls = Array.from(dragRef.current?.querySelectorAll('.view-child') || []).filter((el) => !el.classList.contains('no-space')) as HTMLElement[];
      let newIndex = 0;
      for (let i = 0; i < childrenEls.length; i++) {
        const r = childrenEls[i].getBoundingClientRect();
        const mid = r.top + r.height / 2;
        if (detail.clientY < mid) {
          newIndex = i;
          break;
        }
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
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      const isLeavingGroup = e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;
      if (isLeavingGroup) {
        setIsDragOver(false);
        setDragOverIndex(-1);
        setIsPreviewMode(false);
        setIsPreviewStable(false);
        previousDragOverIndexRef.current = -1;
      }
    } else {
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
    setIsDragOver(false);
    setIsPreviewMode(false);
    setIsPreviewStable(false);
    previousDragOverIndexRef.current = -1;
    const elementData = e.dataTransfer.getData('application/reactflow');
    if (elementData) {
      const finalDropIndex = dragOverIndex >= 0 ? dragOverIndex : 0;
      const finalPosition = calculatedPosition || { x: 16, y: 120 };
      const customEvent = new CustomEvent('groupDrop', {
        detail: {
          groupId: id,
          elementData: elementData,
          calculatedPosition: finalPosition,
          dropIndex: finalDropIndex,
          mouseRelativePosition: finalPosition,
        },
      });
      window.dispatchEvent(customEvent);
    }
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
            position: { x: e.clientX, y: e.clientY },
          },
        });
        window.dispatchEvent(customEvent);
      }
    }
    setCalculatedPosition(null);
    setDragOverIndex(-1);
    draggedChildNodeRef.current = null;
  };

  return {
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
  };
}