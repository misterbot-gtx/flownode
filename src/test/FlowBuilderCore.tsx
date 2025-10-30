// FlowBuilderCore.tsx - Lógica essencial do Flow Builder
// Este arquivo contém toda a estrutura necessária para criar um flow builder funcional

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { z } from 'zod';

// ============================================================================
// TIPOS E SCHEMAS ESSENCIAIS
// ============================================================================

// Tipos de coordenadas
export type Coordinates = { x: number; y: number };

// Tipos de âncoras para conexões
export type Anchor = {
  coordinates: Coordinates;
};

// Tipos de fonte e destino para edges
export const blockSourceSchema = z.object({
  blockId: z.string(),
  itemId: z.string().optional(),
  pathId: z.string().optional(),
});
export type BlockSource = z.infer<typeof blockSourceSchema>;

export const eventSourceSchema = z.object({
  eventId: z.string(),
});
export type TEventSource = z.infer<typeof eventSourceSchema>;

export const sourceSchema = blockSourceSchema.or(eventSourceSchema);
export type Source = z.infer<typeof sourceSchema>;

export const targetSchema = z.object({
  groupId: z.string(),
  blockId: z.string().optional(),
});
export type Target = z.infer<typeof targetSchema>;

// Schema de Edge (conexão entre blocos)
export const edgeSchema = z.object({
  id: z.string(),
  from: sourceSchema,
  to: targetSchema,
});
export type Edge = z.infer<typeof edgeSchema>;

// Tipos de blocos básicos
export type BlockType = 
  | 'start'
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'embed'
  | 'choice'
  | 'email'
  | 'phone'
  | 'url'
  | 'number'
  | 'date'
  | 'rating'
  | 'file'
  | 'payment'
  | 'picture choice'
  | 'button'
  | 'condition'
  | 'set variable'
  | 'redirect'
  | 'script'
  | 'typebot link'
  | 'wait'
  | 'jump'
  | 'ab test'
  | 'webhook'
  | 'zapier'
  | 'make.com'
  | 'pabbly'
  | 'openai'
  | 'anthropic'
  | 'together ai'
  | 'mistral'
  | 'google'
  | 'elevenlabs'
  | 'dify'
  | 'chatwoot'
  | 'google sheets'
  | 'google calendar'
  | 'notion'
  | 'slack'
  | 'email'
  | 'sms'
  | 'telegram'
  | 'whatsapp'
  | 'custom';

// Schema básico de bloco
export const blockSchema = z.object({
  id: z.string(),
  type: z.enum([
    'start', 'text', 'image', 'video', 'audio', 'embed', 'choice', 'email',
    'phone', 'url', 'number', 'date', 'rating', 'file', 'payment',
    'picture choice', 'button', 'condition', 'set variable', 'redirect',
    'script', 'typebot link', 'wait', 'jump', 'ab test', 'webhook',
    'zapier', 'make.com', 'pabbly', 'openai', 'anthropic', 'together ai',
    'mistral', 'google', 'elevenlabs', 'dify', 'chatwoot', 'google sheets',
    'google calendar', 'notion', 'slack', 'email', 'sms', 'telegram',
    'whatsapp', 'custom'
  ]),
  options: z.record(z.any()).optional(),
  items: z.array(z.any()).optional(),
  groupId: z.string(),
  graphCoordinates: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export type Block = z.infer<typeof blockSchema>;

// Schema de grupo (container de blocos)
export const groupSchema = z.object({
  id: z.string(),
  title: z.string(),
  graphCoordinates: z.object({
    x: z.number(),
    y: z.number(),
  }),
  blocks: z.array(blockSchema),
});

export type Group = z.infer<typeof groupSchema>;

// Schema de evento
export const eventSchema = z.object({
  id: z.string(),
  type: z.string(),
  graphCoordinates: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export type Event = z.infer<typeof eventSchema>;

// Schema de variável
export const variableSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.string().optional(),
});

export type Variable = z.infer<typeof variableSchema>;

// Schema principal do Typebot/Flow
export const typebotSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  groups: z.array(groupSchema),
  edges: z.array(edgeSchema),
  events: z.array(eventSchema),
  variables: z.array(variableSchema),
  settings: z.record(z.any()).optional(),
  theme: z.record(z.any()).optional(),
});

export type Typebot = z.infer<typeof typebotSchema>;

// ============================================================================
// CONSTANTES DO GRAPH
// ============================================================================

export const GRAPH_CONSTANTS = {
  stubLength: 20,
  groupWidth: 300,
  groupAnchorsOffset: {
    left: { x: 0, y: 20 },
    top: { x: 150, y: 0 },
    right: { x: 300, y: 20 },
  },
  eventWidth: 230,
  pathRadius: 20,
  maxScale: 2,
  minScale: 0.2,
  zoomButtonsScaleBlock: 0.2,
};

export const graphPositionDefaultValue = (firstGroupCoordinates: Coordinates) => ({
  x: 400 - firstGroupCoordinates.x,
  y: 100 - firstGroupCoordinates.y,
  scale: 1,
});

// ============================================================================
// HOOKS ESSENCIAIS
// ============================================================================

// Hook para gerenciar seleção de elementos
export const useSelectionStore = () => {
  const [focusedElementsId, setFocusedElementsId] = useState<string[]>([]);
  const [elementsCoordinates, setElementsCoordinates] = useState<Record<string, Coordinates> | undefined>();
  const [isDraggingGraph, setIsDraggingGraph] = useState(false);

  const focusElement = useCallback((id: string, isAppending?: boolean) => {
    setFocusedElementsId(prev => 
      isAppending
        ? prev.includes(id)
          ? prev.filter(item => item !== id)
          : [...prev, id]
        : [id]
    );
  }, []);

  const blurElements = useCallback(() => {
    setFocusedElementsId([]);
  }, []);

  const moveFocusedElements = useCallback((delta: Coordinates) => {
    if (!elementsCoordinates) return;
    
    setElementsCoordinates(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        ...focusedElementsId.reduce((coords, elementId) => ({
          ...coords,
          [elementId]: {
            x: Number((prev[elementId].x + delta.x).toFixed(2)),
            y: Number((prev[elementId].y + delta.y).toFixed(2)),
          },
        }), prev),
      };
    });
  }, [focusedElementsId, elementsCoordinates]);

  return {
    focusedElementsId,
    elementsCoordinates,
    isDraggingGraph,
    focusElement,
    blurElements,
    moveFocusedElements,
    setElementsCoordinates,
    setIsDraggingGraph,
  };
};

// Hook para gerenciar posição do graph
export const useGraphPosition = () => {
  const [graphPosition, setGraphPosition] = useState(graphPositionDefaultValue({ x: 0, y: 0 }));

  const zoom = useCallback(({ scale, mousePosition, delta }: {
    scale?: number;
    delta?: number;
    mousePosition?: Coordinates;
  }) => {
    setGraphPosition(prev => {
      const newScale = scale ?? (delta ? Math.max(GRAPH_CONSTANTS.minScale, Math.min(GRAPH_CONSTANTS.maxScale, prev.scale + delta)) : prev.scale);
      
      if (!mousePosition) return { ...prev, scale: newScale };
      
      const scaleRatio = newScale / prev.scale;
      return {
        x: mousePosition.x - (mousePosition.x - prev.x) * scaleRatio,
        y: mousePosition.y - (mousePosition.y - prev.y) * scaleRatio,
        scale: newScale,
      };
    });
  }, []);

  return {
    graphPosition,
    setGraphPosition,
    zoom,
  };
};

// ============================================================================
// PROVIDERS ESSENCIAIS
// ============================================================================

// Contexto do Graph
type GraphContextType = {
  graphPosition: Coordinates & { scale: number };
  setGraphPosition: React.Dispatch<React.SetStateAction<Coordinates & { scale: number }>>;
  connectingIds: { source: TEventSource | (BlockSource & { groupId: string }); target?: Target } | null;
  setConnectingIds: React.Dispatch<React.SetStateAction<{ source: TEventSource | (BlockSource & { groupId: string }); target?: Target } | null>>;
  previewingEdge?: Edge;
  setPreviewingEdge: React.Dispatch<React.SetStateAction<Edge | undefined>>;
  openedNodeId?: string;
  setOpenedNodeId: React.Dispatch<React.SetStateAction<string | undefined>>;
  isReadOnly: boolean;
  isAnalytics: boolean;
  focusedGroupId?: string;
  setFocusedGroupId: React.Dispatch<React.SetStateAction<string | undefined>>;
};

const GraphContext = createContext<GraphContextType | undefined>(undefined);

export const GraphProvider: React.FC<{
  children: React.ReactNode;
  isReadOnly?: boolean;
  isAnalytics?: boolean;
}> = ({ children, isReadOnly = false, isAnalytics = false }) => {
  const [graphPosition, setGraphPosition] = useState(graphPositionDefaultValue({ x: 0, y: 0 }));
  const [connectingIds, setConnectingIds] = useState<{ source: TEventSource | (BlockSource & { groupId: string }); target?: Target } | null>(null);
  const [previewingEdge, setPreviewingEdge] = useState<Edge>();
  const [openedNodeId, setOpenedNodeId] = useState<string>();
  const [focusedGroupId, setFocusedGroupId] = useState<string>();

  return (
    <GraphContext.Provider
      value={{
        graphPosition,
        setGraphPosition,
        connectingIds,
        setConnectingIds,
        previewingEdge,
        setPreviewingEdge,
        openedNodeId,
        setOpenedNodeId,
        isReadOnly,
        isAnalytics,
        focusedGroupId,
        setFocusedGroupId,
      }}
    >
      {children}
    </GraphContext.Provider>
  );
};

export const useGraph = () => {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error('useGraph must be used within a GraphProvider');
  }
  return context;
};

// Contexto do Typebot/Flow
type TypebotContextType = {
  typebot?: Typebot;
  currentUserMode: "guest" | "read" | "write";
  isSavingLoading: boolean;
  save: (updates?: Partial<Typebot>, overwrite?: boolean) => Promise<void>;
  updateTypebot: (props: {
    updates: Partial<Typebot>;
    save?: boolean;
    overwrite?: boolean;
  }) => Promise<Typebot | undefined>;
  // Actions para grupos
  createGroup: (props: { position: Coordinates }) => Group;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  deleteGroup: (groupId: string) => void;
  duplicateGroup: (groupId: string) => void;
  // Actions para blocos
  createBlock: (props: { groupId: string; type: BlockType; position: Coordinates }) => Block;
  updateBlock: (blockId: string, updates: Partial<Block>) => void;
  deleteBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  // Actions para edges
  createEdge: (props: { from: Source; to: Target }) => Edge;
  updateEdge: (edgeId: string, updates: Partial<Edge>) => void;
  deleteEdge: (edgeId: string) => void;
  // Actions para variáveis
  createVariable: (props: { name: string; value?: string }) => Variable;
  updateVariable: (variableId: string, updates: Partial<Variable>) => void;
  deleteVariable: (variableId: string) => void;
};

const TypebotContext = createContext<TypebotContextType | undefined>(undefined);

export const TypebotProvider: React.FC<{
  children: React.ReactNode;
  typebotId?: string;
}> = ({ children, typebotId }) => {
  const [typebot, setTypebot] = useState<Typebot | undefined>();
  const [isSavingLoading, setIsSavingLoading] = useState(false);
  const [currentUserMode, setCurrentUserMode] = useState<"guest" | "read" | "write">("write");

  // Função para salvar o typebot
  const save = useCallback(async (updates?: Partial<Typebot>, overwrite?: boolean) => {
    if (!typebot) return;
    
    setIsSavingLoading(true);
    try {
      const updatedTypebot = { ...typebot, ...updates };
      setTypebot(updatedTypebot);
      
      // Aqui você implementaria a lógica de salvamento real
      // Por exemplo, chamada para API
      console.log('Salvando typebot:', updatedTypebot);
      
      // Simular delay de salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setIsSavingLoading(false);
    }
  }, [typebot]);

  // Função para atualizar o typebot
  const updateTypebot = useCallback(async (props: {
    updates: Partial<Typebot>;
    save?: boolean;
    overwrite?: boolean;
  }) => {
    if (!typebot) return undefined;
    
    const updatedTypebot = { ...typebot, ...props.updates };
    setTypebot(updatedTypebot);
    
    if (props.save) {
      await save(props.updates, props.overwrite);
    }
    
    return updatedTypebot;
  }, [typebot, save]);

  // Actions para grupos
  const createGroup = useCallback((props: { position: Coordinates }) => {
    const newGroup: Group = {
      id: `group_${Date.now()}`,
      title: `Grupo ${Date.now()}`,
      graphCoordinates: props.position,
      blocks: [],
    };
    
    setTypebot(prev => prev ? {
      ...prev,
      groups: [...prev.groups, newGroup],
    } : prev);
    
    return newGroup;
  }, []);

  const updateGroup = useCallback((groupId: string, updates: Partial<Group>) => {
    setTypebot(prev => prev ? {
      ...prev,
      groups: prev.groups.map(group => 
        group.id === groupId ? { ...group, ...updates } : group
      ),
    } : prev);
  }, []);

  const deleteGroup = useCallback((groupId: string) => {
    setTypebot(prev => prev ? {
      ...prev,
      groups: prev.groups.filter(group => group.id !== groupId),
      edges: prev.edges.filter(edge => 
        edge.from.blockId !== groupId && edge.to.groupId !== groupId
      ),
    } : prev);
  }, []);

  const duplicateGroup = useCallback((groupId: string) => {
    setTypebot(prev => {
      if (!prev) return prev;
      
      const groupToDuplicate = prev.groups.find(g => g.id === groupId);
      if (!groupToDuplicate) return prev;
      
      const newGroup: Group = {
        ...groupToDuplicate,
        id: `group_${Date.now()}`,
        title: `${groupToDuplicate.title} (cópia)`,
        graphCoordinates: {
          x: groupToDuplicate.graphCoordinates.x + 50,
          y: groupToDuplicate.graphCoordinates.y + 50,
        },
        blocks: groupToDuplicate.blocks.map(block => ({
          ...block,
          id: `block_${Date.now()}_${Math.random()}`,
          groupId: `group_${Date.now()}`,
        })),
      };
      
      return {
        ...prev,
        groups: [...prev.groups, newGroup],
      };
    });
  }, []);

  // Actions para blocos
  const createBlock = useCallback((props: { groupId: string; type: BlockType; position: Coordinates }) => {
    const newBlock: Block = {
      id: `block_${Date.now()}`,
      type: props.type,
      groupId: props.groupId,
      graphCoordinates: props.position,
      options: {},
    };
    
    setTypebot(prev => prev ? {
      ...prev,
      groups: prev.groups.map(group => 
        group.id === props.groupId 
          ? { ...group, blocks: [...group.blocks, newBlock] }
          : group
      ),
    } : prev);
    
    return newBlock;
  }, []);

  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    setTypebot(prev => prev ? {
      ...prev,
      groups: prev.groups.map(group => ({
        ...group,
        blocks: group.blocks.map(block => 
          block.id === blockId ? { ...block, ...updates } : block
        ),
      })),
    } : prev);
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setTypebot(prev => prev ? {
      ...prev,
      groups: prev.groups.map(group => ({
        ...group,
        blocks: group.blocks.filter(block => block.id !== blockId),
      })),
      edges: prev.edges.filter(edge => 
        edge.from.blockId !== blockId && edge.to.blockId !== blockId
      ),
    } : prev);
  }, []);

  const duplicateBlock = useCallback((blockId: string) => {
    setTypebot(prev => {
      if (!prev) return prev;
      
      let blockToDuplicate: Block | undefined;
      let groupId: string | undefined;
      
      for (const group of prev.groups) {
        const block = group.blocks.find(b => b.id === blockId);
        if (block) {
          blockToDuplicate = block;
          groupId = group.id;
          break;
        }
      }
      
      if (!blockToDuplicate || !groupId) return prev;
      
      const newBlock: Block = {
        ...blockToDuplicate,
        id: `block_${Date.now()}`,
        graphCoordinates: {
          x: blockToDuplicate.graphCoordinates.x + 20,
          y: blockToDuplicate.graphCoordinates.y + 20,
        },
      };
      
      return {
        ...prev,
        groups: prev.groups.map(group => 
          group.id === groupId
            ? { ...group, blocks: [...group.blocks, newBlock] }
            : group
        ),
      };
    });
  }, []);

  // Actions para edges
  const createEdge = useCallback((props: { from: Source; to: Target }) => {
    const newEdge: Edge = {
      id: `edge_${Date.now()}`,
      from: props.from,
      to: props.to,
    };
    
    setTypebot(prev => prev ? {
      ...prev,
      edges: [...prev.edges, newEdge],
    } : prev);
    
    return newEdge;
  }, []);

  const updateEdge = useCallback((edgeId: string, updates: Partial<Edge>) => {
    setTypebot(prev => prev ? {
      ...prev,
      edges: prev.edges.map(edge => 
        edge.id === edgeId ? { ...edge, ...updates } : edge
      ),
    } : prev);
  }, []);

  const deleteEdge = useCallback((edgeId: string) => {
    setTypebot(prev => prev ? {
      ...prev,
      edges: prev.edges.filter(edge => edge.id !== edgeId),
    } : prev);
  }, []);

  // Actions para variáveis
  const createVariable = useCallback((props: { name: string; value?: string }) => {
    const newVariable: Variable = {
      id: `variable_${Date.now()}`,
      name: props.name,
      value: props.value,
    };
    
    setTypebot(prev => prev ? {
      ...prev,
      variables: [...prev.variables, newVariable],
    } : prev);
    
    return newVariable;
  }, []);

  const updateVariable = useCallback((variableId: string, updates: Partial<Variable>) => {
    setTypebot(prev => prev ? {
      ...prev,
      variables: prev.variables.map(variable => 
        variable.id === variableId ? { ...variable, ...updates } : variable
      ),
    } : prev);
  }, []);

  const deleteVariable = useCallback((variableId: string) => {
    setTypebot(prev => prev ? {
      ...prev,
      variables: prev.variables.filter(variable => variable.id !== variableId),
    } : prev);
  }, []);

  return (
    <TypebotContext.Provider
      value={{
        typebot,
        currentUserMode,
        isSavingLoading,
        save,
        updateTypebot,
        createGroup,
        updateGroup,
        deleteGroup,
        duplicateGroup,
        createBlock,
        updateBlock,
        deleteBlock,
        duplicateBlock,
        createEdge,
        updateEdge,
        deleteEdge,
        createVariable,
        updateVariable,
        deleteVariable,
      }}
    >
      {children}
    </TypebotContext.Provider>
  );
};

export const useTypebot = () => {
  const context = useContext(TypebotContext);
  if (!context) {
    throw new Error('useTypebot must be used within a TypebotProvider');
  }
  return context;
};

// ============================================================================
// COMPONENTES ESSENCIAIS
// ============================================================================

// Componente principal do Graph
export const Graph: React.FC<{
  typebot: Typebot;
  onUnlockProPlanClick?: () => void;
  flex?: string;
}> = ({ typebot, onUnlockProPlanClick, flex = "1" }) => {
  const { graphPosition, setGraphPosition, zoom } = useGraphPosition();
  const { focusedElementsId, focusElement, blurElements, moveFocusedElements } = useSelectionStore();
  const { createGroup, createBlock } = useTypebot();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Coordinates | null>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  // Função para calcular posição do mouse no graph
  const projectMouse = useCallback((e: React.MouseEvent): Coordinates => {
    if (!graphRef.current) return { x: 0, y: 0 };
    
    const rect = graphRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - graphPosition.x) / graphPosition.scale,
      y: (e.clientY - rect.top - graphPosition.y) / graphPosition.scale,
    };
  }, [graphPosition]);

  // Handlers de mouse
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Apenas botão esquerdo
    
    setDragStart(projectMouse(e));
    setIsDragging(true);
    blurElements();
  }, [projectMouse, blurElements]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    
    const currentPos = projectMouse(e);
    const delta = {
      x: currentPos.x - dragStart.x,
      y: currentPos.y - dragStart.y,
    };
    
    setGraphPosition(prev => ({
      ...prev,
      x: prev.x - delta.x * prev.scale,
      y: prev.y - delta.y * prev.scale,
    }));
  }, [isDragging, dragStart, projectMouse]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  // Função para criar grupo no canvas
  const handleCreateGroup = useCallback((e: React.MouseEvent) => {
    const position = projectMouse(e);
    createGroup({ position });
  }, [projectMouse, createGroup]);

  // Função para zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const mousePosition = projectMouse(e);
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    zoom({ delta, mousePosition });
  }, [projectMouse, zoom]);

  return (
    <div
      ref={graphRef}
      style={{
        flex,
        position: 'relative',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={handleCreateGroup}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: `translate(${graphPosition.x}px, ${graphPosition.y}px) scale(${graphPosition.scale})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Renderizar grupos */}
        {typebot.groups.map(group => (
          <GroupNode key={group.id} group={group} />
        ))}
        
        {/* Renderizar edges */}
        {typebot.edges.map(edge => (
          <EdgeComponent key={edge.id} edge={edge} />
        ))}
      </div>
    </div>
  );
};

// Componente de grupo
const GroupNode: React.FC<{ group: Group }> = ({ group }) => {
  const { focusElement, focusedElementsId } = useSelectionStore();
  const { updateGroup, deleteGroup } = useTypebot();
  const isFocused = focusedElementsId.includes(group.id);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    focusElement(group.id, e.shiftKey);
  }, [group.id, focusElement]);

  const handleDelete = useCallback(() => {
    deleteGroup(group.id);
  }, [group.id, deleteGroup]);

  return (
    <div
      style={{
        position: 'absolute',
        left: group.graphCoordinates.x,
        top: group.graphCoordinates.y,
        width: GRAPH_CONSTANTS.groupWidth,
        minHeight: 100,
        backgroundColor: isFocused ? '#e3f2fd' : '#ffffff',
        border: isFocused ? '2px solid #2196f3' : '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '12px',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
      onClick={handleClick}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        {group.title}
      </div>
      
      {/* Renderizar blocos do grupo */}
      {group.blocks.map(block => (
        <BlockNode key={block.id} block={block} />
      ))}
      
      {isFocused && (
        <button
          onClick={handleDelete}
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          X
        </button>
      )}
    </div>
  );
};

// Componente de bloco
const BlockNode: React.FC<{ block: Block }> = ({ block }) => {
  const { updateBlock, deleteBlock } = useTypebot();

  return (
    <div
      style={{
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '8px',
        marginBottom: '8px',
        fontSize: '12px',
      }}
    >
      <div style={{ fontWeight: 'bold' }}>
        {block.type}
      </div>
      <div style={{ fontSize: '10px', color: '#666' }}>
        ID: {block.id}
      </div>
    </div>
  );
};

// Componente de edge (conexão)
const EdgeComponent: React.FC<{ edge: Edge }> = ({ edge }) => {
  // Implementação básica de renderização de edge
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {/* Implementar renderização de linha SVG aqui */}
    </svg>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL DO FLOW BUILDER
// ============================================================================

export const FlowBuilder: React.FC<{
  initialTypebot?: Typebot;
  onSave?: (typebot: Typebot) => void;
  readOnly?: boolean;
}> = ({ initialTypebot, onSave, readOnly = false }) => {
  const defaultTypebot: Typebot = {
    id: 'default',
    name: 'Novo Flow',
    version: '1.0.0',
    groups: [],
    edges: [],
    events: [],
    variables: [],
    settings: {},
    theme: {},
  };

  return (
    <TypebotProvider typebotId={initialTypebot?.id}>
      <GraphProvider isReadOnly={readOnly}>
        <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ 
            height: '60px', 
            backgroundColor: '#f8f9fa', 
            borderBottom: '1px solid #e9ecef',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
          }}>
            <h1 style={{ margin: 0, fontSize: '18px' }}>
              {initialTypebot?.name || 'Flow Builder'}
            </h1>
          </div>
          
          {/* Canvas */}
          <Graph 
            typebot={initialTypebot || defaultTypebot} 
            flex="1"
          />
        </div>
      </GraphProvider>
    </TypebotProvider>
  );
};

// ============================================================================
// UTILITÁRIOS E HELPERS
// ============================================================================

// Função para gerar ID único
export const createId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Função para validar typebot
export const validateTypebot = (typebot: any): typebot is Typebot => {
  try {
    typebotSchema.parse(typebot);
    return true;
  } catch {
    return false;
  }
};

// Função para exportar typebot como JSON
export const exportTypebot = (typebot: Typebot): string => {
  return JSON.stringify(typebot, null, 2);
};

// Função para importar typebot de JSON
export const importTypebot = (json: string): Typebot | null => {
  try {
    const data = JSON.parse(json);
    if (validateTypebot(data)) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
};

// Função para calcular posição de âncoras
export const calculateAnchorsPosition = (props: {
  sourcePosition: Coordinates;
  targetPosition: Coordinates;
  sourceType: "right" | "left";
  totalSegments: number;
}): Coordinates[] => {
  const { sourcePosition, targetPosition, sourceType, totalSegments } = props;
  
  const anchors: Coordinates[] = [];
  const segmentWidth = (targetPosition.x - sourcePosition.x) / (totalSegments + 1);
  
  for (let i = 1; i <= totalSegments; i++) {
    anchors.push({
      x: sourcePosition.x + segmentWidth * i,
      y: sourcePosition.y,
    });
  }
  
  return anchors;
};

// Função para verificar se dois elementos se intersectam
export const isSelectBoxIntersectingWithElement = (
  selectBox: { x: number; y: number; width: number; height: number },
  element: { x: number; y: number; width: number; height: number }
): boolean => {
  return !(
    selectBox.x > element.x + element.width ||
    selectBox.x + selectBox.width < element.x ||
    selectBox.y > element.y + element.height ||
    selectBox.y + selectBox.height < element.y
  );
};

// Função para calcular dimensões da caixa de seleção
export const computeSelectBoxDimensions = (
  startPoint: Coordinates,
  endPoint: Coordinates
): { x: number; y: number; width: number; height: number } => {
  return {
    x: Math.min(startPoint.x, endPoint.x),
    y: Math.min(startPoint.y, endPoint.y),
    width: Math.abs(endPoint.x - startPoint.x),
    height: Math.abs(endPoint.y - startPoint.y),
  };
};

export default FlowBuilder; 