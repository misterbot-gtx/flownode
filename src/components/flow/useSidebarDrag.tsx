import { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ELEMENT_CATEGORIES } from '@/data/flowElements';
import { FlowElement } from '@/types/flow';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Estilo melhorado para o drag preview
const draggingStyle = `
  .dragging-element {
    background: #18181b !important;
    opacity: 0.5;
    z-index: 1000;
    transform: rotate(0deg);
    transition: transform 0.2s ease, box-shadow 0.2s, border 0.2s;
  }
  .dragging-previews {
    width: 18rem;
    border: 3px solid #ea580c;
    background: rgb(24 24 27);
    opacity: 1;
    border-radius: 8px;
    filter: none;
    transform: rotate(0deg);
    transition: box-shadow 0.2s, border 0.2s, transform 0.3s cubic-bezier(0.4,0,0.2,1);
    pointer-events: none;
    user-select: none;
    padding: 7.5px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  .dragging-previews.tilt {
    transform: rotate(-6deg);
  }
  .react-flow__node-dragging {
    opacity: 0 !important;
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

interface DraggableElementProps {
  element: FlowElement;
  draggingElementId: string | null;
  setDraggingElementId: (id: string | null) => void;
}

export function DraggableElement({ element, draggingElementId, setDraggingElementId }: DraggableElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { attributes, listeners, setNodeRef } = useDraggable({ id: element.id, data: { element } });

  // Se este elemento está sendo arrastado, renderiza vazio
  if (draggingElementId === element.id) {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-lg bg-flow-sidebar-item border border-border/20 transition-all duration-200 dragging-element"
        style={{ minHeight: 53 }}
      ></div>
    );
  }

  const originalStyle = {
    opacity: isDragging ? 0 : 1,
    transform: isDragging ? 'scale(0.95)' : 'scale(1)',
    transition: 'opacity 0.2s, transform 0.2s',
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={originalStyle}
      className={`flex items-center gap-3 p-3 rounded-lg bg-flow-sidebar-item hover:bg-flow-sidebar-item-hover border border-border/20 cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-[1.02] group ${
        isDragging ? 'dragging-element' : ''
      }`}
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
  draggingElementId: string | null;
  setDraggingElementId: (id: string | null) => void;
}

export function CategorySection({ category, searchTerm, draggingElementId, setDraggingElementId }: CategorySectionProps) {
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
            <DraggableElement
              key={element.id}
              element={element}
              draggingElementId={draggingElementId}
              setDraggingElementId={setDraggingElementId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function useSidebarDrag() {
  const [searchTerm, setSearchTerm] = useState('');
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);

  // Impede drop dentro do sidebar
  const handleSidebarDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return {
    searchTerm,
    setSearchTerm,
    draggingElementId,
    setDraggingElementId,
    handleSidebarDrop,
  };
}

// Sincroniza estado de placeholder com eventos globais do DndContext
if (typeof window !== 'undefined') {
  window.addEventListener('sidebarDragStart', (e: any) => {
    const id = e?.detail?.id;
    if (id) {
      const evt = new CustomEvent('sidebarUpdateDraggingId', { detail: { id } });
      window.dispatchEvent(evt);
    }
  });
  window.addEventListener('sidebarDragEnd', () => {
    const evt = new CustomEvent('sidebarUpdateDraggingId', { detail: { id: null } });
    window.dispatchEvent(evt);
  });
}

// Hook para escutar e refletir o id em arrasto no placeholder
export function useSidebarDraggingIdSync(setDraggingElementId: (id: string | null) => void) {
  useEffect(() => {
    const handler = (e: any) => {
      setDraggingElementId(e?.detail?.id ?? null);
    };
    window.addEventListener('sidebarUpdateDraggingId', handler as any);
    return () => {
      window.removeEventListener('sidebarUpdateDraggingId', handler as any);
    };
  }, [setDraggingElementId]);
}