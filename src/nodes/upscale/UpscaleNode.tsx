import { type NodeProps } from '@xyflow/react';
import { ArrowUpCircle } from 'lucide-react';
import { BaseNode } from '../base/BaseNode';
import { useFlowStore } from '../../store/flow-store';
import { useExecutionStore } from '../../store/execution-store';
import { MODELS, getModelById } from '../../fal/model-registry';
import { ModelParamControls } from '../../components/ModelParamControls';
import type { PortDef } from '../../engine/types';

const inputs: PortDef[] = [
  { id: 'image', label: 'Image', type: 'image', required: true },
];

const outputs: PortDef[] = [
  { id: 'image', label: 'Image', type: 'image', required: false },
];

const upscaleModels = MODELS.filter((m) => m.category === 'upscale');

export function UpscaleNode({ id, data, selected }: NodeProps) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const nodeState = useExecutionStore((s) => s.nodeStates[id]);
  const imageUrl = (nodeState?.result as Record<string, unknown>)?.image as string | undefined;

  const modelId = (data.modelId as string) || 'fal-ai/topaz/upscale/image';
  const currentModel = getModelById(modelId);

  return (
    <BaseNode
      id={id}
      label="Upscale"
      category="ai"
      icon={<ArrowUpCircle size={14} />}
      inputs={inputs}
      outputs={outputs}
      selected={selected}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Model selector (only if multiple upscale models) */}
        {upscaleModels.length > 1 && (
          <div>
            <label style={{ marginBottom: 4, display: 'block', font: 'var(--font-tip)', color: 'var(--color-text-secondary)' }}>
              Model
            </label>
            <select
              value={modelId}
              onChange={(e) => updateNodeData(id, { modelId: e.target.value })}
              className="w-full rounded nodrag"
            >
              {upscaleModels.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Dynamic model params */}
        {currentModel?.params && (
          <ModelParamControls
            params={currentModel.params}
            values={data as Record<string, unknown>}
            onChange={(key, value) => updateNodeData(id, { [key]: value })}
          />
        )}

        {imageUrl && (
          <div className="mt-2 rounded overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
            <img src={imageUrl} alt="Upscaled" className="w-full h-auto" />
          </div>
        )}

        {nodeState?.status === 'running' && (
          <div className="flex items-center gap-2" style={{ font: 'var(--font-helper)', color: 'var(--color-text-secondary)' }}>
            <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-secondary-c300)', borderTopColor: 'transparent' }} />
            Upscaling…
          </div>
        )}
      </div>
    </BaseNode>
  );
}
