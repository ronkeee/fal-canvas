import { type NodeProps } from '@xyflow/react';
import { Video, Download, Music } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { BaseNode } from '../base/BaseNode';
import { useFlowStore } from '../../store/flow-store';
import { useExecutionStore } from '../../store/execution-store';
import { MODELS, getModelById } from '../../fal/model-registry';
import { ModelParamControls } from '../../components/ModelParamControls';
import type { PortDef } from '../../engine/types';

const inputs: PortDef[] = [
  { id: 'prompt', label: 'Prompt', type: 'text', required: true },
  { id: 'image', label: 'Image', type: 'image', required: false },
  { id: 'video', label: 'Video', type: 'video', required: false },
  { id: 'audio', label: 'Audio', type: 'audio', required: false },
];

const outputs: PortDef[] = [
  { id: 'video', label: 'Video', type: 'video', required: false },
];

const videoModels = MODELS.filter((m) => m.category === 'video');

export function VideoGenNode({ id, data, selected }: NodeProps) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const edges = useFlowStore((s) => s.edges);
  const nodeState = useExecutionStore((s) => s.nodeStates[id]);
  const videoUrl = (nodeState?.result as Record<string, unknown>)?.video as string | undefined;

  const modelId = (data.modelId as string) || 'fal-ai/veo3';
  const currentModel = getModelById(modelId);

  // Check which inputs are connected
  const hasImageConnected = edges.some((e) => e.target === id && e.targetHandle === 'image');
  const hasVideoConnected = edges.some((e) => e.target === id && e.targetHandle === 'video');
  const hasAudioConnected = edges.some((e) => e.target === id && e.targetHandle === 'audio');

  // Auto-switch model only when a connection is first made (not on manual dropdown changes)
  const prevImageConnected = useRef(hasImageConnected);
  const prevVideoConnected = useRef(hasVideoConnected);
  useEffect(() => {
    const imageJustConnected = hasImageConnected && !prevImageConnected.current;
    const videoJustConnected = hasVideoConnected && !prevVideoConnected.current;
    if (videoJustConnected && !currentModel?.supportsVideoInput) {
      updateNodeData(id, { modelId: 'bytedance/seedance-2.0/reference-to-video' });
    } else if (imageJustConnected && !currentModel?.supportsImageInput) {
      updateNodeData(id, { modelId: 'fal-ai/veo3.1/fast/image-to-video' });
    }
    prevImageConnected.current = hasImageConnected;
    prevVideoConnected.current = hasVideoConnected;
  }, [hasImageConnected, hasVideoConnected, currentModel, id, updateNodeData]);

  const willAutoSwitchForImage = hasImageConnected && !currentModel?.supportsImageInput;
  const willAutoSwitchForVideo = hasVideoConnected && !currentModel?.supportsVideoInput;
  const willAutoSwitchForAudio = hasAudioConnected && !currentModel?.supportsAudioInput;

  return (
    <BaseNode
      id={id}
      label="Video Generation"
      category="ai"
      icon={<Video size={14} />}
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
            value={modelId}
            onChange={(e) => updateNodeData(id, { modelId: e.target.value })}
            className="w-full rounded nodrag"
          >
            {videoModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}{m.supportsVideoInput ? ' (vid2vid)' : m.supportsImageInput ? ' (img2vid)' : ''}
              </option>
            ))}
          </select>
          {willAutoSwitchForImage && (
            <div style={{ font: 'var(--font-tiny-label)', color: '#ff9f0a', marginTop: 4 }}>
              Image connected → will use Veo 3.1 Img2Vid
            </div>
          )}
          {willAutoSwitchForVideo && (
            <div style={{ font: 'var(--font-tiny-label)', color: '#ff9f0a', marginTop: 4 }}>
              Video connected → will use Seedance 2.0 Multi-Ref
            </div>
          )}
          {willAutoSwitchForAudio && (
            <div className="flex items-center gap-1" style={{ font: 'var(--font-tiny-label)', color: '#ff9f0a', marginTop: 4 }}>
              <Music size={10} />
              Audio connected → will use Seedance 2.0 Multi-Ref
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

        {videoUrl && (
          <div className="mt-2 rounded overflow-hidden border relative group" style={{ borderColor: 'var(--color-border)' }}>
            <video src={videoUrl} controls className="w-full h-auto" />
            <button
              onClick={() => window.open(videoUrl, '_blank')}
              className="absolute top-2 right-2 flex items-center justify-center nodrag opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(26, 26, 28, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--color-secondary-c200)',
              }}
              title="Download video"
            >
              <Download size={14} />
            </button>
          </div>
        )}

        {nodeState?.status === 'running' && (
          <div className="flex items-center gap-2" style={{ font: 'var(--font-helper)', color: 'var(--color-text-secondary)' }}>
            <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-secondary-c300)', borderTopColor: 'transparent' }} />
            Generating video…
          </div>
        )}
      </div>
    </BaseNode>
  );
}
