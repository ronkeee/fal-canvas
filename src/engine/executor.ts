import type { Node, Edge } from '@xyflow/react';
import { useExecutionStore } from '../store/execution-store';
import { nodeRegistry } from '../nodes/registry';

function topologicalSort(nodes: Node[], edges: Edge[]): string[] {
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    graph.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    graph.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    for (const neighbor of graph.get(current) || []) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error('Cycle detected in flow graph');
  }

  return sorted;
}

/** Helper: append a value to an input key, collecting into arrays when multiple edges target the same handle */
function appendInput(inputs: Record<string, unknown>, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  const existing = inputs[key];
  if (existing === undefined) {
    // First value — store as-is (string)
    inputs[key] = value;
  } else if (Array.isArray(existing)) {
    // Already an array — push
    existing.push(value);
  } else {
    // Second value — promote to array
    inputs[key] = [existing, value];
  }
}

function getInputsForNode(
  nodeId: string,
  edges: Edge[],
  nodeResults: Map<string, Record<string, unknown>>,
): Record<string, unknown> {
  const inputs: Record<string, unknown> = {};

  for (const edge of edges) {
    if (edge.target === nodeId) {
      const sourceResult = nodeResults.get(edge.source);
      if (sourceResult) {
        const sourceHandle = edge.sourceHandle || 'default';
        const targetHandle = edge.targetHandle || 'default';

        // Map output handle to input handle — collect into arrays when multiple edges target the same handle
        if (sourceHandle === 'text' || sourceHandle === 'default') {
          const key = targetHandle === 'default' ? 'prompt' : targetHandle;
          appendInput(inputs, key, sourceResult.text || sourceResult.image || sourceResult.video);
        }
        if (sourceHandle === 'image') {
          const key = targetHandle === 'default' ? 'image' : targetHandle;
          appendInput(inputs, key, sourceResult.image);
        }
        if (sourceHandle === 'video') {
          const key = targetHandle === 'default' ? 'video' : targetHandle;
          appendInput(inputs, key, sourceResult.video);
        }
        if (sourceHandle === 'audio') {
          const key = targetHandle === 'default' ? 'audio' : targetHandle;
          appendInput(inputs, key, sourceResult.audio);
        }

        // Also spread all results as a fallback (won't overwrite collected arrays)
        for (const [k, v] of Object.entries(sourceResult)) {
          if (!(k in inputs)) inputs[k] = v;
        }
      }
    }
  }

  return inputs;
}

/**
 * Find all ancestor node IDs for a given target node by walking edges backward.
 */
function getAncestorIds(targetId: string, _nodes: Node[], edges: Edge[]): Set<string> {
  const ancestors = new Set<string>();
  const queue = [targetId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    ancestors.add(current);

    for (const edge of edges) {
      if (edge.target === current && !ancestors.has(edge.source)) {
        queue.push(edge.source);
      }
    }
  }

  return ancestors;
}

async function executeNodes(
  nodes: Node[],
  edges: Edge[],
  signal?: AbortSignal,
): Promise<void> {
  const store = useExecutionStore.getState();
  const nodeResults = new Map<string, Record<string, unknown>>();
  const failedNodes = new Set<string>();

  // Reset all states to pending
  for (const node of nodes) {
    store.setNodeState(node.id, { status: 'pending', error: undefined, result: undefined });
  }

  try {
    // Validate no cycles
    topologicalSort(nodes, edges);

    // Build dependency graph for wave-based parallel execution
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

    // Track which nodes have upstream failures
    const hasUpstreamError = (nodeId: string): boolean => {
      for (const edge of edges) {
        if (edge.target === nodeId && failedNodes.has(edge.source)) return true;
      }
      return false;
    };

    let executed = 0;
    const total = nodes.length;

    while (executed < total) {
      if (signal?.aborted) {
        // Mark remaining nodes as idle
        for (const node of nodes) {
          const deg = inDegree.get(node.id);
          if (deg !== undefined && deg >= 0 && !nodeResults.has(node.id) && !failedNodes.has(node.id)) {
            store.setNodeState(node.id, { status: 'idle' });
          }
        }
        break;
      }

      // Find all ready nodes (inDegree === 0, not yet executed)
      const wave: string[] = [];
      for (const [id, degree] of inDegree) {
        if (degree === 0) wave.push(id);
      }

      if (wave.length === 0) break; // no more executable nodes

      // Remove from inDegree so they won't be picked again
      for (const id of wave) {
        inDegree.delete(id);
      }

      // Execute the wave in parallel
      await Promise.allSettled(
        wave.map(async (nodeId) => {
          const node = nodes.find((n) => n.id === nodeId);
          if (!node) { executed++; return; }

          // Skip if upstream failed
          if (hasUpstreamError(nodeId)) {
            failedNodes.add(nodeId);
            store.setNodeState(nodeId, {
              status: 'error',
              error: 'Skipped — upstream node failed',
              completedAt: Date.now(),
            });
            executed++;
            return;
          }

          const handler = nodeRegistry.getHandler(node.type || '');
          if (!handler) {
            nodeResults.set(nodeId, {});
            store.setNodeState(nodeId, { status: 'completed' });
            executed++;
            return;
          }

          if (signal?.aborted) {
            store.setNodeState(nodeId, { status: 'idle' });
            executed++;
            return;
          }

          store.setNodeState(nodeId, { status: 'running', startedAt: Date.now() });

          try {
            const inputs = getInputsForNode(nodeId, edges, nodeResults);
            const result = await handler(node, inputs, (status, progress) => {
              store.setNodeState(nodeId, { status: status as 'queued' | 'running', progress });
            }, signal);

            nodeResults.set(nodeId, result);
            store.setNodeState(nodeId, {
              status: 'completed',
              result,
              completedAt: Date.now(),
            });
          } catch (err) {
            failedNodes.add(nodeId);
            // fal.ai throws ApiError (extends Error) with .status, .body, .requestId
            // .message = body.message || statusText (often generic)
            // .body.detail = the real descriptive reason
            let errorMsg = 'Unknown error';
            if (err && typeof err === 'object') {
              const e = err as Record<string, unknown>;
              const status = e.status as number | undefined;
              const body = e.body as Record<string, unknown> | undefined;
              const baseMsg = (e.message as string) || '';
              // body.detail may be a string, an object {msg, code}, or an array
              const rawDetail = body?.detail ?? body?.message;
              const detail =
                typeof rawDetail === 'string' ? rawDetail :
                rawDetail && typeof rawDetail === 'object' && 'msg' in (rawDetail as object)
                  ? String((rawDetail as Record<string, unknown>).msg)
                  : rawDetail ? JSON.stringify(rawDetail) : '';
              const parts: string[] = [];
              if (status) parts.push(`[${status}]`);
              if (detail && detail !== baseMsg) {
                parts.push(detail);
              } else if (baseMsg) {
                parts.push(baseMsg);
              }
              errorMsg = parts.join(' ') || JSON.stringify(err);
            }
            store.setNodeState(nodeId, {
              status: 'error',
              error: errorMsg,
              completedAt: Date.now(),
            });
          }

          executed++;
        })
      );

      // Decrement inDegree for children of completed wave
      for (const nodeId of wave) {
        for (const childId of children.get(nodeId) || []) {
          const deg = inDegree.get(childId);
          if (deg !== undefined) {
            inDegree.set(childId, deg - 1);
          }
        }
      }
    }
  } catch (err) {
    console.error('Flow execution error:', err);
  }
}

/**
 * Execute the entire flow graph.
 */
export async function executeFlow(nodes: Node[], edges: Edge[], signal?: AbortSignal): Promise<void> {
  return executeNodes(nodes, edges, signal);
}

/**
 * Execute a single node and all its upstream dependencies.
 */
export async function executeSubgraph(
  targetNodeId: string,
  allNodes: Node[],
  allEdges: Edge[],
  signal?: AbortSignal,
): Promise<void> {
  const ancestorIds = getAncestorIds(targetNodeId, allNodes, allEdges);
  const subNodes = allNodes.filter((n) => ancestorIds.has(n.id));
  const subEdges = allEdges.filter((e) => ancestorIds.has(e.source) && ancestorIds.has(e.target));
  return executeNodes(subNodes, subEdges, signal);
}
