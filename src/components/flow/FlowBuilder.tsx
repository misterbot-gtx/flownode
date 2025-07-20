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

export function FlowBuilder() {
  const flow = useFlowLogic();
  return (
    <div className="flex h-screen bg-flow-canvas" onDrop={flow.onDrop} onDragOver={flow.onDragOver}>
      <FlowSidebar />
      <div className="flex-1 relative">
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
          onInit={flow.onInit}
          fitView={flow.fitView}
          className="bg-flow-canvas"
          attributionPosition="bottom-left"
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{ stroke: '#ffffff', strokeWidth: 0.5, strokeDasharray: '7 5', animation: 'dashdraw 1s linear infinite' }}
        >
          <Controls className="bg-flow-node border-none border-border/20 rounded-lg shadow-lg" position="bottom-right" />
          <MiniMap nodeColor={flow.nodeColor} className="bg-flow-node border border-border/20 rounded-lg shadow-lg" position="bottom-left" />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#374151" />
        </ReactFlow>
      </div>
    </div>
  );
}