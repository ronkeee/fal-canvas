import { type NodeProps } from '@xyflow/react';
import { Merge } from 'lucide-react';
import { BaseNode } from '../base/BaseNode';
import type { PortDef } from '../../engine/types';

const inputs: PortDef[] = [
  { id: 'input1', label: 'Input 1', type: 'any', required: false },
  { id: 'input2', label: 'Input 2', type: 'any', required: false },
];

const outputs: PortDef[] = [
  { id: 'combined', label: 'Combined', type: 'any', required: false },
];

export function MergeNode({ id, selected }: NodeProps) {
  return (
    <BaseNode
      id={id}
      label="Merge"
      category="utility"
      icon={<Merge size={14} />}
      inputs={inputs}
      outputs={outputs}
      selected={selected}
    >
      <div className="text-center py-2" style={{ font: 'var(--font-helper)', color: 'var(--color-text-secondary)' }}>
        Combines multiple inputs
      </div>
    </BaseNode>
  );
}
