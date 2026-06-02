import { type NodeProps } from '@xyflow/react';
import { Scissors, Download } from 'lucide-react';
import { BaseNode } from '../base/BaseNode';
import { useExecutionStore } from '../../store/execution-store';
import type { PortDef } from '../../engine/types';

const inputs: PortDef[] = [
  { id: 'image', label: 'Image', type: 'image', required: true },
];

const outputs: PortDef[] = [
  { id: 'image', label: 'Image', type: 'image', required: false },
];

async function downloadImage(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, '_blank');
  }
}

export function BgRemoveNode({ id, selected }: NodeProps) {
  const nodeState = useExecutionStore((s) => s.nodeStates[id]);
  const imageUrl = (nodeState?.result as Record<string, unknown>)?.image as string | undefined;

  return (
    <BaseNode
      id={id}
      label="Background Removal"
      category="ai"
      icon={<Scissors size={14} />}
      inputs={inputs}
      outputs={outputs}
      selected={selected}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Info label */}
        <div style={{ font: 'var(--font-helper)', color: 'var(--color-text-secondary)' }}>
          Removes background — outputs transparent PNG
        </div>

        {/* Result preview */}
        {imageUrl && (
          <div
            className="mt-1 rounded overflow-hidden border relative group"
            style={{
              borderColor: 'var(--color-border)',
              // Checkerboard pattern to visualize transparency
              backgroundImage: 'linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)',
              backgroundSize: '12px 12px',
              backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
            }}
          >
            <img src={imageUrl} alt="Background removed" className="w-full h-auto" />
            <button
              onClick={() => downloadImage(imageUrl, `bg-removed-${Date.now()}.png`)}
              className="absolute bottom-2 right-2 flex items-center justify-center nodrag opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(26, 26, 28, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--color-secondary-c200)',
              }}
              title="Download PNG"
            >
              <Download size={14} />
            </button>
          </div>
        )}

        {/* Loading state */}
        {nodeState?.status === 'running' && (
          <div className="flex items-center gap-2" style={{ font: 'var(--font-helper)', color: 'var(--color-text-secondary)' }}>
            <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-secondary-c300)', borderTopColor: 'transparent' }} />
            Removing background…
          </div>
        )}
      </div>
    </BaseNode>
  );
}
