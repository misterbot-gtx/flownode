import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Edit3, Trash2, Plus } from 'lucide-react';
import { FlowElement } from '@/types/flow';

interface FlowNodeData {
  label: string;
  element: FlowElement;
  isEditing?: boolean;
  content?: string;
}

export const FlowNode = memo(({ data, id, selected, parentId }: NodeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const nodeData = data as unknown as FlowNodeData;
  const [isEditing, setIsEditing] = useState(nodeData.isEditing || false);
  const [content, setContent] = useState(nodeData.content || 'Clique para editar...');

  const isChildNode = !!parentId;

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

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleContentSave = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleContentSave();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`
        relative min-w-[200px] max-w-[300px] rounded-xl border-2 bg-flow-node 
        transition-all duration-200 hover:shadow-lg
        ${selected ? 'border-primary shadow-lg shadow-primary/20' : getCategoryColor()}
        ${isHovered ? 'shadow-md' : ''}
        ${isChildNode ? 'hover:scale-[1.01] cursor-grab active:cursor-grabbing' : 'hover:scale-[1.02] cursor-grab active:cursor-grabbing'}
        ${isChildNode ? 'opacity-90' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={isChildNode ? 'Arraste este item para mover o grupo inteiro' : ''}
    >
      {/* Handles isoladas do conteúdo */}
      <div className="relative h-[1px]">
        <Handle
          type="target"
          position={Position.Top}
          className="absolute z-10 left-1/2 -translate-x-1/2 w-2.5 h-2.5 border-2 border-primary bg-background"
          style={{ top: '-5px' }}
        />
      </div>

      {/* Conteúdo do Node */}
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
                onClick={handleEditClick}
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
              onBlur={handleContentSave}
              onKeyDown={handleKeyDown}
              className="w-full p-2 text-sm bg-flow-sidebar-item border border-border/30 rounded-md resize-none focus:outline-none focus:border-primary"
              rows={3}
              autoFocus
            />
          ) : (
            <div
              className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors p-2 rounded-md hover:bg-flow-node-hover"
              onClick={handleEditClick}
            >
              {content}
            </div>
          )}
        </div>
      </div>

      {/* Handle de saída separada */}
      <div className="relative h-0">
        <Handle
          type="source"
          position={Position.Bottom}
          className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 border-2 border-primary bg-background"
          style={{ bottom: '-5px' }}
        />
      </div>
    </div>
  );
});
