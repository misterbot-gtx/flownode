import { useCallback } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
} from '@xyflow/react';
import { X } from 'lucide-react';

interface CustomEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: any;
  targetPosition: any;
  style?: React.CSSProperties;
  markerEnd?: string;
  data?: {
    showDelete?: boolean;
  };
  isInteracting?: boolean;
  selected?: boolean;
}

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected = false,
}: CustomEdgeProps) {
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onDelete = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      setEdges((edges) => edges.filter((edge) => edge.id !== id));
    },
    [id, setEdges]
  );

  const edgeStyle = selected
    ? { ...style, stroke: '#750e0e', strokeWidth: 3 }
    : style;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      {data?.showDelete && selected && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-auto"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            <button
              onClick={onDelete}
              className="w-4 h-4 bg-red-600/90 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-700 hover:scale-110 transition-transform duration-200 border border-white/20"
              title="Excluir conexão"
            >
              <X size={14} />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
