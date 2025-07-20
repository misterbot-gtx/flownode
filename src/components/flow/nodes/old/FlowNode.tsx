import { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Edit3, Trash2, Plus } from 'lucide-react';
import { FlowNodeData } from '../../../../types/flow';

export const FlowNode = memo(({ data, id, selected, parentId }: NodeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const nodeData = data as unknown as FlowNodeData & { setNodeEditing?: (id: string, isEditing: boolean) => void };
  const [isEditing, setIsEditing] = useState(nodeData.isEditing || false);
  const [content, setContent] = useState(nodeData.element.description ?? 'Clique para editar...');
  const [shouldRemoveStyle, setShouldRemoveStyle] = useState(false);
  const isChildNode = !!parentId;


  useEffect(() => {
    if (data.tempHeightZero) {
      const timer = setTimeout(() => {
        setShouldRemoveStyle(true);
        console.log("Posição do edge atualizada");
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShouldRemoveStyle(false);
    }
  }, [data.tempHeightZero]);

  const getCategoryColor = () => {
    switch (nodeData.element.category) {
      case 'bubbles':
        return 'border-category-bubble/50 bg-category-bubble/10';
      case 'inputs':
        return 'border-category-input/50 bg-category-input/10';
      case 'conditionals':
        return 'border-category-conditional/50 bg-category-conditional/10';
      default:
        return 'border-border/50 bg-flow-node/50';
    }
  };

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    nodeData.setNodeEditing?.(id, true);
  };

  const stopEdit = () => {
    setIsEditing(false);
    nodeData.setNodeEditing?.(id, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      stopEdit();
    }
    if (e.key === 'Escape') {
      stopEdit();
    }
  };

  return (
    <div
      // style={data.tempHeightZero && !shouldRemoveStyle ? { borderWidth: '2.5px'  } : {}}
      className={`
        relative w-[200px] rounded-xl border-2 bg-flow-node transition-all duration-200 hover:shadow-lg
        ${selected ? 'border-primary shadow-lg shadow-primary/20' : getCategoryColor()}
        ${isHovered ? 'shadow-md' : ''}
        ${isChildNode ? 'hover:scale-[1.01] cursor-grab active:cursor-grabbing' : 'hover:scale-[1.02] cursor-grab active:cursor-grabbing'}
        ${isChildNode ? 'opacity-90' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={isChildNode ? 'Arraste este item para mover o grupo inteiro' : ''}
    >
      {/* Handles */}
        <Handle
          type="target"
          position={Position.Top}
          className="absolute z-10 left-1/2 -translate-x-1/2 w-2.5 h-2.5 border-2 border-primary bg-background"
          style={{ top: '-5px' }}
        />

      {/* Conteúdo do Nó */}
      <div className="p-4 space-y-2 min-h-[120px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{nodeData.element.icon}</span>
            <span className="text-sm font-medium text-foreground">
              {nodeData.element.label}
            </span>
            {isChildNode && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                Move Grupo
              </span>
            )}
          </div>

          {(isHovered || selected) && (
            <div className="flex items-center gap-1">
              <button
                onClick={startEdit}
                className="p-1 rounded-md hover:bg-flow-node-hover transition-colors"
              >
                <Edit3 className="w-3 h-3 text-muted-foreground hover:text-foreground" />
              </button>
              <button className="p-1 rounded-md hover:bg-flow-node-hover transition-colors">
                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          )}
        </div>

        {/* Conteúdo editável */}
        <div className="min-h-[60px] flex flex-col justify-center">
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={stopEdit}
              onKeyDown={handleKeyDown}
              className="w-full p-2 text-sm bg-flow-sidebar-item border border-border/30 rounded-md resize-none focus:outline-none focus:border-primary"
              rows={3}
              autoFocus
            />
          ) : (
            <div
              className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors p-2 rounded-md hover:bg-flow-node-hover"
              onClick={startEdit}
            >
              {content}
            </div>
          )}
        </div>
      </div>

      {/* Handle de saída */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 border-2 border-primary bg-background"
          style={{ bottom: '-5px' }}
        />
    </div>
  );
});