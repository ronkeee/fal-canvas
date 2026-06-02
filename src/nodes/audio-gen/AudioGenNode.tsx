import { type NodeProps } from '@xyflow/react';
import { Music, Download } from 'lucide-react';
import { BaseNode } from '../base/BaseNode';
import { useFlowStore } from '../../store/flow-store';
import { useExecutionStore } from '../../store/execution-store';
import type { PortDef } from '../../engine/types';

const inputs: PortDef[] = [
  { id: 'prompt', label: 'Prompt', type: 'text', required: true },
];

const outputs: PortDef[] = [
  { id: 'audio', label: 'Audio', type: 'audio', required: false },
];

export function AudioGenNode({ id, data, selected }: NodeProps) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const nodeState = useExecutionStore((s) => s.nodeStates[id]);
  const audioUrl = (nodeState?.result as Record<string, unknown>)?.audio as string | undefined;

  return (
    <BaseNode
      id={id}
      label="Audio Generation"
      category="ai"
      icon={<Music size={14} />}
      inputs={inputs}
      outputs={outputs}
      selected={selected}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <label style={{ marginBottom: 4, display: 'block', font: 'var(--font-tip)', color: 'var(--color-text-secondary)' }}>
            Model
          </label>
          <select
            value={(data.modelId as string) || 'fal-ai/stable-audio'}
            onChange={(e) => updateNodeData(id, { modelId: e.target.value })}
            className="w-full rounded px-2 py-1.5 nodrag"
            style={{
              font: 'var(--font-body-small)',
              backgroundColor: 'var(--color-surface-hover)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <option value="fal-ai/stable-audio">Stable Audio</option>
          </select>
        </div>

        <div>
          <label style={{ marginBottom: 4, display: 'block', font: 'var(--font-tip)', color: 'var(--color-text-secondary)' }}>
            Duration (sec)
          </label>
          <input
            type="number"
            value={(data.duration as number) || 10}
            onChange={(e) => updateNodeData(id, { duration: Number(e.target.value) })}
            min={1}
            max={60}
            className="w-full rounded px-2 py-1.5 nodrag"
            style={{
              font: 'var(--font-body-small)',
              backgroundColor: 'var(--color-surface-hover)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          />
        </div>

        {audioUrl && (
          <div className="flex items-center gap-2 mt-2">
            <audio src={audioUrl} controls className="flex-1" style={{ height: 32 }} />
            <button
              onClick={() => window.open(audioUrl, '_blank')}
              className="flex items-center justify-center nodrag shrink-0"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(26, 26, 28, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--color-secondary-c200)',
              }}
              title="Download audio"
            >
              <Download size={14} />
            </button>
          </div>
        )}

        {nodeState?.status === 'running' && (
          <div className="flex items-center gap-2" style={{ font: 'var(--font-helper)', color: 'var(--color-text-secondary)' }}>
            <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            Generating audio...
          </div>
        )}
      </div>
    </BaseNode>
  );
}
