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
import { DebugPanel } from './DebugPanel';
import { PerformanceMonitor } from './PerformanceMonitor';

export function FlowBuilder() {
  const flow = useFlowLogic();
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex h-screen bg-flow-canvas">
      <FlowSidebar />
      <div
        className="flex-1 relative"
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDownCanvas}
        onDragStart={handleDragStart}
        onDrop={(ev) => {
          flow.onDrop(ev);
          const cleanupEv = new CustomEvent('forceSidebarPreviewCleanup');
          window.dispatchEvent(cleanupEv);
        }}
        onDragOver={flow.onDragOver}
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
  );
}
