import { NODE_CONFIGS } from '../nodes';
import type { PortType } from '../engine/types';

/**
 * Returns node types that have at least one input compatible with the given source port type.
 */
export function getCompatibleNodeTypes(sourcePortType: PortType): string[] {
  return Object.entries(NODE_CONFIGS)
    .filter(([, config]) =>
      config.inputs.some(
        (input) =>
          input.type === sourcePortType ||
          input.type === 'any' ||
          sourcePortType === 'any'
      )
    )
    .map(([type]) => type);
}

/**
 * Find the first compatible input handle on a target node for a given source port type.
 */
export function findCompatibleInputHandle(
  nodeType: string,
  sourcePortType: PortType
): string | null {
  const config = NODE_CONFIGS[nodeType];
  if (!config) return null;

  const match = config.inputs.find(
    (input) =>
      input.type === sourcePortType ||
      input.type === 'any' ||
      sourcePortType === 'any'
  );

  return match?.id ?? null;
}

/**
 * Returns node types that have at least one output compatible with the given target input type.
 * Used for LEFT plus button — "what nodes can send data TO me?"
 */
export function getNodesWithCompatibleOutput(targetInputType: PortType): string[] {
  return Object.entries(NODE_CONFIGS)
    .filter(([, config]) =>
      config.outputs.some(
        (output) =>
          output.type === targetInputType ||
          output.type === 'any' ||
          targetInputType === 'any'
      )
    )
    .map(([type]) => type);
}

/**
 * Find the first compatible output handle on a node for a given target port type.
 */
export function findCompatibleOutputHandle(
  nodeType: string,
  targetPortType: PortType
): string | null {
  const config = NODE_CONFIGS[nodeType];
  if (!config) return null;

  const match = config.outputs.find(
    (output) =>
      output.type === targetPortType ||
      output.type === 'any' ||
      targetPortType === 'any'
  );

  return match?.id ?? null;
}
