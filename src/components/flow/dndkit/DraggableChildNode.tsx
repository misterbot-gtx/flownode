import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Node } from '@flow/react';

interface DraggableChildNodeProps {
  node: Node;
  index: number;
  isDragOver?: boolean;
  hidden?: boolean;
  onDragStart?: (node: Node) => void;
  onDragEnd?: () => void;
}

export const DraggableChildNode = memo(
  ({ node, index, isDragOver, hidden, onDragStart, onDragEnd }: DraggableChildNodeProps) => {
    const nodeData = node.data as any;

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: node.id,
      data: { node, index, type: 'group-child' },
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0 : undefined,
    };

    return (
      <Box
        ref={setNodeRef}
        style={style}
        position="relative"
        w="full"
        p="3"
        borderRadius="lg"
        borderWidth="1px"
        borderColor={isDragOver ? 'hsl(var(--primary))' : 'hsl(var(--border) / 0.3)'}
        bg={isDragOver ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--flow-node) / 0.8)'}
        transition="all 0.2s"
        boxShadow={isDragOver ? 'lg' : 'none'}
        opacity={0.9}
        className={`nodrag ${hidden ? 'dragging-hidden' : ''}`}
        {...attributes}
        {...listeners}
        onMouseDown={(e) => {
          if (onDragStart) onDragStart(node);
        }}
        onMouseUp={() => {
          if (onDragEnd) onDragEnd();
        }}
      >
        <Flex align="center" gap="2" mb="2">
          <Text fontSize="sm">{nodeData.element?.icon}</Text>
          <Text fontSize="xs" fontWeight="medium" color="hsl(var(--foreground))">
            {nodeData.label}
          </Text>
          <Box as="span" fontSize="xs" color="hsl(var(--muted-foreground))" bg="hsl(var(--muted))" px="1" py="0.5" borderRadius="sm">
            Grupo
          </Box>
        </Flex>
        <Text fontSize="xs" color="hsl(var(--muted-foreground))">
          {nodeData.content || 'Clique para editar...'}
        </Text>
      </Box>
    );
  }
);