import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Square, Loader2, Download, AlertTriangle, FilePlus2, Copy, Pencil, Settings, ChevronDown } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { useExecutionStore } from '../store/execution-store';
import { useFlowStore } from '../store/flow-store';
import { executeFlow } from '../engine/executor';
import { analyzeFlow } from '../engine/flow-analyzer';
import type { FlowAnalysis } from '../engine/types';

function fmtTime(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return r > 0 ? `${m}m ${r}s` : `${m}m`;
}

function fmtCost(cents: number): string {
  if (cents < 1) return '<$0.01';
  return `$${(cents / 100).toFixed(2)}`;
}

function RunFlowPopover({ analysis }: { analysis: FlowAnalysis }) {
  const { aiModels, totalTimeRange, totalCostRange, warnings } = analysis;

  // Group duplicate models
  const groups = new Map<string, { name: string; count: number }>();
  for (const m of aiModels) {
    const g = groups.get(m.modelId);
    if (g) g.count++;
    else groups.set(m.modelId, { name: m.modelName, count: 1 });
  }

  return (
    <div
      className="absolute right-0 top-full animate-slide-up"
      style={{
        marginTop: 6,
        width: 280,
        padding: '12px 14px',
        borderRadius: 14,
        background: 'rgba(26, 26, 28, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-xl)',
        zIndex: 50,
      }}
    >
      {/* Summary line */}
      <div className="flex items-center gap-1.5" style={{ marginBottom: 4 }}>
        <span style={{ font: 'var(--font-label-small)', color: 'var(--color-text-primary)' }}>
          {aiModels.length} AI model{aiModels.length !== 1 ? 's' : ''}
        </span>
        <span style={{ font: 'var(--font-tip)', color: 'var(--color-text-muted)' }}>·</span>
        <span style={{ font: 'var(--font-tip)', color: 'var(--color-text-muted)' }}>
          ~{fmtTime(totalTimeRange[0])}-{fmtTime(totalTimeRange[1])}
        </span>
      </div>

      {/* Cost */}
      <div className="flex items-center gap-1.5" style={{ marginBottom: 10 }}>
        <span style={{ font: 'var(--font-tip)', color: 'var(--color-text-muted)' }}>
          ~{fmtCost(totalCostRange[0])}-{fmtCost(totalCostRange[1])} estimated
        </span>
      </div>

      {/* Model pills */}
      {groups.size > 0 && (
        <div className="flex items-center gap-1 flex-wrap" style={{ marginBottom: warnings.length > 0 ? 10 : 0 }}>
          {Array.from(groups.values()).map(({ name, count }, i) => (
            <span
              key={i}
              style={{
                font: 'var(--font-tiny-label)',
                color: 'var(--color-text-secondary)',
                background: 'var(--color-transparent-w10)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                whiteSpace: 'nowrap',
              }}
            >
              {name}{count > 1 ? ` ×${count}` : ''}
            </span>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={11} style={{ color: '#ff9f0a', flexShrink: 0 }} />
            <span style={{ font: 'var(--font-tip)', color: '#ff9f0a' }}>
              {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
            </span>
          </div>
          {warnings.map((w, i) => (
            <div
              key={i}
              style={{
                font: 'var(--font-tiny-label)',
                color: 'var(--color-text-muted)',
                paddingLeft: 18,
                lineHeight: 1.3,
              }}
            >
              {w.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditableProjectName() {
  const name = useFlowStore((s) => s.flowMeta.name);
  const saveFlow = useFlowStore((s) => s.saveFlow);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(name); }, [name]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) {
      saveFlow(trimmed);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(name); setEditing(false); }
        }}
        className="bg-transparent focus:outline-none"
        style={{
          font: 'var(--font-body-small)',
          color: 'var(--color-text-secondary)',
          width: Math.max(60, draft.length * 7 + 16),
          padding: '2px 6px',
          borderRadius: 6,
          border: '1px solid var(--color-border)',
        }}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="transition-colors duration-150"
      style={{
        font: 'var(--font-body-small)',
        color: 'var(--color-text-secondary)',
        padding: '2px 6px',
        borderRadius: 6,
        background: 'transparent',
        border: '1px solid transparent',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-transparent-w10)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      title="Click to rename"
    >
      {name}
    </button>
  );
}

function SaveStatusIndicator() {
  const status = useFlowStore((s) => s.saveStatus);
  if (status === 'idle') return null;

  return (
    <span
      className="flex items-center gap-1 transition-opacity duration-300"
      style={{
        font: 'var(--font-tiny-label)',
        color: 'var(--color-text-muted)',
        opacity: status === 'saved' ? 0.7 : 1,
      }}
    >
      {status === 'saving' && <Loader2 size={10} className="animate-spin" />}
      {status === 'saving' ? 'Saving…' : 'Saved'}
    </span>
  );
}

function DownloadAllButton() {
  const nodeStates = useExecutionStore((s) => s.nodeStates);
  const nodes = useFlowStore((s) => s.nodes);
  const addToast = useAppStore((s) => s.addToast);
  const [menuOpen, setMenuOpen] = useState(false);

  // Separate generated assets from uploaded files
  const generated: { url: string; ext: string }[] = [];
  const uploaded: { url: string; ext: string }[] = [];

  for (const [nodeId, state] of Object.entries(nodeStates)) {
    if (state.status !== 'completed' || !state.result) continue;
    const r = state.result as Record<string, unknown>;
    const node = nodes.find((n) => n.id === nodeId);
    const isUpload = node?.type === 'file-upload';

    const addTo = isUpload ? uploaded : generated;
    if (r.image && typeof r.image === 'string') addTo.push({ url: r.image, ext: 'png' });
    if (r.video && typeof r.video === 'string') addTo.push({ url: r.video, ext: 'mp4' });
    if (r.audio && typeof r.audio === 'string') addTo.push({ url: r.audio, ext: 'mp3' });
  }

  const all = [...generated, ...uploaded];
  if (all.length === 0) return null;

  const downloadAssets = async (assets: { url: string; ext: string }[], label: string) => {
    setMenuOpen(false);
    addToast(`Downloading ${assets.length} ${label}…`, 'info');
    for (let i = 0; i < assets.length; i++) {
      const { url, ext } = assets[i];
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `riverflow-${Date.now()}-${i + 1}.${ext}`;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch {
        window.open(url, '_blank');
      }
      if (i < assets.length - 1) await new Promise((r) => setTimeout(r, 300));
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-1.5 transition-all duration-150 hover:brightness-125"
        style={{
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-transparent-w10)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)',
          font: 'var(--font-tip)',
          minHeight: 32,
        }}
      >
        <Download size={10} /> Download ({all.length})
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div
            className="absolute right-0 top-full z-50 animate-slide-up"
            style={{
              marginTop: 6,
              minWidth: 180,
              padding: 4,
              borderRadius: 14,
              background: 'rgba(26, 26, 28, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            {generated.length > 0 && (
              <button
                onClick={() => downloadAssets(generated, 'generated')}
                className="flex items-center gap-2 w-full text-left transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)]"
                style={{ padding: '8px 12px', borderRadius: 10, font: 'var(--font-label-small)', color: 'var(--color-text-primary)' }}
              >
                <Download size={12} style={{ color: 'var(--color-text-muted)' }} />
                Generated only ({generated.length})
              </button>
            )}
            <button
              onClick={() => downloadAssets(all, 'file' + (all.length > 1 ? 's' : ''))}
              className="flex items-center gap-2 w-full text-left transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)]"
              style={{ padding: '8px 12px', borderRadius: 10, font: 'var(--font-label-small)', color: 'var(--color-text-primary)' }}
            >
              <Download size={12} style={{ color: 'var(--color-text-muted)' }} />
              All files ({all.length})
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function LogoMenu() {
  const [open, setOpen] = useState(false);
  const clearFlow = useFlowStore((s) => s.clearFlow);
  const nodes = useFlowStore((s) => s.nodes);
  const saveFlow = useFlowStore((s) => s.saveFlow);
  const toJSON = useFlowStore((s) => s.toJSON);
  const fromJSON = useFlowStore((s) => s.fromJSON);
  const { setSettingsOpen } = useAppStore();

  const handleNewProject = () => {
    if (nodes.length > 0) saveFlow();
    clearFlow();
    setOpen(false);
  };

  const handleRename = () => {
    setOpen(false);
    // Click the editable project name to trigger rename
    const nameBtn = document.querySelector<HTMLElement>('[title="Click to rename"]');
    if (nameBtn) nameBtn.click();
  };

  const handleDuplicate = () => {
    if (nodes.length > 0) {
      saveFlow();
      const data = toJSON();
      fromJSON({
        ...data,
        id: `dup_${Date.now()}`,
        name: `${data.name} (copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    setOpen(false);
  };

  const handleSettings = () => {
    setSettingsOpen(true);
    setOpen(false);
  };

  const menuItems = [
    { label: 'New Project', icon: <FilePlus2 size={14} />, action: handleNewProject },
    { label: 'Rename Project', icon: <Pencil size={14} />, action: handleRename },
    { label: 'Duplicate Project', icon: <Copy size={14} />, action: handleDuplicate },
    { label: 'Settings', icon: <Settings size={14} />, action: handleSettings },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 transition-all duration-150"
        style={{
          padding: '4px 8px 4px 4px',
          borderRadius: 'var(--radius-sm)',
          background: open ? 'var(--color-transparent-w10)' : 'transparent',
          color: 'var(--color-text-primary)',
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = 'var(--color-transparent-w05)'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent'; }}
      >
        <img src="/favicon.svg" alt="Riverflow" style={{ width: 20, height: 20 }} />
        <span style={{ font: 'var(--font-label-medium)' }}>Riverflow</span>
        <ChevronDown size={12} style={{ color: 'var(--color-text-muted)', transition: 'transform 150ms', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-full z-50 animate-slide-up"
            style={{
              marginTop: 6,
              minWidth: 200,
              padding: 4,
              borderRadius: 14,
              background: 'rgba(26, 26, 28, 0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="flex items-center gap-2.5 w-full text-left transition-colors duration-100"
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  font: 'var(--font-body-small)',
                  color: 'var(--color-text-secondary)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function TopBar() {
  const { setSettingsOpen, falApiKey } = useAppStore();
  const { isRunning, setIsRunning, setAbortController } = useExecutionStore();
  const { nodes, edges } = useFlowStore();
  const handleRun = async () => {
    if (!falApiKey) { setSettingsOpen(true); return; }
    setHoverOpen(false);
    const controller = new AbortController();
    setAbortController(controller);
    setIsRunning(true);
    try { await executeFlow(nodes, edges, controller.signal); }
    finally { setIsRunning(false); setAbortController(null); }
  };

  const handleStop = () => {
    useExecutionStore.getState().abortController?.abort();
    setIsRunning(false);
  };

  // Hover popover state
  const [hoverOpen, setHoverOpen] = useState(false);
  const hoverAnalysis = useRef<FlowAnalysis | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>();

  const openPopover = useCallback(() => {
    if (edges.length === 0 || !falApiKey) return;
    clearTimeout(hoverTimeout.current);
    hoverAnalysis.current = analyzeFlow(nodes, edges);
    hoverTimeout.current = setTimeout(() => setHoverOpen(true), 300);
  }, [nodes, edges, falApiKey]);

  const closePopover = useCallback(() => {
    clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setHoverOpen(false), 200);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-30 flex items-center"
      style={{
        height: 48,
        padding: '0 16px',
        background: 'rgba(26, 26, 28, 0.50)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Left — Logo menu + divider + project name */}
      <div className="flex items-center gap-2.5">
        <LogoMenu />
        <div style={{ width: 1, height: 14, background: 'var(--color-border)' }} />
        <EditableProjectName />
        <SaveStatusIndicator />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right — Download All + Run */}
      <div className="flex items-center gap-2">
        <DownloadAllButton />
        {!isRunning ? (
          <div
            className="relative"
            onMouseEnter={edges.length > 0 ? openPopover : undefined}
            onMouseLeave={edges.length > 0 ? closePopover : undefined}
          >
            <button
              onClick={handleRun}
              disabled={edges.length === 0}
              className={`flex items-center gap-1.5 transition-all duration-150 ${edges.length === 0 ? 'cursor-not-allowed' : 'hover:brightness-125'}`}
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(120, 72, 255, 0.15)',
                color: '#b196ff',
                border: '1px solid rgba(120, 72, 255, 0.4)',
                font: 'var(--font-tip)',
                minHeight: 32,
                opacity: edges.length === 0 ? 0.4 : 1,
              }}
            >
              <Play size={10} fill="currentColor" /> Run Flow
            </button>
            {hoverOpen && hoverAnalysis.current && hoverAnalysis.current.aiModels.length > 0 && (
              <RunFlowPopover analysis={hoverAnalysis.current} />
            )}
          </div>
        ) : (
          <button
            onClick={handleStop}
            className="flex items-center gap-1.5 transition-all duration-150"
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 69, 58, 0.15)',
              color: '#ff6961',
              border: '1px solid rgba(255, 69, 58, 0.4)',
              font: 'var(--font-tip)',
              minHeight: 32,
            }}
          >
            <Square size={9} fill="currentColor" /> Stop
          </button>
        )}
      </div>

      {/* Pre-flight confirmation modal — disabled for now, using hover popover instead */}
      {/* {flowAnalysis && (
        <RunFlowModal
          open={showPreFlight}
          onClose={() => setShowPreFlight(false)}
          onConfirm={handleConfirmRun}
          analysis={flowAnalysis}
          flowName={flowName}
        />
      )} */}
    </div>
  );
}

/** Floating API status badge — bottom left of screen */
export function ApiStatusBadge() {
  const falApiKey = useAppStore((s) => s.falApiKey);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);

  return (
    <div className="fixed bottom-4 left-4 z-10">
      {!falApiKey ? (
        <button
          onClick={() => setSettingsOpen(true)}
          className="transition-colors duration-150"
          style={{
            font: 'var(--font-tiny-label)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255,69,58,0.08)',
            color: '#ff6961',
            border: '1px solid rgba(255,69,58,0.12)',
          }}
        >
          No API key
        </button>
      ) : (
        <div
          className="flex items-center gap-1.5"
          style={{
            font: 'var(--font-tiny-label)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(48,209,88,0.06)',
            color: '#30d158',
            border: '1px solid rgba(48,209,88,0.08)',
          }}
        >
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#30d158' }} />
          API active
        </div>
      )}
    </div>
  );
}
