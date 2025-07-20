import { useState } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ELEMENT_CATEGORIES } from '@/data/flowElements';
import { FlowElement } from '@/types/flow';

interface DraggableElementProps {
  element: FlowElement;
}

function DraggableElement({ element }: DraggableElementProps) {
  const handleDragStart = (event: React.DragEvent) => {
    console.log('Drag start for element:', element);
    event.dataTransfer.setData('application/reactflow', JSON.stringify(element));
    event.dataTransfer.effectAllowed = 'move';
    console.log('Drag data set successfully');
    
    // Adicionar efeito visual
    (event.currentTarget as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (event: React.DragEvent) => {
    // Remover efeito visual
    (event.currentTarget as HTMLElement).style.opacity = '1';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="flex items-center gap-3 p-3 rounded-lg bg-flow-sidebar-item hover:bg-flow-sidebar-item-hover border border-border/20 cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-[1.02] group"
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

  return (
    <div className={`w-80 bg-flow-sidebar border-r border-border/20 flex flex-col ${className}`}>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
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