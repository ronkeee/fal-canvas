import { type NodeProps } from '@xyflow/react';
import { StickyNote } from 'lucide-react';
import { useFlowStore } from '../../store/flow-store';
import { NodeFloatingToolbar } from '../../components/NodeToolbar';

export function NoteNode({ id, data, selected }: NodeProps) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);

  return (
    <div className="relative" style={{ minWidth: 200, maxWidth: 300 }}>
      {/* Floating toolbar when selected */}
      {selected && <NodeFloatingToolbar nodeId={id} />}

      <div
        className="overflow-hidden transition-all duration-150"
        style={{
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#2a2a1a',
          border: selected ? '1.5px solid #f59e0b' : '1px solid #3a3a2a',
          boxShadow: selected ? '0 0 0 1px rgba(245,158,11,0.2), var(--shadow-lg)' : 'var(--shadow-md)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2"
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid #3a3a2a',
            background: 'rgba(245, 158, 11, 0.04)',
          }}
        >
          <StickyNote size={14} style={{ color: '#f59e0b', opacity: 0.85 }} />
          <span style={{ font: 'var(--font-label-small)', color: 'var(--color-text-primary)' }}>
            Note
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: 12 }}>
          <textarea
            value={(data.text as string) || ''}
            onChange={(e) => updateNodeData(id, { text: e.target.value })}
            placeholder="Add a note..."
            className="w-full resize-none focus:outline-none nodrag nowheel"
            style={{
              font: 'var(--font-body-small)',
              backgroundColor: 'transparent',
              color: '#e0e0c0',
              border: 'none',
              minHeight: 60,
              padding: '4px 2px',
            }}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
