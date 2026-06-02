import { create } from 'zustand';
import type { NodeExecutionState } from '../engine/types';

interface ExecutionState {
  nodeStates: Record<string, NodeExecutionState>;
  isRunning: boolean;
  abortController: AbortController | null;

  setNodeState: (nodeId: string, state: Partial<NodeExecutionState>) => void;
  getNodeState: (nodeId: string) => NodeExecutionState;
  setIsRunning: (running: boolean) => void;
  setAbortController: (controller: AbortController | null) => void;
  clearResults: () => void;
}

const DEFAULT_STATE: NodeExecutionState = { status: 'idle' };

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  nodeStates: {},
  isRunning: false,
  abortController: null,

  setNodeState: (nodeId, state) => {
    set({
      nodeStates: {
        ...get().nodeStates,
        [nodeId]: { ...get().getNodeState(nodeId), ...state },
      },
    });
  },

  getNodeState: (nodeId) => {
    return get().nodeStates[nodeId] || DEFAULT_STATE;
  },

  setIsRunning: (running) => set({ isRunning: running }),

  setAbortController: (controller) => set({ abortController: controller }),

  clearResults: () => set({ nodeStates: {}, isRunning: false, abortController: null }),
}));
