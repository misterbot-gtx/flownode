import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ELEMENT_CATEGORIES } from '@/data/flowElements';
import { CategorySection, useSidebarDrag } from './useSidebarDrag';

interface FlowSidebarProps {
  className?: string;
}

export function FlowSidebar({ className }: FlowSidebarProps) {
  const { searchTerm, setSearchTerm, draggingElementId, setDraggingElementId, handleSidebarDrop } = useSidebarDrag();

  return (
    <div
      className={`w-80 bg-flow-sidebar select-none border-r border-border/20 flex flex-col ${className}`}
      onDrop={handleSidebarDrop}
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
            draggingElementId={draggingElementId}
            setDraggingElementId={setDraggingElementId}
          />
        ))}
      </div>
    </div>
  );
}
