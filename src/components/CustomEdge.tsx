import { useState, useCallback, useMemo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import { Plus, X } from 'lucide-react';
import { type PortType } from '../engine/types';
import { useFlowStore } from '../store/flow-store';
import { QuickAddMenu } from './QuickAddMenu';

const EDGE_COLOR = '#636366';

export function CustomEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const portType = (data?.portType as PortType) || 'any';

  const [hovered, setHovered] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const insertNodeOnEdge = useFlowStore((s) => s.insertNodeOnEdge);
  const deleteEdge = useFlowStore((s) => s.deleteEdge);

  // Check if either connected node is selected
  const nodeSelected = useFlowStore((s) =>
    s.nodes.some((n) => n.selected && (n.id === source || n.id === target))
  );

  const handlePlusClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuPos({ x: e.clientX + 12, y: e.clientY - 20 });
  }, []);

  const handleSelect = useCallback((nodeType: string, _targetHandle: string) => {
    const midX = (sourceX + targetX) / 2 - 130;
    const midY = (sourceY + targetY) / 2 - 40;
    insertNodeOnEdge(id, nodeType, { x: midX, y: midY });
    setMenuPos(null);
  }, [id, sourceX, sourceY, targetX, targetY, insertNodeOnEdge]);

  const isActive = hovered || selected || nodeSelected;

  // Constant speed: 150px per second
  const dotDuration = useMemo(() => {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const approxLen = Math.sqrt(dx * dx + dy * dy) * 1.4; // bezier is ~1.4x straight line
    return `${Math.max(0.3, approxLen / 500)}s`;
  }, [sourceX, sourceY, targetX, targetY]);

  return (
    <>
      {/* Fat invisible hover path */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ pointerEvents: 'stroke' }}
      />

      {/* Main edge — always solid, thin, subtle */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: EDGE_COLOR,
          strokeWidth: 1.5,
          opacity: selected ? 0.9 : hovered ? 0.6 : 0.35,
          strokeDasharray: 'none',
        }}
      />

      {/* Moving dot on hover/selected */}
      {isActive && (
        <>
          <defs>
            <radialGradient id={`glow-${id}`}>
              <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>
          {/* Outer glow */}
          <ellipse rx={14} ry={6} fill={`url(#glow-${id})`}>
            <animateMotion dur={dotDuration} repeatCount="indefinite" path={edgePath} rotate="auto" />
          </ellipse>
          {/* Core dot */}
          <ellipse rx={4} ry={2} fill="rgba(255,255,255,0.8)">
            <animateMotion dur={dotDuration} repeatCount="indefinite" path={edgePath} rotate="auto" />
          </ellipse>
        </>
      )}

      {/* Edge action pill at midpoint: [+] [×] */}
      <EdgeLabelRenderer>
        {hovered && !menuPos && (
          <div
            className="nodrag nopan"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              position: 'absolute',
              left: labelX,
              top: labelY,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'all',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              background: 'rgba(26, 26, 28, 0.92)',
              backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(255,255,255,0.12)',
              borderRadius: 20,
              padding: '2px 4px',
              animation: 'fade-in 0.1s ease-out',
            }}
          >
            {/* Insert node */}
            <button
              onClick={handlePlusClick}
              title="Insert node"
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-secondary-c200)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <Plus size={11} strokeWidth={2.5} />
            </button>

            {/* Divider */}
            <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

            {/* Disconnect */}
            <button
              onClick={(e) => { e.stopPropagation(); deleteEdge(id); }}
              title="Disconnect"
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: '#ff453a',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </EdgeLabelRenderer>

      {/* Quick add menu */}
      {menuPos && (
        <EdgeLabelRenderer>
          <div style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'all' }}>
            <QuickAddMenu
              x={menuPos.x}
              y={menuPos.y}
              sourcePortType={portType}
              onSelect={handleSelect}
              onClose={() => setMenuPos(null)}
            />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
