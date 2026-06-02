import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type XYPosition,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import { generateId } from '../utils/id';
import { NODE_CONFIGS } from '../nodes';
import { useHistoryStore } from './history-store';
import type { PortType } from '../engine/types';

export interface FlowMeta {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  nodeCount?: number;
  models?: string[];
}

export interface SavedFlow extends FlowMeta {
  nodes: Node[];
  edges: Edge[];
}

export interface FlowState {
  nodes: Node[];
  edges: Edge[];
  flowMeta: FlowMeta;
  saveStatus: 'idle' | 'saving' | 'saved';
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (type: string, position: XYPosition) => string | undefined;
  addNodeAndConnect: (type: string, position: XYPosition, sourceNodeId: string, sourceHandleId: string, targetHandleId: string, direction?: 'left' | 'right') => void;
  insertNodeOnEdge: (edgeId: string, nodeType: string, position: XYPosition) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;
  disconnectPort: (nodeId: string, portId: string, side: 'input' | 'output') => void;
  clearFlow: () => void;
  toJSON: () => SavedFlow;
  fromJSON: (data: SavedFlow) => void;
  // Save/Load
  saveFlow: (name?: string) => void;
  loadFlow: (id: string) => boolean;
  listSavedFlows: () => FlowMeta[];
  deleteSavedFlow: (id: string) => void;
  exportFlowJSON: () => string;
  importFlowJSON: (json: string) => boolean;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
let isDirty = false;
let isRestoringSnapshot = false;

/** Call before applying undo/redo to prevent re-pushing to history */
export function beginSnapshotRestore() { isRestoringSnapshot = true; }
export function endSnapshotRestore() {
  // Delay reset so the cascading onNodesChange/onEdgesChange events are skipped
  setTimeout(() => { isRestoringSnapshot = false; }, 100);
}

function scheduleSnapshot(nodes: Node[], edges: Edge[]) {
  if (isRestoringSnapshot) return; // Skip during undo/redo
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    useHistoryStore.getState().pushSnapshot({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
  }, 400);

  // Mark dirty for auto-save
  isDirty = true;
  scheduleAutoSave();
}

function scheduleAutoSave() {
  if (autoSaveTimer) return; // already scheduled
  autoSaveTimer = setTimeout(() => {
    autoSaveTimer = null;
    if (!isDirty) return;
    isDirty = false;
    const state = useFlowStore.getState();
    state.saveFlow();
  }, 10000); // 10 seconds
}

function autoSave(nodes: Node[], edges: Edge[], meta: FlowMeta) {
  try {
    const saved: SavedFlow = { ...meta, nodes, edges, updatedAt: Date.now() };
    localStorage.setItem(`fal-canvas-flow-${meta.id}`, JSON.stringify(saved));
  } catch { /* storage full or unavailable */ }
}

/** Generate a descriptive flow name from the nodes in the flow */
function generateFlowName(nodes: Node[]): string {
  if (nodes.length === 0) return 'Untitled Flow';

  // Check for prompt text to use as a basis
  const promptNode = nodes.find((n) => n.type === 'prompt');
  const promptText = (promptNode?.data?.text as string)?.trim();

  // Get the primary AI node types in the flow
  const aiTypes = nodes
    .map((n) => {
      const config = NODE_CONFIGS[n.type || ''];
      if (!config) return null;
      if (['prompt', 'fileUpload', 'output', 'note', 'merge', 'number'].includes(n.type || '')) return null;
      return config.label;
    })
    .filter(Boolean) as string[];

  const uniqueAi = [...new Set(aiTypes)];

  // If there's a short prompt, use it as the name
  if (promptText && promptText.length <= 40) {
    return promptText;
  }

  // If there's a longer prompt, truncate it
  if (promptText && promptText.length > 40) {
    return promptText.slice(0, 37) + '…';
  }

  // Fall back to describing the pipeline by AI node types
  if (uniqueAi.length === 1) return `${uniqueAi[0]} Flow`;
  if (uniqueAi.length === 2) return `${uniqueAi[0]} → ${uniqueAi[1]}`;
  if (uniqueAi.length > 2) return `${uniqueAi[0]} → ${uniqueAi[1]} +${uniqueAi.length - 2}`;

  return 'Untitled Flow';
}

const defaultMeta: FlowMeta = {
  id: generateId('flow'),
  name: 'Untitled Flow',
  description: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  flowMeta: { ...defaultMeta },
  saveStatus: 'idle',

  onNodesChange: (changes) => {
    const newNodes = applyNodeChanges(changes, get().nodes);
    set({ nodes: newNodes });
    scheduleSnapshot(newNodes, get().edges);
  },

  onEdgesChange: (changes) => {
    const newEdges = applyEdgeChanges(changes, get().edges);
    set({ edges: newEdges });
    scheduleSnapshot(get().nodes, newEdges);
  },

  onConnect: (connection) => {
    let portType: PortType = 'any';
    const sourceNode = get().nodes.find((n) => n.id === connection.source);
    if (sourceNode?.type) {
      const config = NODE_CONFIGS[sourceNode.type];
      const outputPort = config?.outputs.find((p) => p.id === connection.sourceHandle);
      if (outputPort) portType = outputPort.type;
    }

    const newEdges = addEdge(
      { ...connection, type: 'custom', animated: true, data: { portType } },
      get().edges,
    );
    set({ edges: newEdges });
    scheduleSnapshot(get().nodes, newEdges);
  },

  addNode: (type, position) => {
    const config = NODE_CONFIGS[type];
    if (!config) return undefined;

    const newNode: Node = {
      id: generateId('node'),
      type,
      position,
      data: { ...config.defaultData },
    };

    const newNodes = [...get().nodes, newNode];
    set({ nodes: newNodes });
    scheduleSnapshot(newNodes, get().edges);
    return newNode.id;
  },

  addNodeAndConnect: (type, position, existingNodeId, handleA, handleB, direction = 'right') => {
    const config = NODE_CONFIGS[type];
    if (!config) return;

    const newNode: Node = {
      id: generateId('node'),
      type,
      position,
      data: { ...config.defaultData },
    };

    let edgeSource: string;
    let edgeSourceHandle: string;
    let edgeTarget: string;
    let edgeTargetHandle: string;

    if (direction === 'left') {
      // Left plus: new node sends TO existing node
      // newNode.output → existingNode.input
      edgeSource = newNode.id;
      edgeSourceHandle = handleA;  // output handle on new node
      edgeTarget = existingNodeId;
      edgeTargetHandle = handleB;  // input handle on existing node
    } else {
      // Right plus: existing node sends TO new node
      // existingNode.output → newNode.input
      edgeSource = existingNodeId;
      edgeSourceHandle = handleA;  // output handle on existing node
      edgeTarget = newNode.id;
      edgeTargetHandle = handleB;  // input handle on new node
    }

    // Determine port type for edge coloring
    const srcNode = get().nodes.find((n) => n.id === edgeSource) || (edgeSource === newNode.id ? newNode : undefined);
    let portType: PortType = 'any';
    if (srcNode?.type) {
      const srcConfig = NODE_CONFIGS[srcNode.type];
      const outputPort = srcConfig?.outputs.find((p) => p.id === edgeSourceHandle);
      if (outputPort) portType = outputPort.type;
    }

    const newEdge: Edge = {
      id: generateId('edge'),
      source: edgeSource,
      sourceHandle: edgeSourceHandle,
      target: edgeTarget,
      targetHandle: edgeTargetHandle,
      type: 'custom',
      data: { portType },
    };

    const newNodes = [...get().nodes, newNode];
    const newEdges = [...get().edges, newEdge];
    set({ nodes: newNodes, edges: newEdges });
    scheduleSnapshot(newNodes, newEdges);
  },

  insertNodeOnEdge: (edgeId, nodeType, position) => {
    const config = NODE_CONFIGS[nodeType];
    if (!config) return;

    const edge = get().edges.find((e) => e.id === edgeId);
    if (!edge) return;

    const newNode: Node = {
      id: generateId('node'),
      type: nodeType,
      position,
      data: { ...config.defaultData },
    };

    // Find compatible handles on the new node
    const portType = (edge.data?.portType as PortType) || 'any';
    const inputHandle = config.inputs.find(
      (p) => p.type === portType || p.type === 'any' || portType === 'any'
    );
    const outputHandle = config.outputs.find(
      (p) => p.type === portType || p.type === 'any' || portType === 'any'
    );

    if (!inputHandle || !outputHandle) return;

    // Create two new edges: source→newNode, newNode→target
    const edge1: Edge = {
      id: generateId('edge'),
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      target: newNode.id,
      targetHandle: inputHandle.id,
      type: 'custom',
      animated: true,
      data: { portType },
    };

    const edge2: Edge = {
      id: generateId('edge'),
      source: newNode.id,
      sourceHandle: outputHandle.id,
      target: edge.target,
      targetHandle: edge.targetHandle,
      type: 'custom',
      animated: true,
      data: { portType },
    };

    // Remove old edge, add new node + 2 edges
    const newNodes = [...get().nodes, newNode];
    const newEdges = [...get().edges.filter((e) => e.id !== edgeId), edge1, edge2];
    set({ nodes: newNodes, edges: newEdges });
    scheduleSnapshot(newNodes, newEdges);
  },

  updateNodeData: (nodeId, data) => {
    const newNodes = get().nodes.map((node) =>
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    );
    set({ nodes: newNodes });
    scheduleSnapshot(newNodes, get().edges);
  },

  deleteNode: (nodeId) => {
    const newNodes = get().nodes.filter((n) => n.id !== nodeId);
    const newEdges = get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    set({ nodes: newNodes, edges: newEdges });
    scheduleSnapshot(newNodes, newEdges);
  },

  deleteEdge: (edgeId) => {
    const newEdges = get().edges.filter((e) => e.id !== edgeId);
    set({ edges: newEdges });
    scheduleSnapshot(get().nodes, newEdges);
  },

  disconnectPort: (nodeId, portId, side) => {
    const newEdges = get().edges.filter((e) =>
      side === 'input'
        ? !(e.target === nodeId && e.targetHandle === portId)
        : !(e.source === nodeId && e.sourceHandle === portId)
    );
    set({ edges: newEdges });
    scheduleSnapshot(get().nodes, newEdges);
  },

  clearFlow: () => {
    set({ nodes: [], edges: [], flowMeta: { ...defaultMeta, id: generateId('flow'), createdAt: Date.now(), updatedAt: Date.now() } });
  },

  toJSON: () => ({
    ...get().flowMeta,
    nodes: get().nodes,
    edges: get().edges,
    updatedAt: Date.now(),
  }),

  fromJSON: (data) => {
    useHistoryStore.getState().clear();
    // Strip 'measured' so React Flow re-measures, and 'selected' to reset selection
    const cleanNodes = (data.nodes || []).map((n: any) => {
      const { measured, selected, ...rest } = n;
      return { ...rest };
    });
    const cleanEdges = (data.edges || []).map((e: any) => {
      const { selected, ...rest } = e;
      return { ...rest };
    });
    set({
      nodes: cleanNodes,
      edges: cleanEdges,
      flowMeta: {
        id: data.id,
        name: data.name,
        description: data.description,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
  },

  saveFlow: (name) => {
    const state = get();

    // Don't save empty flows (no nodes)
    if (state.nodes.length === 0) return;

    // Auto-generate a smart name if still "Untitled Flow" and no explicit name given
    const effectiveName = name
      || (state.flowMeta.name === 'Untitled Flow' ? generateFlowName(state.nodes) : state.flowMeta.name);

    // Compute metadata
    const models = [...new Set(
      state.nodes
        .map((n) => n.data.modelId as string)
        .filter(Boolean)
    )];

    const meta: FlowMeta = {
      ...state.flowMeta,
      name: effectiveName,
      updatedAt: Date.now(),
      nodeCount: state.nodes.length,
      models,
    };

    set({ flowMeta: meta, saveStatus: 'saving' });
    autoSave(state.nodes, state.edges, meta);

    // Update flow index
    const index = getFlowIndex();
    const existingIdx = index.findIndex((f) => f.id === meta.id);
    if (existingIdx >= 0) {
      index[existingIdx] = meta;
    } else {
      index.push(meta);
    }
    localStorage.setItem('fal-canvas-flow-index', JSON.stringify(index));

    // Update status after a tick
    setTimeout(() => set({ saveStatus: 'saved' }), 100);
    setTimeout(() => {
      if (get().saveStatus === 'saved') set({ saveStatus: 'idle' });
    }, 3000);
  },

  loadFlow: (id) => {
    try {
      const raw = localStorage.getItem(`fal-canvas-flow-${id}`);
      if (!raw) return false;
      const data: SavedFlow = JSON.parse(raw);
      get().fromJSON(data);
      return true;
    } catch {
      return false;
    }
  },

  listSavedFlows: () => getFlowIndex(),

  deleteSavedFlow: (id) => {
    localStorage.removeItem(`fal-canvas-flow-${id}`);
    const index = getFlowIndex().filter((f) => f.id !== id);
    localStorage.setItem('fal-canvas-flow-index', JSON.stringify(index));
  },

  exportFlowJSON: () => JSON.stringify(get().toJSON(), null, 2),

  importFlowJSON: (json) => {
    try {
      const data: SavedFlow = JSON.parse(json);
      if (!data.nodes || !data.edges) return false;
      data.id = generateId('flow');
      get().fromJSON(data);
      return true;
    } catch {
      return false;
    }
  },
}));

function getFlowIndex(): FlowMeta[] {
  try {
    const raw = localStorage.getItem('fal-canvas-flow-index');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// One-time cleanup: remove 0-node flows from index and localStorage
(function cleanupEmptyFlows() {
  try {
    const index = getFlowIndex();
    const cleaned = index.filter((f) => (f.nodeCount ?? 0) > 0);
    if (cleaned.length < index.length) {
      const removed = index.filter((f) => (f.nodeCount ?? 0) === 0);
      for (const f of removed) {
        localStorage.removeItem(`fal-canvas-flow-${f.id}`);
      }
      localStorage.setItem('fal-canvas-flow-index', JSON.stringify(cleaned));
    }
  } catch { /* ignore */ }
})();
