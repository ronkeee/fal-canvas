import { type NodeProps } from '@xyflow/react';
import { ImageIcon, Download } from 'lucide-react';
import { BaseNode } from '../base/BaseNode';
import { useFlowStore } from '../../store/flow-store';
import { useExecutionStore } from '../../store/execution-store';
import { MODELS, getModelById } from '../../fal/model-registry';
import { ModelParamControls } from '../../components/ModelParamControls';
import type { PortDef } from '../../engine/types';

const inputs: PortDef[] = [
  { id: 'prompt', label: 'Prompt', type: 'text', required: true },
  { id: 'image', label: 'Image', type: 'image', required: false },
];

const outputs: PortDef[] = [
  { id: 'image', label: 'Image', type: 'image', required: false },
];

const imageModels = MODELS.filter((m) => m.category === 'image');

async function downloadAsset(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    // Fallback: open in new tab
    window.open(url, '_blank');
  }
}

export function ImageGenNode({ id, data, selected }: NodeProps) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const nodeState = useExecutionStore((s) => s.nodeStates[id]);
  const imageUrl = (nodeState?.result as Record<string, unknown>)?.image as string | undefined;

  const modelId = (data.modelId as string) || 'fal-ai/nano-banana-2';
  const currentModel = getModelById(modelId);

  return (
    <BaseNode
      id={id}
      label="Image Generation"
      category="ai"
      icon={<ImageIcon size={14} />}
      inputs={inputs}
      outputs={outputs}
      selected={selected}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Model selector */}
        <div>
          <label style={{ marginBottom: 4, display: 'block', font: 'var(--font-tip)', color: 'var(--color-text-secondary)' }}>
            Model
          </label>
          <select
            value={modelId}
            onChange={(e) => {
              const newModelId = e.target.value;
              const oldModel = getModelById(modelId);
              const newModel = getModelById(newModelId);

              // Clear old model's param keys to prevent stale params leaking
              const update: Record<string, unknown> = { modelId: newModelId };
              if (oldModel?.params) {
                for (const p of oldModel.params) update[p.key] = undefined;
              }
              // Also clear common size/ratio keys that vary between models
              update.imageSize = undefined;
              update.image_size = undefined;
              update.aspect_ratio = undefined;
              update.size = undefined;

              // Apply new model's defaults
              if (newModel?.defaultParams) {
                Object.assign(update, newModel.defaultParams);
              }
              updateNodeData(id, update);
            }}
            className="w-full rounded nodrag nopan nowheel"
          >
            {imageModels.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Dynamic model params */}
        {currentModel?.params && (
          <ModelParamControls
            params={currentModel.params}
            values={data as Record<string, unknown>}
            onChange={(key, value) => updateNodeData(id, { [key]: value })}
          />
        )}

        {/* Preview + Download */}
        {imageUrl && (
          <div className="mt-3 rounded overflow-hidden border relative group" style={{ borderColor: 'var(--color-border)' }}>
            <img src={imageUrl} alt="Generated" className="w-full h-auto" />
            <button
              onClick={() => downloadAsset(imageUrl, `riverflow-${Date.now()}.png`)}
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
              title="Download image"
            >
              <Download size={14} />
            </button>
          </div>
        )}

        {/* Loading state */}
        {nodeState?.status === 'running' && (
          <div className="flex items-center gap-2" style={{ font: 'var(--font-helper)', color: 'var(--color-text-secondary)' }}>
            <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            Generating…
          </div>
        )}
        {nodeState?.status === 'queued' && (
          <div style={{ font: 'var(--font-helper)', color: 'var(--color-text-secondary)' }}>
            In queue…
          </div>
        )}
      </div>
    </BaseNode>
  );
}
