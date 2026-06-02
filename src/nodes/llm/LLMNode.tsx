import { type NodeProps } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';
import { BaseNode } from '../base/BaseNode';
import { useFlowStore } from '../../store/flow-store';
import { useExecutionStore } from '../../store/execution-store';
import type { PortDef } from '../../engine/types';

const inputs: PortDef[] = [
  { id: 'prompt', label: 'Prompt', type: 'text', required: true },
];

const outputs: PortDef[] = [
  { id: 'text', label: 'Text', type: 'text', required: false },
];

export function LLMNode({ id, data, selected }: NodeProps) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const nodeState = useExecutionStore((s) => s.nodeStates[id]);
  const resultText = (nodeState?.result as Record<string, unknown>)?.text as string | undefined;

  return (
    <BaseNode
      id={id}
      label="LLM / Text"
      category="ai"
      icon={<MessageSquare size={14} />}
      inputs={inputs}
      outputs={outputs}
      selected={selected}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <label style={{ marginBottom: 4, display: 'block', font: 'var(--font-tip)', color: 'var(--color-text-secondary)' }}>
            System Prompt
          </label>
          <textarea
            value={(data.systemPrompt as string) || ''}
            onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value })}
            placeholder="Optional system instructions..."
            className="w-full rounded px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-accent nodrag nowheel"
            style={{
              font: 'var(--font-body-small)',
              backgroundColor: 'var(--color-surface-hover)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              minHeight: '50px',
            }}
            rows={2}
          />
        </div>

        <div>
          <label style={{ marginBottom: 4, display: 'block', font: 'var(--font-tip)', color: 'var(--color-text-secondary)' }}>
            Template
          </label>
          <textarea
            value={(data.template as string) || '{{input}}'}
            onChange={(e) => updateNodeData(id, { template: e.target.value })}
            placeholder="Use {{input}} for the incoming text"
            className="w-full rounded px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-accent nodrag nowheel"
            style={{
              font: 'var(--font-body-small)',
              backgroundColor: 'var(--color-surface-hover)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              minHeight: '50px',
            }}
            rows={2}
          />
        </div>

        {resultText && (
          <div
            className="rounded px-2 py-1.5 break-words max-h-[100px] overflow-y-auto"
            style={{
              font: 'var(--font-body-small)',
              backgroundColor: 'var(--color-surface-hover)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            {resultText}
          </div>
        )}

        {nodeState?.status === 'running' && (
          <div className="flex items-center gap-2" style={{ font: 'var(--font-helper)', color: 'var(--color-text-secondary)' }}>
            <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            Processing...
          </div>
        )}
      </div>
    </BaseNode>
  );
}
