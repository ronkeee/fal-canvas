import { useState, useEffect, useCallback } from 'react';
import { MousePointer2, Hand, ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, Grid3x3 } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useHistoryStore } from '../store/history-store';
import { beginSnapshotRestore, endSnapshotRestore } from '../store/flow-store';
import { useAppStore, type BgStyle } from '../store/app-store';
import { Tooltip } from './Tooltip';
import { usePopoverStore } from '../store/popover-store';

const BG_OPTIONS: { key: BgStyle; label: string; preview: React.ReactNode }[] = [
  {
    key: 'fine',
    label: 'Fine dots',
    preview: (
      <svg width={20} height={20} viewBox="0 0 20 20">
        {[4, 10, 16].map(x => [4, 10, 16].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={0.8} fill="rgba(255,255,255,0.5)" />
        )))}
      </svg>
    ),
  },
  {
    key: 'coarse',
    label: 'Coarse dots',
    preview: (
      <svg width={20} height={20} viewBox="0 0 20 20">
        {[5, 15].map(x => [5, 15].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={1.5} fill="rgba(255,255,255,0.3)" />
        )))}
      </svg>
    ),
  },
  {
    key: 'cross',
    label: 'Crosshatch',
    preview: (
      <svg width={20} height={20} viewBox="0 0 20 20">
        {[5, 15].map(x => [5, 15].map(y => (
          <g key={`${x}-${y}`}>
            <line x1={x - 2} y1={y} x2={x + 2} y2={y} stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} />
            <line x1={x} y1={y - 2} x2={x} y2={y + 2} stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} />
          </g>
        )))}
      </svg>
    ),
  },
];

export function BottomToolbar() {
  const { zoomIn, zoomOut, fitView, getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const canUndo = useHistoryStore((s) => s.undoStack.length > 0);
  const canRedo = useHistoryStore((s) => s.redoStack.length > 0);
  const bgStyle = useAppStore((s) => s.bgStyle);
  const setBgStyle = useAppStore((s) => s.setBgStyle);
  const [bgPickerOpen, setBgPickerOpen] = useState(false);

  const closePicker = useCallback(() => setBgPickerOpen(false), []);

  useEffect(() => {
    if (bgPickerOpen) {
      usePopoverStore.getState().register('bg-picker', closePicker);
    } else {
      usePopoverStore.getState().unregister('bg-picker');
    }
  }, [bgPickerOpen, closePicker]);

  const handleUndo = () => {
    const snapshot = useHistoryStore.getState().undo({ nodes: getNodes(), edges: getEdges() });
    if (snapshot) { beginSnapshotRestore(); setNodes(snapshot.nodes); setEdges(snapshot.edges); endSnapshotRestore(); }
  };

  const handleRedo = () => {
    const snapshot = useHistoryStore.getState().redo({ nodes: getNodes(), edges: getEdges() });
    if (snapshot) { beginSnapshotRestore(); setNodes(snapshot.nodes); setEdges(snapshot.edges); endSnapshotRestore(); }
  };

  const Btn = ({ onClick, title, disabled, active, children }: {
    onClick?: () => void; title: string; disabled?: boolean; active?: boolean; children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="flex items-center justify-center rounded-lg transition-colors duration-150"
      style={{
        width: 36,
        height: 36,
        color: active ? 'var(--color-text-primary)' : disabled ? 'var(--color-text-muted)' : 'var(--color-secondary-c200)',
        background: active ? 'var(--color-transparent-w10)' : 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = 'var(--color-transparent-w10)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 animate-slide-up">
      {/* Background picker popup */}
      {bgPickerOpen && (
        <>
          <div className="fixed inset-0" onClick={() => setBgPickerOpen(false)} />
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 animate-slide-up"
            style={{
              marginBottom: 6,
              background: 'rgba(26, 26, 28, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--color-border)',
              borderRadius: 14,
              padding: 6,
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="flex items-center gap-1">
              {BG_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setBgStyle(opt.key); setBgPickerOpen(false); }}
                  className="flex flex-col items-center gap-1.5 transition-colors duration-150"
                  style={{
                    width: 80,
                    padding: '8px 6px',
                    borderRadius: 10,
                    background: bgStyle === opt.key ? 'var(--color-transparent-w10)' : 'transparent',
                    border: bgStyle === opt.key ? '1px solid var(--color-border)' : '1px solid transparent',
                  }}
                  onMouseEnter={(e) => { if (bgStyle !== opt.key) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={(e) => { if (bgStyle !== opt.key) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: bgStyle === opt.key ? 1 : 0.5 }}>{opt.preview}</div>
                  <span style={{ font: 'var(--font-tiny-label)', color: bgStyle === opt.key ? 'var(--color-text-primary)' : 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div
        className="flex items-center gap-1"
        style={{
          padding: '4px 8px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(26, 26, 28, 0.50)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <Tooltip content="Select (V)" side="top"><div><Btn title="Select (V)"><MousePointer2 size={16} /></Btn></div></Tooltip>
        <Tooltip content="Pan (Space)" side="top"><div><Btn title="Pan (Space)"><Hand size={16} /></Btn></div></Tooltip>

        <div style={{ width: 1, height: 16, margin: '0 4px', background: 'var(--color-border)' }} />

        <Tooltip content="Zoom In" side="top"><div><Btn onClick={() => zoomIn({ duration: 200 })} title="Zoom In (+)"><ZoomIn size={16} /></Btn></div></Tooltip>
        <Tooltip content="Zoom Out" side="top"><div><Btn onClick={() => zoomOut({ duration: 200 })} title="Zoom Out (-)"><ZoomOut size={16} /></Btn></div></Tooltip>
        <Tooltip content="Fit View" side="top"><div><Btn onClick={() => fitView({ duration: 300 })} title="Fit View"><Maximize2 size={16} /></Btn></div></Tooltip>

        <div style={{ width: 1, height: 16, margin: '0 4px', background: 'var(--color-border)' }} />

        <Tooltip content="Undo (⌘Z)" side="top"><div><Btn onClick={handleUndo} title="Undo (⌘Z)" disabled={!canUndo}><Undo2 size={16} /></Btn></div></Tooltip>
        <Tooltip content="Redo (⌘⇧Z)" side="top"><div><Btn onClick={handleRedo} title="Redo (⌘⇧Z)" disabled={!canRedo}><Redo2 size={16} /></Btn></div></Tooltip>

        <div style={{ width: 1, height: 16, margin: '0 4px', background: 'var(--color-border)' }} />

        <Tooltip content="Grid style" side="top">
          <div>
            <Btn onClick={() => setBgPickerOpen(!bgPickerOpen)} title="Grid style" active={bgPickerOpen}>
              <Grid3x3 size={16} />
            </Btn>
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
