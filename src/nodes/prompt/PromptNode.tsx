import { useState } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Type, Wand2, Loader2 } from 'lucide-react';
import { BaseNode } from '../base/BaseNode';
import { useFlowStore } from '../../store/flow-store';
import { useAppStore } from '../../store/app-store';
import { fal } from '../../fal/client';
import type { PortDef } from '../../engine/types';

const outputs: PortDef[] = [
  { id: 'text', label: 'Text', type: 'text', required: false },
];

const ENHANCE_SYSTEM_PROMPT = `You are a prompt engineer for AI image and video generation.
Your job is to ENHANCE the user's prompt — not replace it.
The user's original words and subject must remain the core of the enhanced version.
Start with their exact concept, then expand it by adding:
- Visual details (lighting, shadows, reflections)
- Style and medium (photography, illustration, 3D render, etc.)
- Composition (camera angle, framing, depth of field)
- Mood and atmosphere (color temperature, time of day, weather)
- Texture and material details
The enhanced prompt must clearly be a richer version of the SAME idea, not a new one.
Output ONLY the enhanced prompt text. No explanations, no quotes, no prefixes.`;

export function PromptNode({ id, data, selected }: NodeProps) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const [enhancing, setEnhancing] = useState(false);
  const hasText = !!((data.text as string)?.trim());

  const handleEnhance = async () => {
    const text = (data.text as string)?.trim();
    const { falApiKey, addToast } = useAppStore.getState();

    if (!falApiKey) {
      addToast('Add your fal.ai API key in Settings first', 'error');
      return;
    }
    if (!text) {
      addToast('Type a prompt first, then enhance it', 'error');
      return;
    }

    setEnhancing(true);
    try {
      const result = await fal.subscribe('fal-ai/any-llm', {
        input: {
          model: 'anthropic/claude-3.5-sonnet',
          prompt: text,
          system_prompt: ENHANCE_SYSTEM_PROMPT,
        },
      });
      const enhanced = (result.data as any)?.output?.trim();
      if (enhanced) {
        updateNodeData(id, { text: enhanced });
      }
    } catch (err: any) {
      addToast(err?.message || 'Failed to enhance prompt', 'error');
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <BaseNode
      id={id}
      label="Text Prompt"
      category="input"
      icon={<Type size={14} />}
      outputs={outputs}
      selected={selected}
      width={380}
      resizable
    >
      <textarea
        value={(data.text as string) || ''}
        onChange={(e) => updateNodeData(id, { text: e.target.value })}
        placeholder="Enter your prompt..."
        className="w-full rounded px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-accent nodrag nowheel"
        style={{
          font: 'var(--font-body-small)',
          backgroundColor: 'var(--color-surface-hover)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
          minHeight: '120px',
          flex: '1 1 auto',
        }}
        rows={6}
      />
      <button
        onClick={handleEnhance}
        disabled={enhancing || !hasText}
        className="flex items-center gap-1.5 transition-colors duration-150 hover:brightness-125 nodrag"
        style={{
          marginTop: 8,
          padding: '5px 12px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-transparent-w10)',
          color: hasText ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          border: '1px solid var(--color-border)',
          font: 'var(--font-tip)',
          cursor: enhancing ? 'wait' : hasText ? 'pointer' : 'default',
          opacity: hasText ? 1 : 0.5,
        }}
      >
        {enhancing ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
        {enhancing ? 'Enhancing…' : 'Enhance'}
      </button>
    </BaseNode>
  );
}
