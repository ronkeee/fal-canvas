import type { Node, Edge } from '@xyflow/react';
import type { FlowAnalysis, FlowAnalysisModel, FlowAnalysisWarning } from './types';
import { getModelById } from '../fal/model-registry';
import { nodeRegistry } from '../nodes/registry';

/** AI node types that call fal.ai models */
const AI_NODE_TYPES = new Set(['imageGen', 'videoGen', 'audioGen', 'img2img', 'upscale']);

/**
 * Compute execution waves via topological sort.
 * Each wave is a group of nodes that can run in parallel.
 */
function computeWaves(nodes: Node[], edges: Edge[]): string[][] {
  const children = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    children.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    children.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  const waves: string[][] = [];
  let remaining = nodes.length;

  while (remaining > 0) {
    const wave: string[] = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) wave.push(id);
    }
    if (wave.length === 0) break; // cycle or done

    for (const id of wave) {
      inDegree.delete(id);
    }

    // Decrement children
    for (const id of wave) {
      for (const childId of children.get(id) || []) {
        const deg = inDegree.get(childId);
        if (deg !== undefined) inDegree.set(childId, deg - 1);
      }
    }

    waves.push(wave);
    remaining -= wave.length;
  }

  return waves;
}

/**
 * Analyze a flow graph and produce a summary for the pre-flight modal.
 */
export function analyzeFlow(nodes: Node[], edges: Edge[]): FlowAnalysis {
  const aiModels: FlowAnalysisModel[] = [];
  const warnings: FlowAnalysisWarning[] = [];

  // Collect AI models
  for (const node of nodes) {
    const nodeType = node.type || '';
    if (!AI_NODE_TYPES.has(nodeType)) continue;

    const modelId = (node.data.modelId as string) || '';
    const model = getModelById(modelId);
    if (!model) continue;

    aiModels.push({
      nodeId: node.id,
      modelId: model.id,
      modelName: model.name,
      category: model.category,
      description: model.description,
      timeRange: model.estimatedTimeSeconds,
      costRange: model.estimatedCostCents,
    });
  }

  // Compute execution waves
  const waves = computeWaves(nodes, edges);

  // Compute total time & cost based on wave structure
  // Parallel waves: max time within wave, sum across waves
  // Cost: always sum all models
  let totalTimeMin = 0;
  let totalTimeMax = 0;

  for (const wave of waves) {
    let waveTimeMin = 0;
    let waveTimeMax = 0;

    for (const nodeId of wave) {
      const aiModel = aiModels.find((m) => m.nodeId === nodeId);
      if (aiModel) {
        waveTimeMin = Math.max(waveTimeMin, aiModel.timeRange[0]);
        waveTimeMax = Math.max(waveTimeMax, aiModel.timeRange[1]);
      }
    }

    totalTimeMin += waveTimeMin;
    totalTimeMax += waveTimeMax;
  }

  const totalCostMin = aiModels.reduce((sum, m) => sum + m.costRange[0], 0);
  const totalCostMax = aiModels.reduce((sum, m) => sum + m.costRange[1], 0);

  // Scan for warnings
  for (const node of nodes) {
    const nodeType = node.type || '';
    const config = nodeRegistry.configs[nodeType];
    if (!config) continue;

    // Empty prompt warning
    if (nodeType === 'prompt') {
      const text = (node.data.text as string) || '';
      if (!text.trim()) {
        warnings.push({
          type: 'empty-prompt',
          message: `"${config.label}" has no text`,
          nodeId: node.id,
        });
      }
    }

    // Missing required image input
    if (nodeType === 'img2img' || nodeType === 'upscale') {
      const hasImageEdge = edges.some(
        (e) => e.target === node.id && (e.targetHandle === 'image' || e.targetHandle === 'default'),
      );
      if (!hasImageEdge) {
        warnings.push({
          type: 'missing-image',
          message: `"${config.label}" has no image input connected`,
          nodeId: node.id,
        });
      }
    }

    // Unconnected AI node (no edges at all)
    if (AI_NODE_TYPES.has(nodeType)) {
      const hasAnyEdge = edges.some((e) => e.source === node.id || e.target === node.id);
      if (!hasAnyEdge) {
        warnings.push({
          type: 'unconnected',
          message: `"${config.label}" is not connected to anything`,
          nodeId: node.id,
        });
      }
    }

    // High resolution warning
    if (AI_NODE_TYPES.has(nodeType)) {
      const resolution = node.data.resolution as string | undefined;
      if (resolution === '4K') {
        warnings.push({
          type: 'high-resolution',
          message: `"${config.label}" set to 4K — may cost more and take longer`,
          nodeId: node.id,
        });
      }
    }
  }

  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    aiModels,
    executionWaves: waves,
    totalTimeRange: [totalTimeMin, totalTimeMax],
    totalCostRange: [totalCostMin, totalCostMax],
    warnings,
  };
}
