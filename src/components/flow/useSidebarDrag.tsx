import { useState, useRef } from 'react';
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
  const dragElementRef = useRef<HTMLDivElement | null>(null);
  const dragDivRef = useRef<HTMLDivElement>(null);
  const globalListenerRef = useRef<{ drop: any; dragend: any } | null>(null);

  // Cria o preview customizado e move junto ao mouse (usando dragover)
  const createCustomPreview = (startEvent: DragEvent) => {
    setIsDragging(true);
    document.body.style.userSelect = 'none';
    const dragEl = document.createElement('div');
    dragEl.className = 'dragging-previews';
    dragEl.style.position = 'fixed';
    dragEl.style.pointerEvents = 'none';
    dragEl.style.zIndex = '9999';
    dragEl.style.left = '-9999px';
    dragEl.style.top = '-9999px';
    dragEl.innerHTML = `
      <span style="font-size: 1.5rem;">${element.icon}</span>
      <span style="font-size: 1rem; color: white; margin-left: 8px;">${element.label}</span>
    `;
    document.body.appendChild(dragEl);
    dragElementRef.current = dragEl;
    // Centraliza no início
    const updatePosition = (clientX: number, clientY: number) => {
      if (dragElementRef.current) {
        const rect = dragElementRef.current.getBoundingClientRect();
        dragElementRef.current.style.left = `${clientX - rect.width / 2}px`;
        dragElementRef.current.style.top = `${clientY - rect.height / 2}px`;
      }
    };
    // Centraliza já no início
    updatePosition(startEvent.clientX, startEvent.clientY);
    // Anima a rotação
    setTimeout(() => {
      if (dragElementRef.current) {
        dragElementRef.current.style.transform = 'rotate(-6deg)';
      }
    }, 10);
    // Listener de dragover para seguir o mouse
    const dragOverHandler = (ev: DragEvent) => {
      if (typeof ev.clientX === 'number' && typeof ev.clientY === 'number') {
        updatePosition(ev.clientX, ev.clientY);
      }
    };
    window.addEventListener('dragover', dragOverHandler);
    document.body.addEventListener('dragover', dragOverHandler);
    document.addEventListener('dragover', dragOverHandler);
    // Fallback: mousemove para áreas que não disparam dragover
    const mouseMoveHandler = (ev: MouseEvent) => {
      if (typeof ev.clientX === 'number' && typeof ev.clientY === 'number') {
        updatePosition(ev.clientX, ev.clientY);
      }
    };
    window.addEventListener('mousemove', mouseMoveHandler);
    (dragElementRef.current as any)._dragOverHandler = dragOverHandler;
    (dragElementRef.current as any)._mouseMoveHandler = mouseMoveHandler;
    // Adiciona listeners globais para garantir remoção do preview
    const handleGlobalDropOrEnd = () => {
      removeCustomPreview();
      setDraggingElementId(null);
    };
    window.addEventListener('drop', handleGlobalDropOrEnd);
    window.addEventListener('dragend', handleGlobalDropOrEnd);
    globalListenerRef.current = {
      drop: handleGlobalDropOrEnd,
      dragend: handleGlobalDropOrEnd,
    };
  };

  // Remove o preview customizado
  const removeCustomPreview = () => {
    setIsDragging(false);
    if (dragElementRef.current) {
      // Remove listener
      const dragOverHandler = (dragElementRef.current as any)._dragOverHandler;
      if (dragOverHandler) {
        window.removeEventListener('dragover', dragOverHandler);
        document.body.removeEventListener('dragover', dragOverHandler);
        document.removeEventListener('dragover', dragOverHandler);
      }
      // Remove mousemove fallback
      const mouseMoveHandler = (dragElementRef.current as any)._mouseMoveHandler;
      if (mouseMoveHandler) {
        window.removeEventListener('mousemove', mouseMoveHandler);
      }
      document.body.removeChild(dragElementRef.current);
      dragElementRef.current = null;
    }
    document.body.style.userSelect = '';
    // Remove listeners globais
    if (globalListenerRef.current) {
      window.removeEventListener('drop', globalListenerRef.current.drop);
      window.removeEventListener('dragend', globalListenerRef.current.dragend);
      globalListenerRef.current = null;
    }
  };

  // Seta o dataTransfer no dragstart e cria o preview customizado
  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(element));
    event.dataTransfer.effectAllowed = 'move';
    const invisibleImg = document.createElement('div');
    invisibleImg.style.width = '1px';
    invisibleImg.style.height = '1px';
    invisibleImg.style.opacity = '0';
    document.body.appendChild(invisibleImg);
    event.dataTransfer.setDragImage(invisibleImg, 0, 0);
    setTimeout(() => document.body.removeChild(invisibleImg), 0);
    createCustomPreview(event.nativeEvent);
    setDraggingElementId(element.id);
  };

  // Remove preview no dragend
  const handleDragEnd = (event: React.DragEvent) => {
    removeCustomPreview();
    setDraggingElementId(null);
  };

  // Se este elemento está sendo arrastado, renderiza vazio
  if (draggingElementId === element.id) {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-lg bg-flow-sidebar-item border border-border/20 transition-all duration-200 dragging-element"
        style={{ minHeight: 53 }}
      ></div>
    );
  }

  return (
    <div
      draggable
      ref={dragDivRef}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`flex items-center gap-3 p-3 rounded-lg bg-flow-sidebar-item hover:bg-flow-sidebar-item-hover border border-border/20 cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-[1.02] group`}
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