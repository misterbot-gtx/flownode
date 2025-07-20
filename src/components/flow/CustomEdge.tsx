import { EdgeProps } from '@xyflow/react';

function getEdgePath(sourceX: number, sourceY: number, targetX: number, targetY: number) {
  // Curva suave (bezier) horizontal
  const curvature = 0.3;
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const cpx1 = sourceX + dx * curvature;
  const cpy1 = sourceY;
  const cpx2 = targetX - dx * curvature;
  const cpy2 = targetY;
  return `M ${sourceX},${sourceY} C ${cpx1},${cpy1} ${cpx2},${cpy2} ${targetX},${targetY}`;
}

export function CustomEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd, style }: EdgeProps) {
  const edgePath = getEdgePath(sourceX, sourceY, targetX, targetY);
  const edgeStyle = {
    stroke: '#ffffff',
    strokeWidth: 0.5,
    strokeDasharray: '7 5',
    animation: 'dashdraw 1s linear infinite',
    ...style,
  };
  return (
    <g>
      <path
        id={id}
        style={edgeStyle}
        className="react-flow__edge-path robot-line"
        d={edgePath}
        markerEnd={markerEnd}
        fill="none"
      />
    </g>
  );
}