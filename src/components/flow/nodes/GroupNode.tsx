import { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Edit3, Plus, Settings } from 'lucide-react';

interface GroupNodeData {
  title: string;
  nodes: string[];
  childNodes?: Node[];
  isEditing?: boolean;
}

interface GroupNodeProps extends NodeProps {
  childNodes?: Node[];
}

// Componente para renderizar nós filhos com suporte a drag-over/drop
const GroupChildNode = memo(
  ({
    node,
    index,
    isDragOver,
  }: {
    node: Node;
    index: number;
    isDragOver?: boolean;
  }) => {
    const nodeData = node.data as any;

    return (
      <div
        className={`
          relative w-full p-3 rounded-lg border border-border/30 bg-flow-node/80
          transition-all duration-200 hover:shadow-md
          opacity-90
          ${isDragOver ? 'border-primary bg-primary/10 shadow-lg' : ''}
        `}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/reactflow-child', node.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
      >
        {/* Node Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">{nodeData.element?.icon}</span>
          <span className="text-xs font-medium text-foreground">
            {nodeData.label}
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded">
            Grupo
          </span>
        </div>

        {/* Node Content */}
        <div className="text-xs text-muted-foreground">
          {nodeData.content || 'Clique para editar...'}
        </div>
      </div>
    );
  }
);

export const GroupNode = memo(({ data, id, selected }: GroupNodeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false); // novo estado para controlar preview
  const [isPreviewStable, setIsPreviewStable] = useState(false); // novo estado para preview estável
  const groupData = data as unknown as GroupNodeData;
  const [isEditing, setIsEditing] = useState(groupData.isEditing || false);
  const [title, setTitle] = useState(groupData.title || 'Group #1');
  const [localChildNodes, setLocalChildNodes] = useState<Node[]>(groupData.childNodes || []);
  const dragRef = useRef<HTMLDivElement>(null);
  const [draggedChildId, setDraggedChildId] = useState<string | null>(null);
  const previousDragOverIndexRef = useRef<number>(-1); // Para comparar índices
  
  // Usar ref para armazenar o timestamp da última atualização
  const lastUpdateRef = useRef<number>((groupData as any)._updateTimestamp || 0);

  useEffect(() => {
    // Só atualiza se houver mudanças reais nos filhos e não estiver em modo de preview
    if (!isPreviewMode && groupData.childNodes) {
      const currentTimestamp = (groupData as any)._updateTimestamp || 0;
      
      // Evita atualizações desnecessárias se não houve mudanças significativas
      if (currentTimestamp > lastUpdateRef.current) {
        setLocalChildNodes(groupData.childNodes);
        lastUpdateRef.current = currentTimestamp;
      }
    }
  }, [groupData.childNodes, (groupData as any)._updateTimestamp, isPreviewMode]);

  useEffect(() => {
    // Escuta global para detectar drag em andamento
    const handleDragStart = (e: any) => {
      setIsDragging(true);
      // Detecta se é um nó filho sendo arrastado
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
    return () => {
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  useEffect(() => {
    // Reseta preview estável quando um novo drag é detectado
    const handleNewDragStart = () => {
      if (isPreviewStable) {
        setIsPreviewStable(false);
        console.log('🔄 PREVIEW ESTÁVEL RESETADO (novo drag detectado) no grupo:', title);
      }
    };

    window.addEventListener('dragstart', handleNewDragStart);
    return () => {
      window.removeEventListener('dragstart', handleNewDragStart);
    };
  }, [isPreviewStable, title]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleTitleSave = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    
    // LÓGICA DE PREVIEW ESTÁVEL: Só ativa preview se não estiver estável ainda
    if (!isPreviewStable) {
      setIsPreviewMode(true);
      setIsPreviewStable(true);
      console.log('🔒 PREVIEW ESTABILIZADO para grupo:', title);
    }
    
    // Log básico para debug - SEMPRE mostra
    console.log('🎯 GROUPDRAGOVER:', title, 'isPreviewStable:', isPreviewStable, 'isPreviewMode:', isPreviewMode);
    
    // Verificar tipos de dados disponíveis
    const types = Array.from(e.dataTransfer.types || []);
    console.log('📋 DataTransfer types:', types);
    
    const draggedNodeId = e.dataTransfer.getData('application/reactflow-child');
    const elementData = e.dataTransfer.getData('application/reactflow');
    
    console.log('🔍 Debug info:', {
      draggedNodeId,
      elementData: !!elementData,
      elementPreview: elementData ? elementData.substring(0, 50) + '...' : null,
      localChildNodesCount: localChildNodes.length
    });
    
    // LÓGICA MELHORADA: Zona de 20% de sensibilidade para mudança de posição
    const previousIndex = previousDragOverIndexRef.current;
    const rect = dragRef.current?.getBoundingClientRect();
    
    if (rect && localChildNodes.length > 0) {
      const offsetY = e.clientY - rect.top;
      const totalHeight = rect.height;
      const itemHeight = totalHeight / localChildNodes.length;
      
      // Calcula a posição base (centro de cada item)
      const baseIndex = Math.floor(offsetY / itemHeight);
      
      // Verificar se é especificamente o último componente no grupo (último índice)
      const isLastComponent = localChildNodes.length > 0 && baseIndex === localChildNodes.length - 1;
      
      // Define a zona de sensibilidade: 25% apenas para último componente, 5% para outros (muito restritivo)
      const sensitivityZone = itemHeight * (isLastComponent ? 0.25 : 0.05);
      const positionInItem = offsetY % itemHeight;
      
      // Determina se está na zona de sensibilidade para mudar de posição
      let newIndex = baseIndex;
      
      if (positionInItem < sensitivityZone) {
        // Está na zona de sensibilidade - pode ser para o item anterior
        newIndex = Math.max(0, baseIndex - 1);
      } else if (positionInItem > itemHeight - sensitivityZone) {
        // Está na zona de sensibilidade - pode ser para o próximo item
        newIndex = Math.min(localChildNodes.length, baseIndex + 1);
      }
      
      // Garante que o índice está dentro dos limites válidos
      newIndex = Math.max(0, Math.min(newIndex, localChildNodes.length));
      
      console.log('🎯 SENSITIVITY DEBUG:', {
        offsetY,
        itemHeight,
        baseIndex,
        positionInItem,
        sensitivityZone: sensitivityZone.toFixed(2),
        newIndex,
        previousIndex,
        isPositionChange: newIndex !== previousIndex
      });
      
      // Log quando a posição muda com informação da zona de sensibilidade
      if (newIndex !== previousIndex) {
        const direction = newIndex < previousIndex ? 'para cima' : 'para baixo';
        const zoneInfo = positionInItem < sensitivityZone ? '(zona superior - 20%)' :
                        positionInItem > itemHeight - sensitivityZone ? '(zona inferior - 20%)' : '(zona central)';
        
        if (draggedNodeId) {
          console.log(`🔄 Nó filho '${draggedNodeId}' mudou posição ${direction} ${zoneInfo} no grupo '${title}' (índice: ${previousIndex} → ${newIndex})`);
        } else if (elementData) {
          try {
            const element = JSON.parse(elementData);
            console.log(`📦 Elemento '${element.label}' mudou posição ${direction} ${zoneInfo} no grupo '${title}' (índice: ${previousIndex} → ${newIndex})`);
          } catch (err) {
            console.log(`📦 Elemento mudou posição ${direction} ${zoneInfo} no grupo '${title}' (índice: ${previousIndex} → ${newIndex})`);
          }
        }
        
        previousDragOverIndexRef.current = newIndex;
      }
      
      setDragOverIndex(newIndex);
    } else if (rect && localChildNodes.length === 0) {
      // Grupo vazio - sempre mostra preview na posição 0
      const previousIndex = previousDragOverIndexRef.current;
      if (previousIndex !== 0) {
        if (draggedNodeId) {
          console.log(`🔄 Nó filho '${draggedNodeId}' será posicionado no início do grupo '${title}' (grupo vazio)`);
        } else if (elementData) {
          try {
            const element = JSON.parse(elementData);
            console.log(`📦 Elemento '${element.label}' será posicionado no início do grupo '${title}' (grupo vazio)`);
          } catch (err) {
            console.log(`📦 Elemento será posicionado no início do grupo '${title}' (grupo vazio)`);
          }
        }
        previousDragOverIndexRef.current = 0;
      }
      setDragOverIndex(0);
    } else {
      // Fallback - não há referência ou grupo vazio
      setDragOverIndex(0);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Verifica se realmente saiu do grupo (não apenas mudou para um divider interno)
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      const isLeavingGroup =
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom;
      
      // Log quando sai do foco do grupo
      if (isLeavingGroup && isDragOver) {
        const draggedNodeId = e.dataTransfer.getData('application/reactflow-child');
        const isChildNode = draggedNodeId !== '';
        
        if (isChildNode) {
          console.log(`❌ Nó filho '${draggedNodeId}' saiu do foco do grupo '${title}'`);
        } else {
          const elementData = e.dataTransfer.getData('application/reactflow');
          if (elementData) {
            try {
              const element = JSON.parse(elementData);
              console.log(`❌ Elemento '${element.label}' saiu do foco do grupo '${title}'`);
            } catch (err) {
              console.log(`❌ Elemento saiu do foco do grupo '${title}'`);
            }
          }
        }
      }
      
      // Só reseta os estados se realmente saiu do grupo
      if (isLeavingGroup) {
        setIsDragOver(false);
        setDragOverIndex(-1);
        setIsPreviewMode(false); // Desativa modo preview
        setIsPreviewStable(false); // Reseta preview estável
        console.log('🔓 PREVIEW ESTÁVEL RESETADO para grupo:', title);
        previousDragOverIndexRef.current = -1; // Reset para próxima vez
      }
    } else {
      // Fallback se não conseguir verificar a posição
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
    
    // RESET COMPLETO DOS ESTADOS DE PREVIEW
    setIsDragOver(false);
    setIsPreviewMode(false); // Desativa modo preview
    setIsPreviewStable(false); // Reseta preview estável
    console.log('🔓 PREVIEW ESTÁVEL RESETADO após DROP no grupo:', title);
    previousDragOverIndexRef.current = -1; // Reset para próxima vez
    
    const elementData = e.dataTransfer.getData('application/reactflow');
    if (elementData) {
      const customEvent = new CustomEvent('groupDrop', {
        detail: {
          groupId: id,
          elementData: elementData,
          position: {
            x: e.clientX,
            y: e.clientY,
          },
        },
      });
      window.dispatchEvent(customEvent);
    }
    // Se for um nó filho sendo movido dentro do grupo
    const draggedNodeId = e.dataTransfer.getData('application/reactflow-child');
    if (draggedNodeId) {
      const draggedNode = localChildNodes.find((node) => node.id === draggedNodeId);
      if (draggedNode) {
        const updatedNodes = [...localChildNodes];
        const draggedIndex = updatedNodes.findIndex((node) => node.id === draggedNodeId);
        if (draggedIndex !== -1) {
          updatedNodes.splice(draggedIndex, 1);
          updatedNodes.splice(dragOverIndex >= 0 ? dragOverIndex : localChildNodes.length, 0, draggedNode);
          setLocalChildNodes(updatedNodes);

          const customEvent = new CustomEvent('childNodeDrop', {
            detail: {
              groupId: id,
              targetIndex: dragOverIndex >= 0 ? dragOverIndex : localChildNodes.length,
              elementId: draggedNodeId,
              updatedNodes: updatedNodes,
              position: {
                x: e.clientX,
                y: e.clientY,
              },
            },
          });
          window.dispatchEvent(customEvent);
        }
      }
    }
    setDragOverIndex(-1);
  };

  return (
    <div
      className={`
        relative min-w-[280px] min-h-[120px] p-4 rounded-xl border-2 bg-flow-group 
        transition-all duration-200 hover:shadow-lg
        ${selected ? 'border-primary shadow-lg shadow-primary/20' : 'border-border/30 hover:border-border/50'}
        ${isHovered ? 'shadow-md' : ''}
        ${isDragOver ? 'border-primary bg-primary/20 shadow-2xl shadow-primary/30 z-20' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Group Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/20">
        {isEditing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleKeyDown}
            className="text-sm font-semibold bg-transparent border-none outline-none text-foreground focus:text-primary"
            autoFocus
          />
        ) : (
          <h3
            className="text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
            onClick={handleEditClick}
          >
            {title}
          </h3>
        )}

        {/* Group Actions */}
        {(isHovered || selected) && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleEditClick}
              className="p-1 rounded-md hover:bg-flow-node-hover transition-colors"
            >
              <Edit3 className="w-3 h-3 text-muted-foreground hover:text-foreground" />
            </button>
            <button className="p-1 rounded-md hover:bg-flow-node-hover transition-colors">
              <Settings className="w-3 h-3 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* Group Content Area */}
      <div
        ref={dragRef}
        className={`${isDragOver ? 'view' : 'view'}`}
      >
        {localChildNodes && localChildNodes.length > 0 ? (
          <div className="view-content">
            {/* Divider no topo */}
            {(() => {
              if (localChildNodes.length === 0) return null;
              let isActive = dragOverIndex === 0;
              if (
                draggedChildId &&
                localChildNodes[0]?.id === draggedChildId &&
                dragOverIndex === 0
              ) {
                isActive = false;
              }
              // Se está em dragOver e não há dragOverIndex, manter o divider topo aberto
              if (isDragOver && dragOverIndex === -1 && localChildNodes.length > 0) {
                isActive = true;
              }
              return <DividerWithHover isDragging={isDragging} isActive={isActive} />;
            })()}
            {/* Renderiza filhos e dividers abaixo de cada filho */}
            {localChildNodes.map((childNode, index) => {
              let isActive = dragOverIndex === index + 1;
              if (draggedChildId && childNode.id === draggedChildId && dragOverIndex === index + 1) {
                isActive = false;
              }
              return (
                <div key={childNode.id + '-' + index} className="view-child">
                  <GroupChildNode node={childNode} index={index} isDragOver={false} />
                  <DividerWithHover isDragging={isDragging} isActive={isActive} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center text-muted-foreground text-sm py-4 mt-2 mb-2">
            <div className="text-center">
              <Plus className="w-5 h-5 mx-auto mb-1 opacity-50" />
              <span className="opacity-70">Arraste elementos aqui</span>
            </div>
          </div>
        )}
      </div>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 border-2 border-primary bg-background transition-transform"
        style={{ top: '-1px', width: 7 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 border-2 border-primary bg-background transition-transform"
        style={{ bottom: '-1px', width: 7 }}
      />
    </div>
  );
});

function DividerWithHover({
  isDragging,
  isActive,
}: {
  isDragging: boolean;
  isActive: boolean;
}) {
  return (
    <div
      className={`view-divider ${isActive && isDragging ? 'active' : ''}`}
    />
  );
}