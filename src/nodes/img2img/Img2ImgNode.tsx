import { type NodeProps } from '@xyflow/react';
import { Paintbrush } from 'lucide-react';
import { BaseNode } from '../base/BaseNode';
import { useFlowStore } from '../../store/flow-store';
import { useExecutionStore } from '../../store/execution-store';
import type { PortDef } from '../../engine/types';

const inputs: PortDef[] = [
  { id: 'image', label: 'Image', type: 'image', required: true },
  { id: 'prompt', label: 'Prompt', type: 'text', required: true },
];

const outputs: PortDef[] = [
  { id: 'image', label: 'Image', type: 'image', required: false },
];

const MODELS = [
  { id: 'fal-ai/flux/dev/image-to-image', name: 'Flux Dev (img2img)' },
  { id: 'fal-ai/flux-pro/v1.1', name: 'Flux Pro 1.1' },
];

export function Img2ImgNode({ id, data, selected }: NodeProps) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const nodeState = useExecutionStore((s) => s.nodeStates[id]);
  const imageUrl = (nodeState?.result as Record<string, unknown>)?.image as string | undefined;

  return (
    <BaseNode
      id={id}
      label="Image to Image"
      category="ai"
      icon={<Paintbrush size={14} />}
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
            value={(data.modelId as string) || MODELS[0].id}
            onChange={(e) => updateNodeData(id, { modelId: e.target.value })}
            className="w-full rounded px-2 py-1.5 nodrag"
            style={{
              font: 'var(--font-body-small)',
              backgroundColor: 'var(--color-surface-hover)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ marginBottom: 4, display: 'block', font: 'var(--font-tip)', color: 'var(--color-text-secondary)' }}>
            Strength
          </label>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={(data.strength as number) || 0.75}
            onChange={(e) => updateNodeData(id, { strength: Number(e.target.value) })}
            className="w-full nodrag"
          />
          <span style={{ font: 'var(--font-helper)', color: 'var(--color-text-secondary)' }}>
            {((data.strength as number) || 0.75).toFixed(2)}
          </span>
        </div>

        {imageUrl && (
          <div className="mt-2 rounded overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
            <img src={imageUrl} alt="Generated" className="w-full h-auto" />
          </div>
        )}

        {nodeState?.status === 'running' && (
          <div className="flex items-center gap-2" style={{ font: 'var(--font-helper)', color: 'var(--color-text-secondary)' }}>
            <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            Transforming...
          </div>
        )}
      </div>
    </BaseNode>
  );
}
