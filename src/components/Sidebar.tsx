import { useState, useRef, useEffect, useCallback, type DragEvent } from 'react';
import {
  Type, ImageIcon, Eye, Plus, Minus, Save,
  Video, Music, Paintbrush, ArrowUpCircle, Upload,
  MessageSquare, Merge, Hash, StickyNote,
  FolderOpen, Settings,
} from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { useFlowStore } from '../store/flow-store';
import { NODE_CONFIGS } from '../nodes';
import { Tooltip } from './Tooltip';
import { usePopoverStore } from '../store/popover-store';

const ICON_MAP: Record<string, React.ReactNode> = {
  Type: <Type size={16} />,
  Image: <ImageIcon size={16} />,
  Eye: <Eye size={16} />,
  Video: <Video size={16} />,
  Music: <Music size={16} />,
  Paintbrush: <Paintbrush size={16} />,
  ArrowUpCircle: <ArrowUpCircle size={16} />,
  Upload: <Upload size={16} />,
  MessageSquare: <MessageSquare size={16} />,
  Merge: <Merge size={16} />,
  Hash: <Hash size={16} />,
  StickyNote: <StickyNote size={16} />,
};

const CATEGORIES = [
  { key: 'input', label: 'Input' },
  { key: 'ai', label: 'AI Models' },
  { key: 'utility', label: 'Utility' },
];

function onDragStart(event: DragEvent, nodeType: string) {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.effectAllowed = 'move';
}

export function Sidebar() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [query, setQuery] = useState('');

  const railRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const closePanel = useCallback(() => { setPanelOpen(false); setQuery(''); }, []);

  // Register with global popover store
  useEffect(() => {
    if (panelOpen) {
      usePopoverStore.getState().register('sidebar-panel', closePanel);
    } else {
      usePopoverStore.getState().unregister('sidebar-panel');
    }
  }, [panelOpen, closePanel]);

  // Close panel on click outside (without blocking drag events)
  useEffect(() => {
    if (!panelOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (railRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      closePanel();
    };
    const handleDragEnd = () => closePanel();
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('dragend', handleDragEnd);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('dragend', handleDragEnd);
    };
  }, [panelOpen, closePanel]);

  const HIDDEN_NODES = ['output', 'merge', 'number'];

  const filteredConfigs = Object.entries(NODE_CONFIGS).filter(
    ([type, c]) => !HIDDEN_NODES.includes(type) && (!query || c.label.toLowerCase().includes(query.toLowerCase()))
  );

  // Glass style matching all floating panels
  const glassStyle = {
    background: 'rgba(26, 26, 28, 0.50)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-lg)',
  };

  return (
    <>
      {/* Icon Rail — always in same position */}
      <div
        ref={railRef}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20"
        style={{ width: 48 }}
      >
        <div
          className="flex flex-col items-center gap-1"
          style={{
            padding: '10px 0',
            borderRadius: 'var(--radius-full)',
            ...glassStyle,
          }}
        >
          {/* Add node toggle */}
          <Tooltip content="Add Node" side="right">
            <button
              onClick={() => setPanelOpen(!panelOpen)}
              className="flex items-center justify-center transition-all duration-150"
              style={{
                width: 32,
                height: 32,
                marginBottom: 2,
                borderRadius: 14,
                background: 'var(--color-secondary-c200)',
                color: 'var(--color-secondary-c800)',
              }}
            >
              {panelOpen ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </Tooltip>

          <div style={{ width: 24, height: 1, margin: '4px 0', background: 'var(--color-border)' }} />

          {/* Category icons removed — plus button is the primary entry point */}

          <div className="flex-1" />

          {/* Save */}
          <Tooltip content="Save (⌘S)" side="right">
            <button
              onClick={() => {
                useFlowStore.getState().saveFlow();
                useAppStore.getState().addToast('Flow saved', 'success');
              }}
              className="flex items-center justify-center transition-all duration-150"
              style={{ width: 30, height: 30, borderRadius: 14, overflow: 'hidden', color: 'var(--color-secondary-c200)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Save size={15} />
            </button>
          </Tooltip>

          {/* Browse saved flows */}
          <Tooltip content="My Flows" side="right">
            <button
              onClick={() => useAppStore.getState().setFlowBrowserOpen(true)}
              className="flex items-center justify-center transition-all duration-150"
              style={{ width: 30, height: 30, borderRadius: 14, overflow: 'hidden', color: 'var(--color-secondary-c200)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <FolderOpen size={15} />
            </button>
          </Tooltip>

          {/* Settings */}
          <Tooltip content="Settings" side="right">
            <button
              onClick={() => useAppStore.getState().setSettingsOpen(true)}
              className="flex items-center justify-center transition-all duration-150"
              style={{ width: 30, height: 30, borderRadius: 14, overflow: 'hidden', color: 'var(--color-secondary-c200)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Settings size={16} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Expandable Panel — fixed position, aligned to rail's top */}
      {panelOpen && (
        <div
          ref={panelRef}
          className="fixed z-20 animate-slide-in flex flex-col"
          style={{
            left: 64,
            top: railRef.current ? railRef.current.getBoundingClientRect().top : '50%',
            width: 260,
            maxHeight: 'min(480px, calc(100vh - 140px))',
            borderRadius: 14,
            ...glassStyle,
          }}
        >
          {/* Node list */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '10px 8px' }}>
            {CATEGORIES.map((cat) => {
              const nodes = filteredConfigs.filter(([, c]) => c.category === cat.key);
              if (nodes.length === 0) return null;

              return (
                <div key={cat.key} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      font: 'var(--font-tiny-label)',
                      color: 'var(--color-secondary-c300)',
                      padding: '4px 8px 6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {cat.label}
                  </div>
                  {nodes.map(([type, config]) => (
                    <div
                      key={type}
                      className="flex items-center gap-3 cursor-pointer transition-colors duration-150"
                      style={{
                        padding: '8px 8px',
                        borderRadius: 14,
                        background: 'transparent',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-transparent-w10)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      draggable
                      onDragStart={(e) => onDragStart(e, type)}
                      onClick={() => {
                        // Add node to center of viewport on click
                        useFlowStore.getState().addNode(type, {
                          x: window.innerWidth / 2 - 130,
                          y: window.innerHeight / 2 - 40,
                        });
                        setPanelOpen(false);
                        setQuery('');
                      }}
                    >
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 20,
                          height: 20,
                          color: 'var(--color-secondary-c200)',
                        }}
                      >
                        {ICON_MAP[config.icon] || <span style={{ width: 16, height: 16 }} />}
                      </div>
                      <span style={{ font: 'var(--font-label-medium)', color: 'var(--color-text-primary)' }}>
                        {config.label}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
