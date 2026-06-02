import React from 'react';
import { Play, Trash2, Copy, Unplug } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { useFlowStore } from '../store/flow-store';
import { useExecutionStore } from '../store/execution-store';
import { NODE_CONFIGS } from '../nodes';
import { executeSubgraph } from '../engine/executor';
import { Tooltip } from './Tooltip';

export function NodeFloatingToolbar({ nodeId }: { nodeId: string }) {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const deleteNode = useFlowStore((s) => s.deleteNode);
  const addNode = useFlowStore((s) => s.addNode);
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId);

  const node = nodes.find((n) => n.id === nodeId);
  if (!node?.type) return null;

  const config = NODE_CONFIGS[node.type];
  if (!config) return null;

  const handleRun = async () => {
    const falApiKey = useAppStore.getState().falApiKey;
    if (!falApiKey) {
      useAppStore.getState().addToast('Set your fal.ai API key first', 'error');
      useAppStore.getState().setSettingsOpen(true);
      return;
    }
    const store = useExecutionStore.getState();
    const controller = new AbortController();
    store.setAbortController(controller);
    store.setIsRunning(true);
    try {
      await executeSubgraph(nodeId, nodes, edges, controller.signal);
    } finally {
      store.setIsRunning(false);
      store.setAbortController(null);
    }
  };

  const handleDuplicate = () => {
    if (!node) return;
    addNode(node.type!, { x: node.position.x + 40, y: node.position.y + 40 });
  };

  const handleDisconnect = () => {
    const connectedEdges = edges.filter((e) => e.source === nodeId || e.target === nodeId);
    if (connectedEdges.length === 0) return;
    useFlowStore.getState().onEdgesChange(
      connectedEdges.map((e) => ({ id: e.id, type: 'remove' as const }))
    );
  };

  const hasConnections = edges.some((e) => e.source === nodeId || e.target === nodeId);

  // Can this node be run? It needs to be an AI node with at least one input connection
  const canRun = config.category !== 'utility' && hasConnections;

  const handleDelete = () => {
    deleteNode(nodeId);
    setSelectedNodeId(null);
  };

  const btnBase: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 14,
    color: 'var(--color-secondary-c200)',
    background: 'transparent',
  };

  const hoverIn = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-transparent-w10)'; };
  const hoverOut = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; };

  return (
    <div
      className="absolute nodrag nopan"
      style={{
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: 8,
        zIndex: 10,
      }}
    >
      <div
        className="flex items-center gap-1 animate-slide-up"
        style={{
          padding: '4px 6px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(26, 26, 28, 0.50)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Run */}
        {config.category === 'ai' && (
          <Tooltip content="Run node" side="top">
            <button
              onClick={handleRun}
              className="flex items-center justify-center transition-colors duration-150"
              style={btnBase}
              onMouseEnter={hoverIn}
              onMouseLeave={hoverOut}
            >
              <Play size={14} fill="currentColor" style={{ color: canRun ? '#b196ff' : 'var(--color-secondary-c400)', filter: canRun ? 'drop-shadow(0 0 4px rgba(177, 150, 255, 0.4))' : 'none' }} />
            </button>
          </Tooltip>
        )}

        {/* Duplicate */}
        <Tooltip content="Duplicate" side="top">
          <button
            onClick={handleDuplicate}
            className="flex items-center justify-center transition-colors duration-150"
            style={btnBase}
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
          >
            <Copy size={14} />
          </button>
        </Tooltip>

        {/* Disconnect */}
        {hasConnections && (
          <Tooltip content="Disconnect" side="top">
            <button
              onClick={handleDisconnect}
              className="flex items-center justify-center transition-colors duration-150"
              style={btnBase}
              onMouseEnter={hoverIn}
              onMouseLeave={hoverOut}
            >
              <Unplug size={14} />
            </button>
          </Tooltip>
        )}

        <div style={{ width: 1, height: 16, background: 'var(--color-border)' }} />

        {/* Delete */}
        <Tooltip content="Delete" side="top">
          <button
            onClick={handleDelete}
            className="flex items-center justify-center transition-colors duration-150"
            style={{ ...btnBase, color: '#ff6961' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,69,58,0.1)'; }}
            onMouseLeave={hoverOut}
          >
            <Trash2 size={14} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
