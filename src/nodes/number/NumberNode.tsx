import { type NodeProps } from '@xyflow/react';
import { Hash } from 'lucide-react';
import { BaseNode } from '../base/BaseNode';
import { useFlowStore } from '../../store/flow-store';
import type { PortDef } from '../../engine/types';

const outputs: PortDef[] = [
  { id: 'text', label: 'Value', type: 'text', required: false },
];

export function NumberNode({ id, data, selected }: NodeProps) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const value = (data.value as number) ?? 0;
  const min = (data.min as number) ?? 0;
  const max = (data.max as number) ?? 100;

  return (
    <BaseNode
      id={id}
      label="Number"
      category="input"
      icon={<Hash size={14} />}
      outputs={outputs}
      selected={selected}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => updateNodeData(id, { value: Number(e.target.value) })}
          className="w-full nodrag"
        />
        <input
          type="number"
          value={value}
          onChange={(e) => updateNodeData(id, { value: Number(e.target.value) })}
          className="w-full rounded px-2 py-1.5 nodrag"
          style={{
            font: 'var(--font-body-small)',
            backgroundColor: 'var(--color-surface-hover)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        />
      </div>
    </BaseNode>
  );
}
