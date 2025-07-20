import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

const AudioNode = memo(({ data, id, selected }: NodeProps) => (
  <div style={{ minWidth: 180, minHeight: 80, padding: 16, borderRadius: 12, background: '#23272f', border: selected ? '2px solid #3b82f6' : '2px solid #333' }}>
    <Handle type="target" position={Position.Top} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold', fontSize: 18 }}>
      <span>{(data.element && (data.element as any).icon) || '🎵'}</span>
      <span>{(data.element && (data.element as any).label) || 'Áudio'}</span>
    </div>
    <div style={{ marginTop: 8, color: '#aaa' }}>{(data.element && (data.element as any).description) || 'Reproduz um áudio'}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
));

export default AudioNode; 