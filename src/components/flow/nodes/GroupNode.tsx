import { memo, useState, useEffect } from 'react';
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


// Componente simplificado para renderizar nós filhos dentro do grupo
const GroupChildNode = memo(({ node, index }: { node: Node; index: number }) => {
  const nodeData = node.data as any;
  
  return (
    <div
      className={`
        relative w-full p-3 rounded-lg border border-border/30 bg-flow-node/80
        transition-all duration-200 hover:shadow-md
        opacity-90
      `}
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
});

export const GroupNode = memo(({ data, id, selected }: GroupNodeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const groupData = data as unknown as GroupNodeData;
  const [isEditing, setIsEditing] = useState(groupData.isEditing || false);
  const [title, setTitle] = useState(groupData.title || 'Group #1');

  console.log('Node Group:', JSON.stringify(groupData, null, 2));

  // Usar childNodes dos dados
  const childNodes = groupData.childNodes || [];

  // Monitorar mudanças nos childNodes
  useEffect(() => {
  }, [childNodes, id]);

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
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
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
            y: e.clientY
          }
        }
      });
      window.dispatchEvent(customEvent);
    }
  };

  return (
    <div
      className={`
        relative min-w-[280px] min-h-[120px] p-4 rounded-xl border-2 bg-flow-group 
        transition-all duration-200 hover:shadow-lg
        ${selected ? 'border-primary shadow-lg shadow-primary/20' : 'border-border/30 hover:border-border/50'}
        ${isHovered ? 'shadow-md' : ''}
        ${isDragOver ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' : ''}
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
      <div className={`flex flex-col gap-2 ${childNodes.length > 0 ? 'min-h-[60px]' : 'min-h-[60px]'}`}>
        {isDragOver ? (
          <div className="flex items-center justify-center text-muted-foreground text-sm py-4">
            <div className="text-center">
              <Plus className="w-6 h-6 mx-auto mb-2 text-primary" />
              <span className="text-primary font-medium">Solte aqui para adicionar</span>
            </div>
          </div>
        ) : childNodes && childNodes.length > 0 ? (
          <div className="space-y-2">
            {childNodes.map((childNode, index) => (
              <GroupChildNode key={childNode.id} node={childNode} index={index} />
            ))}
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
        style={{ top: '-1px', width: 7  }}
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