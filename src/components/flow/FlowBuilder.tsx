import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { FlowSidebar } from './FlowSidebar';
import { useFlowLogic } from './useFlowLogic';
import React, { useRef, useState } from 'react';
import { toast } from '@/components/ui/sonner';

export function FlowBuilder() {
  const flow = useFlowLogic();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showDevTools, setShowDevTools] = useState(false);

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

  return (
    <div className="flex h-screen bg-flow-canvas">
      <FlowSidebar />
      <div
        className="flex-1 relative"
        style={{ width: '100%', height: 'calc(100vh - 0px)' }}
        ref={containerRef}
        onWheel={handleWheel}
        onDrop={flow.onDrop}
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
          <button
            onClick={() => setShowDevTools(!showDevTools)}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors shadow-lg"
            title="Abrir/fechar DevTools"
          >
            🔧 DevTools
          </button>
        </div>

        {/* Painel de Debug Customizado */}
        {showDevTools && (
          <div className="absolute top-16 left-4 z-20 w-72 bg-background border border-border rounded-lg shadow-xl p-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">🔧 Flow Debug</h3>
              <button
                onClick={() => setShowDevTools(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 text-xs">
              {/* Estatísticas */}
              <div>
                <h4 className="font-medium mb-2">📊 Resumo</h4>
                <div className="bg-muted p-2 rounded space-y-1">
                  <div>Total de nós: <span className="font-mono">{flow.nodes.length}</span></div>
                  <div>Total de conexões: <span className="font-mono">{flow.edges.length}</span></div>
                  <div>Grupos: <span className="font-mono">{flow.nodes.filter(n => n.type === 'groupNode').length}</span></div>
                  <div>Elementos filhos: <span className="font-mono">{flow.nodes.filter(n => n.parentId).length}</span></div>
                </div>
              </div>

              {/* Lista de Nós */}
              <div>
                <h4 className="font-medium mb-2">📋 Nós ({flow.nodes.length})</h4>
                <div className="bg-muted p-2 rounded max-h-32 overflow-y-auto space-y-1">
                  {flow.nodes.map(node => (
                    <div key={node.id} className="flex items-center justify-between">
                      <span className="font-mono text-xs">{node.id}</span>
                      <span className="text-muted-foreground text-xs">({node.type})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lista de Conexões */}
              <div>
                <h4 className="font-medium mb-2">🔗 Conexões ({flow.edges.length})</h4>
                <div className="bg-muted p-2 rounded max-h-32 overflow-y-auto space-y-1">
                  {flow.edges.map(edge => (
                    <div key={edge.id} className="flex items-center justify-between">
                      <span className="font-mono text-xs">{edge.source}</span>
                      <span className="text-muted-foreground text-xs">→</span>
                      <span className="font-mono text-xs">{edge.target}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Controles */}
              <div>
                <h4 className="font-medium mb-2">🎮 Ações</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if (flow.reactFlowRef?.current) {
                        flow.reactFlowRef.current.fitView();
                      }
                    }}
                    className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/80"
                  >
                    📐 Fit View
                  </button>
                  <button
                    onClick={() => {
                      try {
                        flow.exportFlow();
                        toast.success('Flow exportado!');
                      } catch (error) {
                        console.error('Erro ao exportar:', error);
                        toast.error('Erro ao exportar.');
                      }
                    }}
                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    📤 Export
                  </button>
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.json';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            try {
                              const flowData = JSON.parse(e.target?.result as string);
                              const success = flow.importFlow(flowData);
                              if (success) {
                                toast.success('Flow importado!');
                                setShowDevTools(false);
                              }
                            } catch (error) {
                              console.error('Erro ao importar:', error);
                              toast.error('Erro ao importar o flow.');
                            }
                          };
                          reader.readAsText(file);
                        }
                      };
                      input.click();
                    }}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    📥 Import
                  </button>
                  <button
                    onClick={() => {
                      // Limpar console para debug
                      console.clear();
                      toast.success('Console limpo!');
                    }}
                    className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    🧹 Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <ReactFlow
          nodes={flow.nodes}
          edges={flow.edges}
          onNodesChange={flow.onNodesChange}
          onEdgesChange={flow.onEdgesChange}
          onConnect={flow.onConnect}
          onNodeDragStart={flow.onNodeDragStart}
          nodeTypes={flow.nodeTypes}
          edgeTypes={flow.edgeTypes}
          onEdgeClick={flow.onEdgeClick}
          onInit={flow.onInit}
          fitView={false}
          className="bg-flow-canvas"
          attributionPosition="bottom-left"
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{ stroke: '#9aa1cd', strokeWidth: 0.5, strokeDasharray: '7 5', animation: 'dashdraw 1s linear infinite' }}
          zoomOnScroll={false}
          multiSelectionKeyCode="Shift"
          style={{ width: '100%', height: '100%', minHeight: '800px' }}
          proOptions={{ hideAttribution: true }}
        >
          <Controls className="bg-flow-node border-none border-border/20 rounded-lg shadow-lg" position="top-right" />
          <MiniMap nodeColor={flow.nodeColor} className="bg-flow-node border border-border/20 rounded-lg shadow-lg" position="bottom-right" />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#374151" />
        </ReactFlow>
      </div>
    </div>
  );
}