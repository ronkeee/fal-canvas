import { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import {
  Type, ImageIcon, Eye, Video, Music, Paintbrush,
  ArrowUpCircle, Upload, MessageSquare, Merge, Hash, StickyNote, Scissors,
} from 'lucide-react';
import { NODE_CONFIGS } from '../nodes';
import {
  getCompatibleNodeTypes,
  getNodesWithCompatibleOutput,
  findCompatibleInputHandle,
  findCompatibleOutputHandle,
} from '../utils/compatibility';
import type { PortType } from '../engine/types';
import { usePopoverStore } from '../store/popover-store';

const ICON_MAP: Record<string, React.ReactNode> = {
  Type: <Type size={15} />,
  Image: <ImageIcon size={15} />,
  Eye: <Eye size={15} />,
  Video: <Video size={15} />,
  Music: <Music size={15} />,
  Paintbrush: <Paintbrush size={15} />,
  ArrowUpCircle: <ArrowUpCircle size={15} />,
  Upload: <Upload size={15} />,
  MessageSquare: <MessageSquare size={15} />,
  Merge: <Merge size={15} />,
  Hash: <Hash size={15} />,
  StickyNote: <StickyNote size={15} />,
  Scissors: <Scissors size={15} />,
};

// Nodes to never show in quick-add menus
const HIDDEN_NODES = new Set(['output', 'number', 'note']);

interface QuickAddMenuProps {
  x: number;
  y: number;
  /** The port type we're connecting from/to */
  sourcePortType: PortType;
  /** 'right' = new node receives from us, 'left' = new node sends to us */
  direction?: 'left' | 'right';
  /** (nodeType, handleId) — handleId is the port on the NEW node to connect */
  onSelect: (nodeType: string, handleId: string) => void;
  onClose: () => void;
}

export function QuickAddMenu({ x, y, sourcePortType, direction = 'right', onSelect, onClose }: QuickAddMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    usePopoverStore.getState().register(`quick-add-${menuId}`, onClose);
    return () => usePopoverStore.getState().unregister(`quick-add-${menuId}`);
  }, [menuId, onClose]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) onClose();
    };
    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Filter compatible nodes based on direction
  const compatibleTypes = direction === 'right'
    ? getCompatibleNodeTypes(sourcePortType)      // nodes that accept my output
    : getNodesWithCompatibleOutput(sourcePortType); // nodes that can send to my input

  // Remove hidden nodes
  const filteredTypes = compatibleTypes.filter((t) => !HIDDEN_NODES.has(t));

  // Group by category
  const categories = [
    { key: 'input', label: 'Input' },
    { key: 'ai', label: 'AI Models' },
    { key: 'utility', label: 'Utility' },
  ];

  const grouped = categories
    .map((cat) => ({
      ...cat,
      nodes: filteredTypes
        .filter((type) => NODE_CONFIGS[type]?.category === cat.key)
        .map((type) => ({ type, config: NODE_CONFIGS[type] })),
    }))
    .filter((cat) => cat.nodes.length > 0);

  // Clamp position to viewport
  const menuWidth = 220;
  const menuHeight = 300;
  const clampedX = Math.min(x, window.innerWidth - menuWidth - 16);
  const clampedY = Math.min(y, window.innerHeight - menuHeight - 16);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] animate-slide-up"
      style={{
        left: clampedX,
        top: clampedY,
        width: menuWidth,
        maxHeight: menuHeight,
        overflowY: 'auto',
        borderRadius: 14,
        background: 'rgba(26, 26, 28, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-xl)',
        padding: '8px',
      }}
    >
      {grouped.map((cat) => (
        <div key={cat.key} style={{ marginBottom: 8 }}>
          <div
            style={{
              font: 'var(--font-tiny-label)',
              color: 'var(--color-secondary-c300)',
              padding: '4px 8px 4px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {cat.label}
          </div>
          {cat.nodes.map(({ type, config }) => {
            // Determine which handle on the NEW node to connect
            const handle = direction === 'right'
              ? findCompatibleInputHandle(type, sourcePortType) || config.inputs[0]?.id || 'default'
              : findCompatibleOutputHandle(type, sourcePortType) || config.outputs[0]?.id || '';

            return (
              <button
                key={type}
                className="flex items-center gap-3 w-full text-left transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)]"
                style={{ padding: '7px 8px', borderRadius: 10 }}
                onClick={() => { onSelect(type, handle); onClose(); }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 18, height: 18, color: 'var(--color-secondary-c200)' }}
                >
                  {ICON_MAP[config.icon] || null}
                </div>
                <span style={{ font: 'var(--font-label-small)', color: 'var(--color-text-primary)' }}>
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>
      ))}
      {grouped.length === 0 && (
        <div style={{ padding: '16px 8px', font: 'var(--font-body-small)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          No compatible nodes
        </div>
      )}
    </div>,
    document.body
  );
}
