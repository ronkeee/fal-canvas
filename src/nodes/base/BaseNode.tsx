import React, { useState, useCallback, useRef, type ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Plus, Unplug } from 'lucide-react';
import { useExecutionStore } from '../../store/execution-store';
import { useFlowStore } from '../../store/flow-store';
import { useAppStore } from '../../store/app-store';
import { CATEGORY_COLORS, STATUS_COLORS, type PortDef, type NodeExecutionStatus } from '../../engine/types';
import { NodeFloatingToolbar } from '../../components/NodeToolbar';
import { QuickAddMenu } from '../../components/QuickAddMenu';

interface BaseNodeProps {
  id: string;
  label: string;
  category: 'input' | 'ai' | 'output' | 'utility';
  icon: ReactNode;
  inputs?: PortDef[];
  outputs?: PortDef[];
  children: ReactNode;
  selected?: boolean;
  width?: number;
  resizable?: boolean;
}

function StatusIndicator({ status, error }: { status: NodeExecutionStatus; error?: string }) {
  const color = STATUS_COLORS[status];
  if (status === 'idle') return null;

  const labels: Record<string, string> = {
    pending: 'Pending…',
    queued: 'In queue…',
    running: 'Running…',
    completed: 'Completed',
    error: error ? `Error: ${error.slice(0, 120)}` : 'Error',
  };

  return (
    <div
      className="relative flex items-center justify-center nodrag"
      style={{ width: 10, height: 10 }}
      title={labels[status] || status}
    >
      {status === 'running' && (
        <div
          className="absolute rounded-full animate-ping opacity-40"
          style={{ width: 8, height: 8, backgroundColor: color }}
        />
      )}
      <div
        className="rounded-full"
        style={{ width: 6, height: 6, backgroundColor: color }}
      />
    </div>
  );
}

type Direction = 'top' | 'right' | 'bottom' | 'left';

const DIRECTION_STYLES: Record<Direction, React.CSSProperties> = {
  top: { left: '50%', top: -30, transform: 'translateX(-50%)' },
  right: { right: -30, top: '50%', transform: 'translateY(-50%)' },
  bottom: { left: '50%', bottom: -30, transform: 'translateX(-50%)' },
  left: { left: -30, top: '50%', transform: 'translateY(-50%)' },
};

/** Plus button that appears on each side of the node on hover */
function DirectionPlusButton({
  nodeId: _nodeId,
  direction,
  onMenuOpen,
}: {
  nodeId: string;
  direction: Direction;
  onMenuOpen: (dir: Direction, pos: { x: number; y: number }) => void;
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onMenuOpen(direction, { x: e.clientX, y: e.clientY });
    },
    [direction, onMenuOpen]
  );

  return (
    <button
      className="absolute nodrag nopan flex items-center justify-center"
      onClick={handleClick}
      style={{
        ...DIRECTION_STYLES[direction],
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: 'rgba(26, 26, 28, 0.9)',
        backdropFilter: 'blur(8px)',
        border: '1.5px solid rgba(255,255,255,0.15)',
        color: 'var(--color-secondary-c200)',
        cursor: 'pointer',
        animation: 'fade-in 0.12s ease-out',
        zIndex: 5,
      }}
    >
      <Plus size={11} strokeWidth={2.5} />
    </button>
  );
}

export function BaseNode({ id, label, category, icon, inputs = [], outputs = [], children, selected, width, resizable = false }: BaseNodeProps) {
  const nodeState = useExecutionStore((s) => s.nodeStates[id]);
  const status: NodeExecutionStatus = nodeState?.status || 'idle';
  const catColor = CATEGORY_COLORS[category];
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const isSelected = selected || selectedNodeId === id;
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const nodeData = useFlowStore((s) => s.nodes.find((n) => n.id === id)?.data);

  const [hovered, setHovered] = useState(false);
  const [menuState, setMenuState] = useState<{ dir: Direction; pos: { x: number; y: number } } | null>(null);
  const menuStateRef = useRef(menuState);
  menuStateRef.current = menuState;
  const addNodeAndConnect = useFlowStore((s) => s.addNodeAndConnect);
  const disconnectPort = useFlowStore((s) => s.disconnectPort);
  const edges = useFlowStore((s) => s.edges);
  const [hoveredPortId, setHoveredPortId] = useState<string | null>(null);
  const portHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enterPort = useCallback((portKey: string) => {
    if (portHideTimerRef.current) { clearTimeout(portHideTimerRef.current); portHideTimerRef.current = null; }
    setHoveredPortId(portKey);
  }, []);

  const leavePort = useCallback(() => {
    portHideTimerRef.current = setTimeout(() => setHoveredPortId(null), 2000);
  }, []);

  // Resizable node dimensions — only for nodes with resizable=true
  const defaultW = width || 264;
  const nodeW = resizable ? ((nodeData?._nodeWidth as number) || defaultW) : defaultW;
  const nodeH = resizable ? ((nodeData?._nodeHeight as number) || undefined) : undefined;
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: nodeW, startH: rect.height };

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const dw = ev.clientX - resizeRef.current.startX;
      const dh = ev.clientY - resizeRef.current.startY;
      const newW = Math.max(200, resizeRef.current.startW + dw);
      const newH = Math.max(100, resizeRef.current.startH + dh);
      updateNodeData(id, { _nodeWidth: newW, _nodeHeight: newH });
    };

    const onMouseUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [id, nodeW, updateNodeData]);

  const handleMenuOpen = useCallback((dir: Direction, pos: { x: number; y: number }) => {
    setMenuState({ dir, pos });
  }, []);

  const handleNodeSelect = useCallback(
    (nodeType: string, handleId: string) => {
      const currentMenu = menuStateRef.current;
      const nodes = useFlowStore.getState().nodes;
      const sourceNode = nodes.find((n) => n.id === id);
      if (!sourceNode) return;

      const dir = currentMenu?.dir || 'right';
      const newPosition = { x: sourceNode.position.x, y: sourceNode.position.y };

      if (dir === 'right') {
        newPosition.x += 380;
        // Right plus: this node's output → new node's input
        const myOutputHandle = outputs[0]?.id || '';
        addNodeAndConnect(nodeType, newPosition, id, myOutputHandle, handleId);
      } else {
        newPosition.x -= 380;
        // Left plus: new node's output → this node's input
        // handleId here is the output handle on the NEW node
        // We need to connect: newNode.output → thisNode.input
        const myInputHandle = inputs[0]?.id || '';
        // addNodeAndConnect expects (type, pos, sourceNodeId, sourceHandle, targetHandle)
        // For left: the new node is the source, this node is the target
        // We pass a special flag by using negative nodeId convention
        addNodeAndConnect(nodeType, newPosition, id, handleId, myInputHandle, dir as 'left' | 'right');
      }
      setMenuState(null);
    },
    [id, outputs, inputs, addNodeAndConnect]
  );

  // Determine port type for quick add menu filtering based on direction
  const primaryOutputType = outputs[0]?.type || 'any';
  const primaryInputType = inputs[0]?.type || 'any';

  return (
    <div
      className="relative"
      style={resizable ? { width: nodeW, minWidth: 200 } : { minWidth: defaultW, maxWidth: defaultW + 40 }}
      onMouseEnter={() => {
        if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
        setHovered(true);
      }}
      onMouseLeave={() => {
        if (!menuState) {
          hoverTimerRef.current = setTimeout(() => setHovered(false), 500);
        }
      }}
    >
      {/* Floating toolbar above node when selected */}
      {isSelected && <NodeFloatingToolbar nodeId={id} />}

      {/* Plus buttons: only show if the node has ports on that side */}
      {(hovered || menuState || isSelected) && (
        <>
          {outputs.length > 0 && (
            <DirectionPlusButton nodeId={id} direction="right" onMenuOpen={handleMenuOpen} />
          )}
          {inputs.length > 0 && (
            <DirectionPlusButton nodeId={id} direction="left" onMenuOpen={handleMenuOpen} />
          )}
        </>
      )}

      {/* Port labels — left (inputs) */}
      {inputs.map((port, i) => (
        <div
          key={`label-in-${port.id}`}
          className="absolute font-medium pointer-events-none"
          style={{
            left: -4,
            top: `${56 + i * 32}px`,
            transform: 'translateX(-100%) translateY(-50%)',
            color: 'var(--color-text-muted)',
            paddingRight: 8,
            whiteSpace: 'nowrap',
            font: 'var(--font-tip)',
          }}
        >
          {port.label}{port.required ? '*' : ''}
        </div>
      ))}

      {/* Port labels — right (outputs) */}
      {outputs.map((port, i) => (
        <div
          key={`label-out-${port.id}`}
          className="absolute font-medium pointer-events-none"
          style={{
            right: -4,
            top: `${56 + i * 32}px`,
            transform: 'translateX(100%) translateY(-50%)',
            color: 'var(--color-text-muted)',
            paddingLeft: 8,
            whiteSpace: 'nowrap',
            font: 'var(--font-tip)',
          }}
        >
          {port.label}
        </div>
      ))}

      {/* Node card */}
      <div
        ref={cardRef}
        className="overflow-hidden transition-colors duration-150 flex flex-col"
        style={{
          borderRadius: 'var(--radius-md)',
          background: '#171718',
          border: isSelected
            ? '1px solid rgba(255,255,255,0.3)'
            : '1px solid var(--color-border)',
          boxShadow: isSelected
            ? '0 0 0 1px rgba(255,255,255,0.08), var(--shadow-lg)'
            : 'var(--shadow-md)',
          ...(nodeH ? { height: nodeH } : {}),
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2"
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <span style={{ color: 'var(--color-secondary-c150)' }}>{icon}</span>
          <span className="flex-1 truncate" style={{ font: 'var(--font-label-small)', color: 'var(--color-text-primary)' }}>
            {label}
          </span>

          <StatusIndicator status={status} error={nodeState?.error} />
        </div>

        {/* Progress bar */}
        {(status === 'running' || status === 'queued') && (
          <div style={{ height: 2, background: 'var(--color-surface)' }}>
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: nodeState?.progress != null ? `${Math.min(nodeState.progress * 100, 100)}%` : '30%',
                background: `linear-gradient(90deg, ${STATUS_COLORS[status]}, ${catColor})`,
                ...(nodeState?.progress == null ? { animation: 'indeterminate 1.5s ease-in-out infinite' } : {}),
              }}
            />
          </div>
        )}

        {/* Body */}
        <div className="flex flex-col flex-1 min-h-0" style={{ padding: 12 }}>
          {children}

          {/* Error */}
          {status === 'error' && nodeState?.error && (
            <div
              className="break-words nodrag"
              style={{
                marginTop: 8,
                font: 'var(--font-helper)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
                background: 'rgba(255, 69, 58, 0.08)',
                border: '1px solid rgba(255, 69, 58, 0.2)',
                color: '#ff6961',
                maxHeight: 120,
                overflowY: 'auto',
                lineHeight: 1.5,
                userSelect: 'text',
              }}
            >
              {nodeState.error}
            </div>
          )}

          {/* Execution time */}
          {status === 'completed' && nodeState?.startedAt && nodeState?.completedAt && (
            <div style={{ marginTop: 8, font: 'var(--font-helper)', textAlign: 'right', color: 'var(--color-text-muted)' }}>
              {((nodeState.completedAt - nodeState.startedAt) / 1000).toFixed(1)}s
            </div>
          )}
        </div>

        {/* Resize handle — bottom-right corner (only for resizable nodes) */}
        {resizable && (
          <div
            className="absolute nodrag nopan"
            onMouseDown={onResizeStart}
            style={{
              right: 2,
              bottom: 2,
              width: 14,
              height: 14,
              cursor: 'nwse-resize',
              opacity: hovered || isSelected ? 0.4 : 0,
              transition: 'opacity 150ms',
              backgroundImage: `linear-gradient(135deg, transparent 50%, var(--color-text-muted) 50%, var(--color-text-muted) 55%, transparent 55%, transparent 70%, var(--color-text-muted) 70%, var(--color-text-muted) 75%, transparent 75%)`,
            }}
          />
        )}
      </div>

      {/* Input handles */}
      {inputs.map((port, i) => {
        const isConnected = edges.some((e) => e.target === id && e.targetHandle === port.id);
        const isHovered = hoveredPortId === `in-${port.id}`;
        const top = `${56 + i * 32}px`;
        return (
          <React.Fragment key={port.id}>
            <Handle
              type="target"
              position={Position.Left}
              id={port.id}
              style={{ top, width: 10, height: 10, backgroundColor: 'var(--color-surface-elevated)', borderColor: '#636366', borderWidth: 2 }}
              title={`${port.label} (${port.type})`}
              onMouseEnter={() => enterPort(`in-${port.id}`)}
              onMouseLeave={leavePort}
            />
            {isConnected && isHovered && (
              <button
                className="nodrag nopan"
                onMouseEnter={() => enterPort(`in-${port.id}`)}
                onMouseLeave={leavePort}
                onClick={(e) => { e.stopPropagation(); disconnectPort(id, port.id, 'input'); }}
                title={`Disconnect ${port.label}`}
                style={{
                  position: 'absolute', top, left: -28, transform: 'translateY(-50%)',
                  width: 18, height: 18, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(26,26,28,0.95)', border: '1.5px solid rgba(255,69,58,0.5)',
                  color: '#ff453a', cursor: 'pointer', padding: 0, pointerEvents: 'all', zIndex: 10,
                  animation: 'fade-in 0.1s ease-out',
                }}
              >
                <Unplug size={10} strokeWidth={2} />
              </button>
            )}
          </React.Fragment>
        );
      })}

      {/* Output handles */}
      {outputs.map((port, i) => {
        const isConnected = edges.some((e) => e.source === id && e.sourceHandle === port.id);
        const isHovered = hoveredPortId === `out-${port.id}`;
        const top = `${56 + i * 32}px`;
        return (
          <React.Fragment key={port.id}>
            <Handle
              type="source"
              position={Position.Right}
              id={port.id}
              style={{ top, width: 10, height: 10, backgroundColor: '#636366', borderColor: '#636366', borderWidth: 2 }}
              title={`${port.label} (${port.type})`}
              onMouseEnter={() => enterPort(`out-${port.id}`)}
              onMouseLeave={leavePort}
            />
            {isConnected && isHovered && (
              <button
                className="nodrag nopan"
                onMouseEnter={() => enterPort(`out-${port.id}`)}
                onMouseLeave={leavePort}
                onClick={(e) => { e.stopPropagation(); disconnectPort(id, port.id, 'output'); }}
                title={`Disconnect ${port.label}`}
                style={{
                  position: 'absolute', top, right: -28, transform: 'translateY(-50%)',
                  width: 18, height: 18, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(26,26,28,0.95)', border: '1.5px solid rgba(255,69,58,0.5)',
                  color: '#ff453a', cursor: 'pointer', padding: 0, pointerEvents: 'all', zIndex: 10,
                  animation: 'fade-in 0.1s ease-out',
                }}
              >
                <Unplug size={10} strokeWidth={2} />
              </button>
            )}
          </React.Fragment>
        );
      })}

      {/* Quick add menu from directional plus */}
      {menuState && (
        <QuickAddMenu
          x={menuState.pos.x + 12}
          y={menuState.pos.y - 20}
          sourcePortType={menuState.dir === 'left' ? primaryInputType : primaryOutputType}
          direction={menuState.dir === 'left' ? 'left' : 'right'}
          onSelect={handleNodeSelect}
          onClose={() => { setMenuState(null); setHovered(false); }}
        />
      )}
    </div>
  );
}
