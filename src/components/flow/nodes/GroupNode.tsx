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
          ${isDragOver ? 'border-primary bg-primary/10 shadow-lg scale-[1.03]' : ''}
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

// Componente para renderizar a prévia entre nós
const DragPreview = ({ index, isVisible }: { index: number; isVisible: boolean }) => {
  if (!isVisible) return null;

  return (
    <div
      className="w-full h-2 mb-2 mt-2 bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-lg rounded"
    >
      
    </div>
  );
};

export const GroupNode = memo(({ data, id, selected }: GroupNodeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(-1);
  const groupData = data as unknown as GroupNodeData;
  const [isEditing, setIsEditing] = useState(groupData.isEditing || false);
  const [title, setTitle] = useState(groupData.title || 'Group #1');
  const [localChildNodes, setLocalChildNodes] = useState<Node[]>(groupData.childNodes || []);
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalChildNodes(groupData.childNodes || []);
  }, [groupData.childNodes]);

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
    e.stopPropagation();
    setIsDragOver(true);

    if (dragRef.current && localChildNodes.length > 0) {
      const rect = dragRef.current.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const itemHeight = rect.height / localChildNodes.length;
      const newIndex = Math.min(Math.max(Math.floor(offsetY / itemHeight), 0), localChildNodes.length);
      setDragOverIndex(newIndex);
    } else {
      // Se não há filhos, sempre mostra o preview no final
      setDragOverIndex(0);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragOverIndex(-1);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
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
        ${isDragOver ? 'border-primary bg-primary/20 shadow-2xl shadow-primary/30 scale-[1.03] z-20' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        className={`flex flex-col gap-2 ${localChildNodes.length > 0 ? 'min-h-[60px]' : 'min-h-[60px]'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && localChildNodes.length === 0 ? (
          <div className="w-full h-14 mb-2 mt-2 bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-lg rounded">
            
          </div>
        ) : localChildNodes && localChildNodes.length > 0 ? (
          <div className="space-y-2">
            {localChildNodes.map((childNode, index) => (
              <div key={childNode.id}>
                {index === dragOverIndex && isDragOver && (
                  <div className="w-full h-14 mb-2 mt-2 bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-lg rounded">
                    
                  </div>
                )}
                <GroupChildNode node={childNode} index={index} isDragOver={false} />
                {index === localChildNodes.length - 1 && dragOverIndex === localChildNodes.length && isDragOver && (
                  <div className="w-full h-14 mb-2 mt-2 bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-lg rounded">
                    
                  </div>
                )}
              </div>
            ))}
            {/* Preview no final se estiver arrastando para baixo de todos */}
            {isDragOver && dragOverIndex === localChildNodes.length && (
              <div className="w-full h-14 mb-2 mt-2 bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-lg rounded">
                
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center text-muted-foreground text-sm py-4">
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