import { useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Copy, Trash2, Maximize2 } from 'lucide-react';
import { NODE_CONFIGS } from '../nodes';
import { CATEGORY_COLORS } from '../engine/types';
import { useFlowStore } from '../store/flow-store';

interface ContextMenuProps {
  x: number;
  y: number;
  type: 'pane' | 'node';
  nodeId?: string;
  onClose: () => void;
  onAddNode: (type: string, position: { x: number; y: number }) => void;
}

const CATEGORIES = [
  { key: 'input', label: 'Input' },
  { key: 'ai', label: 'AI Models' },
  { key: 'output', label: 'Output' },
  { key: 'utility', label: 'Utility' },
];

export function ContextMenu({ x, y, type, nodeId, onClose, onAddNode }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();
  const deleteNode = useFlowStore((s) => s.deleteNode);
  const { nodes } = useFlowStore();
  const addNode = useFlowStore((s) => s.addNode);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 1000,
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 0',
    minWidth: 180,
    boxShadow: 'var(--shadow-xl)',
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    font: 'var(--font-body-small)',
    cursor: 'pointer',
    color: 'var(--color-text-primary)',
  };

  const separatorStyle: React.CSSProperties = {
    height: 1,
    margin: '6px 0',
    backgroundColor: 'var(--color-border)',
  };

  const handleItemHover = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
  };

  const handleItemLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  if (type === 'node' && nodeId) {
    return (
      <div ref={ref} style={menuStyle}>
        <div
          style={itemStyle}
          onMouseEnter={handleItemHover}
          onMouseLeave={handleItemLeave}
          onClick={() => {
            // Duplicate the node
            const node = nodes.find((n) => n.id === nodeId);
            if (node?.type) {
              addNode(node.type, { x: node.position.x + 40, y: node.position.y + 40 });
            }
            onClose();
          }}
        >
          <Copy size={14} style={{ color: 'var(--color-text-secondary)' }} />
          Duplicate
        </div>
        <div style={separatorStyle} />
        <div
          style={{ ...itemStyle, color: '#ff453a' }}
          onMouseEnter={handleItemHover}
          onMouseLeave={handleItemLeave}
          onClick={() => {
            deleteNode(nodeId);
            onClose();
          }}
        >
          <Trash2 size={14} />
          Delete
        </div>
      </div>
    );
  }

  // Pane context menu — add nodes
  return (
    <div ref={ref} style={menuStyle}>
      <div style={{ padding: '8px 14px 4px', font: 'var(--font-tiny-label)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Add Node
      </div>
      {CATEGORIES.map((cat) => {
        const nodeEntries = Object.entries(NODE_CONFIGS).filter(([, c]) => c.category === cat.key);
        if (nodeEntries.length === 0) return null;

        return (
          <div key={cat.key}>
            <div style={{ padding: '8px 14px 4px', font: 'var(--font-tiny-label)', color: CATEGORY_COLORS[cat.key] }}>
              {cat.label}
            </div>
            {nodeEntries.map(([nodeType, config]) => (
              <div
                key={nodeType}
                style={itemStyle}
                onMouseEnter={handleItemHover}
                onMouseLeave={handleItemLeave}
                onClick={() => {
                  onAddNode(nodeType, { x, y });
                  onClose();
                }}
              >
                {config.label}
              </div>
            ))}
          </div>
        );
      })}
      <div style={separatorStyle} />
      <div
        style={itemStyle}
        onMouseEnter={handleItemHover}
        onMouseLeave={handleItemLeave}
        onClick={() => {
          fitView({ duration: 300 });
          onClose();
        }}
      >
        <Maximize2 size={14} style={{ color: 'var(--color-text-secondary)' }} />
        Fit View
      </div>
    </div>
  );
}
