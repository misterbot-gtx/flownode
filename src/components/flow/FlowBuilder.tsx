import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  ConnectionLineType,
} from '@flow/react';
import '@flow/react/dist/style.css';

import { FlowSidebar } from './FlowSidebar';
import { useFlowLogic } from './useFlowLogic';
import React, { useRef, useState } from 'react';
import { DndContext, DragStartEvent, DragEndEvent, DragMoveEvent, PointerSensor, useSensor, useSensors, useDroppable, DragOverlay } from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import { DebugPanel } from './DebugPanel';
import { PerformanceMonitor } from './PerformanceMonitor';

export function FlowBuilder() {
  const flow = useFlowLogic();
  const containerRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const { setNodeRef } = useDroppable({ id: 'flow-canvas' });
  const [activeElement, setActiveElement] = useState<any | null>(null);
  const [overlayTilt, setOverlayTilt] = useState(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const pointerMoveHandlerRef = useRef<(ev: PointerEvent) => void>();
  const lastOverGroupRef = useRef<string | null>(null);

  // Handler customizado para wheel/scroll
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!flow.reactFlowRef?.current) return;
    const instance = flow.reactFlowRef.current;
    const viewport = instance.getViewport();
  
    // Zoom com Ctrl + Scroll
    if (event.ctrlKey) {
      requestAnimationFrame(() => {
        const zoom = instance.getZoom();
        const newZoom = zoom * (event.deltaY < 0 ? 1.1 : 0.9);
        instance.setViewport({
          ...viewport,
          zoom: Math.max(0.1, Math.min(4, newZoom)),
        });
      });
      return;
    }
    if (event.shiftKey) {
      requestAnimationFrame(() => {
        instance.setViewport({
          ...viewport,
          x: viewport.x - event.deltaY,
          y: viewport.y,
        });
      });
      return;
    }
    requestAnimationFrame(() => {
      instance.setViewport({
        ...viewport,
        x: viewport.x,
        y: viewport.y - event.deltaY,
      });
    });
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    const types = Array.from(event.dataTransfer?.types || []);
    const isAllowed =
      types.length === 0 ||
      types.includes('application/reactflow') ||
      types.includes('application/reactflow-child') ||
      types.includes('application/reactflow-child-from-group');
    if (!isAllowed) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleMouseDownCanvas = () => {
    const ev = new CustomEvent('forceSidebarPreviewCleanup');
    window.dispatchEvent(ev);
  };

  const handleDndStart = (e: DragStartEvent) => {
    const element = (e.active?.data?.current as any)?.element;
    if (element) {
      setActiveElement(element);
      const ev = new CustomEvent('sidebarDragStart', { detail: { id: e.active.id } });
      window.dispatchEvent(ev);
      setOverlayTilt(false);
      setTimeout(() => setOverlayTilt(true), 10);

      pointerMoveHandlerRef.current = (pev: PointerEvent) => {
        lastPointerRef.current = { x: pev.clientX, y: pev.clientY };
      };
      window.addEventListener('pointermove', pointerMoveHandlerRef.current, { passive: true });
    }
  };
  const handleDndEnd = (e: DragEndEvent) => {
    const activeData = (e.active?.data?.current as any) || {};
    const element = activeData.element;
    const ev = (e as any).event as MouseEvent | PointerEvent | TouchEvent;
    let screenPoint: { x: number; y: number } | null = null;
    if (ev && 'clientX' in ev && 'clientY' in ev) {
      screenPoint = { x: (ev as any).clientX, y: (ev as any).clientY };
    } else if (lastPointerRef.current) {
      screenPoint = lastPointerRef.current;
    }
    if (screenPoint) {
      const bounds = containerRef.current?.getBoundingClientRect();
      const insideCanvas = bounds
        ? screenPoint.x >= bounds.left && screenPoint.x <= bounds.right && screenPoint.y >= bounds.top && screenPoint.y <= bounds.bottom
        : false;
      const isGroupTarget = typeof e.over?.id === 'string' && (e.over.id as any).startsWith('group-');
      const canDrop = e.over?.id === 'flow-canvas' || insideCanvas || isGroupTarget;
      if (canDrop) {
      if (element) {
        if (isGroupTarget) {
          const groupId = e.over!.id as string;
          flow.addElementToGroupAtScreenPoint(element, groupId, screenPoint);
          const leaveEvt = new CustomEvent('groupDndPreviewLeave', { detail: { groupId } });
          window.dispatchEvent(leaveEvt);
        } else {
          flow.addElementAtScreenPoint(element, screenPoint);
        }
      } else if (activeData.type === 'group-child' && activeData.node) {
        flow.extractChildToCanvasAtScreenPoint(activeData.node, screenPoint);
      }
      }
    }
    setActiveElement(null);
    const cleanupEv = new CustomEvent('sidebarDragEnd', { detail: { id: e.active?.id } });
    window.dispatchEvent(cleanupEv);
    setOverlayTilt(false);
    if (pointerMoveHandlerRef.current) {
      window.removeEventListener('pointermove', pointerMoveHandlerRef.current);
      pointerMoveHandlerRef.current = undefined;
    }
    lastPointerRef.current = null;
  };

  const handleDndMove = (e: DragMoveEvent) => {
    const ev = (e as any).event as MouseEvent | PointerEvent | TouchEvent;
    let screenPoint: { x: number; y: number } | null = null;
    if (ev && 'clientX' in ev && 'clientY' in ev) {
      screenPoint = { x: (ev as any).clientX, y: (ev as any).clientY };
    } else if (lastPointerRef.current) {
      screenPoint = lastPointerRef.current;
    }
    const overId = (e.over?.id as any) as string | undefined;
    const isGroupTarget = typeof overId === 'string' && overId.startsWith('group-');
    if (screenPoint && isGroupTarget) {
      const evt = new CustomEvent('groupDndPreview', { detail: { groupId: overId, clientX: screenPoint.x, clientY: screenPoint.y } });
      window.dispatchEvent(evt);
      lastOverGroupRef.current = overId;
    } else if (lastOverGroupRef.current) {
      const leaveEvt = new CustomEvent('groupDndPreviewLeave', { detail: { groupId: lastOverGroupRef.current } });
      window.dispatchEvent(leaveEvt);
      lastOverGroupRef.current = null;
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDndStart} onDragMove={handleDndMove} onDragEnd={handleDndEnd}>
      <div className="flex h-screen bg-flow-canvas">
        <FlowSidebar />
        <div
          className="flex-1 relative"
          ref={(el) => {
            containerRef.current = el as any;
            setNodeRef(el as any);
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDownCanvas}
          onDragStart={handleDragStart}
        >
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button
            onClick={flow.createGroup}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors shadow-lg"
          >
            Criar Grupo
          </button>
        </div>
        <ReactFlow
          nodes={flow.nodes}
          edges={flow.edges}
          onNodesChange={flow.onNodesChange}
          onEdgesChange={flow.onEdgesChange}
          onConnect={flow.onConnect}
          nodeTypes={flow.nodeTypes}
          edgeTypes={flow.edgeTypes}
          onEdgeClick={flow.onEdgeClick}
          onDrop={flow.onDrop}
          onDragOver={flow.onDragOver}
          onNodeDragStart={() => {
            const ev = new CustomEvent('forceSidebarPreviewCleanup');
            window.dispatchEvent(ev);
          }}
          onSelectionDragStart={() => {
            const ev = new CustomEvent('forceSidebarPreviewCleanup');
            window.dispatchEvent(ev);
          }}
          onInit={(reactFlowInstance) => {
            if (typeof flow.onInit === 'function') {
              flow.onInit(reactFlowInstance as any);
            }
          }}
          fitView={false}
          className="bg-flow-canvas"
          attributionPosition="bottom-left"
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{ stroke: '#9aa1cd', strokeWidth: 0.5, strokeDasharray: '7 5', animation: 'dashdraw 1s linear infinite' }}
          zoomOnScroll={false}
          noDragClassName="nodrag"
          multiSelectionKeyCode="Shift"
        >
          <Controls className="bg-flow-node border-none border-border/20 rounded-lg shadow-lg" position="top-right" />
          <MiniMap nodeColor={flow.nodeColor} className="bg-flow-node border border-border/20 rounded-lg shadow-lg" position="bottom-right" />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#374151" />
        </ReactFlow>
        
        {/* Debug Panel */}
        <DebugPanel
          nodes={flow.nodes}
          edges={flow.edges}
          debugLogs={flow.debugLogs}
          onAddDebugLog={flow.addDebugLog}
          onClearLogs={() => {
            // Add clear logs functionality if needed
            console.log('🗑️ Logs cleared from debug panel');
          }}
        />

        {/* Performance Monitor */}
        <PerformanceMonitor
          nodes={flow.nodes}
          edges={flow.edges}
          onPerformanceUpdate={(metrics) => {
            // Log performance warnings
            if (metrics.renderTime > 33) {
              flow.addDebugLog('warning', 'Performance degradation detected', metrics);
            }
          }}
        />
        </div>
      </div>
      {typeof document !== 'undefined'
        ? createPortal(
            <DragOverlay>
              {activeElement ? (
                <div
                  className={`dragging-previews ${overlayTilt ? 'tilt' : ''}`}
                  style={{
                    width: '18rem',
                    border: '3px solid #ea580c',
                    background: 'rgb(24 24 27)',
                    borderRadius: 8,
                    padding: '7.5px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    pointerEvents: 'none',
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{activeElement.icon}</span>
                  <span style={{ fontSize: '1rem', color: 'white', marginLeft: 8 }}>{activeElement.label}</span>
                </div>
              ) : null}
            </DragOverlay>,
            document.body
          )
        : null}
    </DndContext>
  );
}
