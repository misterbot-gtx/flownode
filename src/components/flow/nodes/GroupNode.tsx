import { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps, Node, useReactFlow } from '@xyflow/react';
import { Trash2, Plus, Copy } from 'lucide-react';

interface GroupNodeData {
  title: string;
  isEditing?: boolean;
}

interface GroupNodeProps extends NodeProps {}

// Componente para renderizar nós filhos com suporte a drag-over/drop
const GroupChildNode = memo(
  ({
    node,
    index,
    isDragOver,
    isCursorOutside,
  }: {
    node: Node;
    index: number;
    isDragOver?: boolean;
    isCursorOutside?: boolean;
  }) => {
    const nodeData = node.data as any;

    return (
      <div
        className={`
          group-child-node relative w-full p-3 rounded-lg border border-border/30 bg-flow-node/80
          transition-all duration-200 hover:shadow-md cursor-pointer
          opacity-90
          ${isDragOver ? 'border-primary bg-primary/10 shadow-lg' : ''}
          hover:bg-flow-node-hover
          ${isCursorOutside ? 'border-destructive bg-destructive/10 shadow-lg shadow-destructive/20 ring-2 ring-destructive/50' : ''}
        `}
        draggable
        onMouseEnter={() => {
          // Feedback visual quando passa o mouse em cima
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          // Permitir seleção do elemento individual
          const customEvent = new CustomEvent('selectChildNode', {
            detail: {
              nodeId: node.id,
              node: node,
            },
          });
          window.dispatchEvent(customEvent);
        }}
        onDragStart={(e) => {
          e.stopPropagation(); // CRÍTICO: parar propagação para evitar que o grupo seja arrastado
          
          e.dataTransfer.setData('application/reactflow-child', node.id);
          e.dataTransfer.effectAllowed = 'move';
          
          // ELEMENTO SEGUIR CURSOR + Feedback visual melhorado
          const element = e.currentTarget as HTMLElement;
          element.classList.add('dragging-out');
          
          // Posicionamento fixo para seguir o cursor
          const rect = element.getBoundingClientRect();
          element.style.cssText = `
            position: fixed;
            z-index: 1000;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            pointer-events: none;
            transform: scale(1.08) rotate(2deg);
            box-shadow: 0 25px 50px rgba(0,0,0,0.4), 0 0 25px rgba(239, 68, 68, 0.6);
            border: 3px solid #ef4444;
            background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,248,248,0.95));
            border-radius: 12px;
            cursor: grabbing;
            transition: all 0.2s ease;
          `;
          
          // Overlay transparente global
          const overlay = document.createElement('div');
          overlay.className = 'cursor-outside-overlay';
          overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, transparent 70%);
            z-index: 999;
            pointer-events: none;
            animation: fadeIn 0.3s ease;
          `;
          document.body.appendChild(overlay);
          
          // Indicador visual centralizado grande
          const indicator = document.createElement('div');
          indicator.className = 'group-drag-out-indicator';
          indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            z-index: 1001;
            box-shadow: 0 8px 20px rgba(239, 68, 68, 0.5), 0 0 30px rgba(239, 68, 68, 0.3);
            animation: bounce 1s ease-in-out infinite, pulse 2s ease-in-out infinite;
            backdrop-filter: blur(10px);
          `;
          indicator.textContent = '🚀';
          indicator.title = 'Arraste para fora para remover do grupo';
          document.body.appendChild(indicator);
          
          // Adicionar listener para seguir o mouse
          const handleMouseMove = (e: MouseEvent) => {
            element.style.left = `${e.clientX - rect.width / 2}px`;
            element.style.top = `${e.clientY - rect.height / 2}px`;
          };
          
          // Salvar referência para limpeza
          (element as any)._mouseMoveHandler = handleMouseMove;
          document.addEventListener('mousemove', handleMouseMove);
        }}
        onDragEnd={(e) => {
          e.stopPropagation(); // CRÍTICO: parar propagação
          
          // Remover classes visuais e restaurar posição
          const element = e.currentTarget as HTMLElement;
          element.classList.remove('dragging-out');
          element.style.cssText = '';
          
          // Limpar listeners
          const handleMouseMove = (element as any)._mouseMoveHandler;
          if (handleMouseMove) {
            document.removeEventListener('mousemove', handleMouseMove);
            delete (element as any)._mouseMoveHandler;
          }
          
          // Remover elementos criados no documento
          const indicator = document.querySelector('.group-drag-out-indicator');
          if (indicator) indicator.remove();
          
          const overlay = document.querySelector('.cursor-outside-overlay');
          if (overlay) overlay.remove();
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
  const reactFlow = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false); // novo estado para controlar preview
  const [isPreviewStable, setIsPreviewStable] = useState(false); // novo estado para preview estável
  const [isCursorOutside, setIsCursorOutside] = useState(false); // novo estado para detectar cursor fora
  const groupData = data as unknown as GroupNodeData;
  const [isEditing, setIsEditing] = useState(groupData.isEditing || false);
  const [title, setTitle] = useState(groupData.title || 'Group #1');
  const [localChildNodes, setLocalChildNodes] = useState<Node[]>([]);
  const dragRef = useRef<HTMLDivElement>(null);
  const [draggedChildId, setDraggedChildId] = useState<string | null>(null);
  const previousDragOverIndexRef = useRef<number>(-1); // Para comparar índices
  const groupContainerRef = useRef<HTMLDivElement>(null); // ref para o container do grupo
  
  // Usar ref para armazenar o timestamp da última atualização
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    // Buscar nós filhos do React Flow baseado no parentId
    const updateChildNodes = () => {
      try {
        const allNodes = reactFlow.getNodes();
        const childNodes = allNodes
          .filter(node => node.parentId === id)
          .sort((a, b) => {
            // Ordena primeiro por Y (linha), depois por X (coluna)
            if (a.position.y !== b.position.y) {
              return a.position.y - b.position.y;
            }
            return a.position.x - b.position.x;
          });

        setLocalChildNodes(childNodes);
        lastUpdateRef.current = Date.now();
      } catch (error) {
        console.warn('Erro ao buscar nós filhos:', error);
      }
    };

    updateChildNodes();
  }, [id, reactFlow, isPreviewMode]);

  useEffect(() => {
    // Escuta global para detectar drag em andamento
    const handleDragStart = (e: any) => {
      setIsDragging(true);
      setIsCursorOutside(false);
      // Detecta se é um nó filho sendo arrastado
      if (e && e.dataTransfer) {
        const childId = e.dataTransfer.getData('application/reactflow-child');
        if (childId) setDraggedChildId(childId);
      }
    };
    const handleDragEnd = () => {
      setIsDragging(false);
      setDraggedChildId(null);
      setIsCursorOutside(false);
    };
    const handleDragMove = (e: DragEvent) => {
      if (isDragging && draggedChildId && groupContainerRef.current) {
        const rect = groupContainerRef.current.getBoundingClientRect();
        const isOutside =
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom;
        
        if (isOutside !== isCursorOutside) {
          setIsCursorOutside(isOutside);
          
          // NOVO COMPORTAMENTO: Remover elemento automaticamente quando sai do grupo
          if (isOutside && !isCursorOutside) {
            const draggedNode = localChildNodes.find((node) => node.id === draggedChildId);
            if (draggedNode) {
              // Disparar evento de remoção automática
              const customEvent = new CustomEvent('removeFromGroup', {
                detail: {
                  groupId: id,
                  elementId: draggedChildId,
                  draggedElement: draggedNode,
                  dropPosition: {
                    x: e.clientX,
                    y: e.clientY,
                  },
                  isAutomatic: true, // Indicador de que foi remoção automática
                },
              });
              window.dispatchEvent(customEvent);
              
              // Remover o elemento do estado local imediatamente
              setLocalChildNodes(prev => prev.filter(node => node.id !== draggedChildId));
            }
          }
        }
      }
    };
    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('dragend', handleDragEnd);
    window.addEventListener('drag', handleDragMove);
    return () => {
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('dragend', handleDragEnd);
      window.removeEventListener('drag', handleDragMove);
    };
  }, [isDragging, draggedChildId, isCursorOutside]);

  useEffect(() => {
    // Reseta preview estável quando um novo drag é detectado
    const handleNewDragStart = () => {
      if (isPreviewStable) {
        setIsPreviewStable(false);
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
    }

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

      // Log quando a posição muda com informação da zona de sensibilidade
      if (newIndex !== previousIndex) {
        previousDragOverIndexRef.current = newIndex;
      }

      setDragOverIndex(newIndex);
    } else if (rect && localChildNodes.length === 0) {
      // Grupo vazio - sempre mostra preview na posição 0
      const previousIndex = previousDragOverIndexRef.current;
      if (previousIndex !== 0) {
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

      // Só reseta os estados se realmente saiu do grupo
      if (isLeavingGroup) {
        setIsDragOver(false);
        setDragOverIndex(-1);
        setIsPreviewMode(false); // Desativa modo preview
        setIsPreviewStable(false); // Reseta preview estável
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
    previousDragOverIndexRef.current = -1; // Reset para próxima vez
    
    const elementData = e.dataTransfer.getData('application/reactflow');
    const draggedNodeId = e.dataTransfer.getData('application/reactflow-child');
    
    // Verificar se é um elemento sendo adicionado ao grupo
    if (elementData) {
      const customEvent = new CustomEvent('groupDrop', {
        detail: {
          groupId: id,
          elementData: elementData,
          insertIndex: dragOverIndex >= 0 ? dragOverIndex : localChildNodes.length,
          position: {
            x: e.clientX,
            y: e.clientY,
          },
        },
      });
      window.dispatchEvent(customEvent);
    }
    
    // Se for um nó filho sendo movido
    if (draggedNodeId) {
      const draggedNode = localChildNodes.find((node) => node.id === draggedNodeId);
      if (draggedNode) {
        // Verificar se o drop foi dentro ou fora do grupo
        const rect = dragRef.current?.getBoundingClientRect();
        const isInsideGroup = rect &&
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        
        if (isInsideGroup) {
          // Drop dentro do grupo - reorganizar elementos com posicionamento automático
          const updatedNodes = [...localChildNodes];
          const draggedIndex = updatedNodes.findIndex((node) => node.id === draggedNodeId);
          if (draggedIndex !== -1) {
            updatedNodes.splice(draggedIndex, 1);
            const newIndex = dragOverIndex >= 0 ? dragOverIndex : localChildNodes.length;
            updatedNodes.splice(newIndex, 0, draggedNode);
            setLocalChildNodes(updatedNodes);

            // Disparar evento para recalcular posições usando as novas funções
            const customEvent = new CustomEvent('reorganizeGroupChildren', {
              detail: {
                groupId: id,
                newChildrenOrder: updatedNodes,
              },
            });
            window.dispatchEvent(customEvent);
          }
        } else {
          // Drop fora do grupo - remover elemento do grupo
          const customEvent = new CustomEvent('removeFromGroup', {
            detail: {
              groupId: id,
              elementId: draggedNodeId,
              draggedElement: draggedNode,
              dropPosition: {
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
      ref={groupContainerRef}
      className={`
        relative min-w-[280px] min-h-[120px] p-4 rounded-xl border-2 bg-flow-group
        transition-all duration-200 hover:shadow-lg
        ${selected ? 'border-primary shadow-lg shadow-primary/20' : 'border-border/30 hover:border-border/50'}
        ${isHovered ? 'shadow-md' : ''}
        ${isDragOver ? 'border-primary bg-primary/20 shadow-2xl shadow-primary/30 z-20' : ''}
        ${isCursorOutside && draggedChildId ? 'border-destructive bg-destructive/10 shadow-lg shadow-destructive/20' : ''}
        ${isDragging && draggedChildId ? 'pointer-events-none' : ''}
        ${isCursorOutside && draggedChildId ? 'animate-pulse' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={(e) => {
        // IMPEDIR que o grupo seja selecionado quando um elemento filho está sendo arrastado
        if (isDragging && draggedChildId) {
          e.stopPropagation();
          e.preventDefault();
          return false;
        }
      }}
      onClick={(e) => {
        // Só seleciona o grupo se o clique não foi em um elemento filho e não há arrasto em andamento
        const target = e.target as HTMLElement;
        if (!target.closest('.group-child-node') && !isDragging) {
          e.stopPropagation();
        }
      }}
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
              onClick={() => {
                // TODO: Implementar lógica de copiar grupo
              }}
              className="p-1 rounded-md hover:bg-flow-node-hover transition-colors"
            >
              <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
            </button>
            <button
              onClick={() => {
                // TODO: Implementar lógica de deletar grupo
              }}
              className="group p-1 rounded-md hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-3 h-3 text-muted-foreground group-hover:text-red-400 transition-colors" />
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
                  <GroupChildNode
                    node={childNode}
                    index={index}
                    isDragOver={false}
                    isCursorOutside={isCursorOutside && draggedChildId === childNode.id}
                  />
                  <DividerWithHover isDragging={isDragging} isActive={isActive} />
                  
                  {/* Debug info para desenvolvimento */}
                  {isCursorOutside && draggedChildId === childNode.id && (
                    <div className="absolute top-0 right-0 bg-destructive text-white text-xs px-1 rounded-bl">
                      FORA DO GRUPO
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center text-muted-foreground text-sm py-4 mt-2 mb-2">
            <div className="text-center">
              <Plus className="w-5 h-5 mx-auto mb-1 opacity-50" />
              <span className="opacity-70">Arraste elementos aqui</span>
              {isCursorOutside && draggedChildId && (
                <div className="text-xs text-destructive mt-1 opacity-80">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-destructive/20 rounded animate-pulse">
                    <span className="text-lg">🚨</span> Elemento será removido do grupo
                  </span>
                </div>
              )}
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