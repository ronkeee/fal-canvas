import { type NodeProps } from '@xyflow/react';
import { Music, Download } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { BaseNode } from '../base/BaseNode';
import { useFlowStore } from '../../store/flow-store';
import { useExecutionStore } from '../../store/execution-store';
import { MODELS, getModelById } from '../../fal/model-registry';
import { ModelParamControls } from '../../components/ModelParamControls';
import type { PortDef } from '../../engine/types';

const inputs: PortDef[] = [
  { id: 'prompt', label: 'Prompt', type: 'text', required: true },
  { id: 'reference', label: 'Reference Voice', type: 'audio', required: false },
];

const outputs: PortDef[] = [
  { id: 'audio', label: 'Audio', type: 'audio', required: false },
];

const audioModels = MODELS.filter((m) => m.category === 'audio');

export function AudioGenNode({ id, data, selected }: NodeProps) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const edges = useFlowStore((s) => s.edges);
  const nodeState = useExecutionStore((s) => s.nodeStates[id]);
  const audioUrl = (nodeState?.result as Record<string, unknown>)?.audio as string | undefined;

  const modelId = (data.modelId as string) || 'fal-ai/stable-audio';
  const currentModel = getModelById(modelId);

  const hasReferenceConnected = edges.some((e) => e.target === id && e.targetHandle === 'reference');

  // Auto-switch only on the moment reference is connected/disconnected — never override manual selection
  const prevReferenceConnected = useRef(hasReferenceConnected);
  useEffect(() => {
    const justConnected = hasReferenceConnected && !prevReferenceConnected.current;
    const justDisconnected = !hasReferenceConnected && prevReferenceConnected.current;
    if (justConnected && !currentModel?.supportsAudioInput) {
      updateNodeData(id, { modelId: 'fal-ai/f5-tts' });
    }
    if (justDisconnected && currentModel?.supportsAudioInput) {
      updateNodeData(id, { modelId: 'fal-ai/stable-audio' });
    }
    prevReferenceConnected.current = hasReferenceConnected;
  }, [hasReferenceConnected, currentModel, id, updateNodeData]);

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <label style={{ marginBottom: 4, display: 'block', font: 'var(--font-tip)', color: 'var(--color-text-secondary)' }}>
            Model
          </label>
          <select
            value={modelId}
            onChange={(e) => updateNodeData(id, { modelId: e.target.value })}
            className="w-full rounded nodrag"
          >
            {audioModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}{m.supportsAudioInput ? ' (voice clone)' : ''}
              </option>
            ))}
          </select>
          {hasReferenceConnected && (
            <div style={{ font: 'var(--font-tiny-label)', color: '#30d158', marginTop: 4 }}>
              Reference Voice connected → {currentModel?.name || 'F5-TTS'} will clone the voice
            </div>
          )}
        </div>

        {/* Dynamic model params */}
        {currentModel?.params && (
          <ModelParamControls
            params={currentModel.params}
            values={data as Record<string, unknown>}
            onChange={(key, value) => updateNodeData(id, { [key]: value })}
          />
        )}

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
            Generating audio…
          </div>
        )}
      </div>
    </BaseNode>
  );
}
