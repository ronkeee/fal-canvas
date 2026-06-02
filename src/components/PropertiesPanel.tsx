import { X, Play } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { useFlowStore } from '../store/flow-store';
import { useExecutionStore } from '../store/execution-store';
import { NODE_CONFIGS } from '../nodes';
import { CATEGORY_COLORS, type NodeExecutionStatus, STATUS_COLORS } from '../engine/types';
import { executeSubgraph } from '../engine/executor';

export function PropertiesPanel() {
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const deleteNode = useFlowStore((s) => s.deleteNode);

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node || !selectedNodeId) return null;

  const config = NODE_CONFIGS[node.type || ''];
  if (!config) return null;

  const nodeState = useExecutionStore.getState().nodeStates[selectedNodeId];
  const status: NodeExecutionStatus = nodeState?.status || 'idle';

  const handleRunNode = async () => {
    const falApiKey = useAppStore.getState().falApiKey;
    if (!falApiKey) {
      useAppStore.getState().addToast('Set your fal.ai API key first', 'error');
      return;
    }
    const store = useExecutionStore.getState();
    const controller = new AbortController();
    store.setAbortController(controller);
    store.setIsRunning(true);
    try {
      await executeSubgraph(selectedNodeId, nodes, edges, controller.signal);
    } finally {
      store.setIsRunning(false);
      store.setAbortController(null);
    }
  };

  const catColor = CATEGORY_COLORS[config.category];

  return (
    <div
      className="fixed top-12 right-0 bottom-0 z-20 overflow-y-auto animate-slide-in"
      style={{
        width: 288,
        background: 'rgba(26, 26, 28, 0.50)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderLeft: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: catColor }} />
          <span style={{ font: 'var(--font-heading-xxsmall)', color: 'var(--color-text-primary)' }}>
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {config.category === 'ai' && (
            <button
              onClick={handleRunNode}
              className="flex items-center gap-1 text-white transition-colors duration-150"
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-accent)',
                font: 'var(--font-tip)',
              }}
            >
              <Play size={10} /> Run
            </button>
          )}
          <button
            onClick={() => setSelectedNodeId(null)}
            className="flex items-center justify-center hover:bg-[var(--color-surface-hover)] transition-colors duration-150"
            style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Status */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: STATUS_COLORS[status] }} />
          <span className="capitalize" style={{ font: 'var(--font-body-small)', color: 'var(--color-text-secondary)' }}>
            {status}
          </span>
          {nodeState?.completedAt && nodeState?.startedAt && (
            <span className="ml-auto" style={{ font: 'var(--font-helper)', color: 'var(--color-text-muted)' }}>
              {((nodeState.completedAt - nodeState.startedAt) / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      {/* Node ID */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <label className="block" style={{ font: 'var(--font-tip)', color: 'var(--color-text-muted)', marginBottom: 4 }}>
          Node ID
        </label>
        <span className="font-mono" style={{ font: 'var(--font-helper)', color: 'var(--color-text-secondary)' }}>
          {selectedNodeId}
        </span>
      </div>

      {/* Inputs & Outputs */}
      {(config.inputs.length > 0 || config.outputs.length > 0) && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
          {config.inputs.length > 0 && (
            <div style={{ marginBottom: config.outputs.length > 0 ? 12 : 0 }}>
              <label className="block" style={{ font: 'var(--font-tip)', color: 'var(--color-text-muted)', marginBottom: 6 }}>
                Inputs
              </label>
              {config.inputs.map((port) => (
                <div key={port.id} className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: `var(--color-port-${port.type})` }} />
                  <span style={{ font: 'var(--font-body-small)', color: 'var(--color-text-primary)' }}>{port.label}</span>
                  <span style={{ font: 'var(--font-helper)', color: 'var(--color-text-muted)' }}>({port.type})</span>
                  {port.required && <span style={{ font: 'var(--font-helper)', color: '#ff453a' }}>*</span>}
                </div>
              ))}
            </div>
          )}
          {config.outputs.length > 0 && (
            <div>
              <label className="block" style={{ font: 'var(--font-tip)', color: 'var(--color-text-muted)', marginBottom: 6 }}>
                Outputs
              </label>
              {config.outputs.map((port) => (
                <div key={port.id} className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: `var(--color-port-${port.type})` }} />
                  <span style={{ font: 'var(--font-body-small)', color: 'var(--color-text-primary)' }}>{port.label}</span>
                  <span style={{ font: 'var(--font-helper)', color: 'var(--color-text-muted)' }}>({port.type})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Result preview */}
      {nodeState?.result && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <label className="block" style={{ font: 'var(--font-tip)', color: 'var(--color-text-muted)', marginBottom: 8 }}>
            Result
          </label>
          {Boolean((nodeState.result as Record<string, unknown>).image) && (
            <img
              src={(nodeState.result as Record<string, unknown>).image as string}
              alt="Result"
              className="w-full"
              style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
            />
          )}
          {Boolean((nodeState.result as Record<string, unknown>).video) && (
            <video
              src={(nodeState.result as Record<string, unknown>).video as string}
              controls
              className="w-full"
              style={{ borderRadius: 'var(--radius-sm)' }}
            />
          )}
          {Boolean((nodeState.result as Record<string, unknown>).text) && !Boolean((nodeState.result as Record<string, unknown>).image) && (
            <div
              className="break-words overflow-y-auto"
              style={{
                font: 'var(--font-body-small)',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                maxHeight: 120,
                backgroundColor: 'var(--color-surface-elevated)',
                color: 'var(--color-text-primary)',
              }}
            >
              {(nodeState.result as Record<string, unknown>).text as string}
            </div>
          )}
        </div>
      )}

      {/* Delete button */}
      <div style={{ padding: '16px' }}>
        <button
          onClick={() => { deleteNode(selectedNodeId); setSelectedNodeId(null); }}
          className="w-full transition-colors duration-150"
          style={{
            font: 'var(--font-label-small)',
            padding: '8px 0',
            borderRadius: 'var(--radius-sm)',
            color: '#ff453a',
            background: 'rgba(255, 69, 58, 0.06)',
            border: '1px solid rgba(255, 69, 58, 0.15)',
          }}
        >
          Delete Node
        </button>
      </div>
    </div>
  );
}
