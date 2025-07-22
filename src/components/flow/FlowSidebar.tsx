import { useState } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ELEMENT_CATEGORIES } from '@/data/flowElements';
import { FlowElement } from '@/types/flow';

interface DraggableElementProps {
  element: FlowElement;
}

// Estilo melhorado para o drag preview
const draggingStyle = `
  .dragging-element {
    box-shadow: 0 0 24px 6px #ea580c99, 0 4px 16px #000a;
    background: #18181b !important;
    opacity: 0.5;
    z-index: 1000;
  }

  .dragging-previews {
    width: 18rem;
    border: 3px solid #ea580c;
    background: rgba(24, 24, 27, 0.7);
    opacity: 0.8; /* Slight transparency like Typebot */
    border-radius: 8px;
    filter: none;
    transition: box-shadow 0.2s, border 0.2s, transform 0.2s;
    pointer-events: none;
    padding: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

if (typeof document !== 'undefined') {
  const existing = document.getElementById('dragging-style');
  if (existing) existing.remove();
  const style = document.createElement('style');
  style.id = 'dragging-style';
  style.innerHTML = draggingStyle;
  document.head.appendChild(style);
}

function DraggableElement({ element }: DraggableElementProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (event: React.DragEvent) => {
    setIsDragging(true);
    event.dataTransfer.setData('application/reactflow', JSON.stringify(element));
    event.dataTransfer.effectAllowed = 'move';

    // Create a drag preview that matches the Typebot style
    const dragPreview = document.createElement('div');
    dragPreview.className = 'dragging-previews';
    dragPreview.innerHTML = `
      <span className="text-lg">${element.icon}</span>
      <span className="text-sm font-medium text-white">${element.label}</span>
    `;
    dragPreview.style.position = 'absolute';
    dragPreview.style.top = '-9999px';
    dragPreview.style.left = '-9999px';
    document.body.appendChild(dragPreview);

    // Set the drag image to the custom preview
    event.dataTransfer.setDragImage(dragPreview, dragPreview.offsetWidth / 2, dragPreview.offsetHeight / 2);

    // Clean up the preview
    setTimeout(() => {
      if (dragPreview.parentNode) dragPreview.parentNode.removeChild(dragPreview);
    }, 0);
  };

  const handleDragEnd = (event: React.DragEvent) => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`flex items-center gap-3 p-3 rounded-lg bg-flow-sidebar-item hover:bg-flow-sidebar-item-hover border border-border/20 cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-[1.02] group ${isDragging ? 'dragging-element' : ''}`}
    >
      <span className="text-lg">{element.icon}</span>
      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
        {element.label}
      </span>
    </div>
  );
}

interface CategorySectionProps {
  category: keyof typeof ELEMENT_CATEGORIES;
  searchTerm: string;
}

function CategorySection({ category, searchTerm }: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const categoryData = ELEMENT_CATEGORIES[category];

  const filteredElements = categoryData.elements.filter(element =>
    element.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredElements.length === 0 && searchTerm) {
    return null;
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-2 text-left hover:bg-flow-sidebar-item rounded-lg transition-colors group"
      >
        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {categoryData.label}
        </h3>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-2 pl-2">
          {filteredElements.map((element) => (
            <DraggableElement key={element.id} element={element} />
          ))}
        </div>
      )}
    </div>
  );
}

interface FlowSidebarProps {
  className?: string;
}

export function FlowSidebar({ className }: FlowSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Impede drop dentro do sidebar
  const handleSidebarDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className={`w-80 bg-flow-sidebar border-r border-border/20 flex flex-col ${className}`}
      onDrop={handleSidebarDrop}
      onDragOver={handleSidebarDrop}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/20">
        <h2 className="text-lg font-bold text-foreground mb-4">Elementos</h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar elementos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-flow-sidebar-item border-border/30 focus:border-primary"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="scroll flex-1 overflow-y-auto p-4 space-y-6">
        {Object.keys(ELEMENT_CATEGORIES).map((category) => (
          <CategorySection
            key={category}
            category={category as keyof typeof ELEMENT_CATEGORIES}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    </div>
  );
}