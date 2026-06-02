import { useState, useRef } from 'react';
import { X, Search, Plus, Trash2, Upload, Download, Copy } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useAppStore } from '../store/app-store';
import { useFlowStore, type FlowMeta } from '../store/flow-store';
import { MODELS } from '../fal/model-registry';

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function modelName(id: string): string {
  return MODELS.find((m) => m.id === id)?.name || id.split('/').pop() || id;
}

export function FlowBrowser() {
  const open = useAppStore((s) => s.flowBrowserOpen);
  const setOpen = useAppStore((s) => s.setFlowBrowserOpen);
  const addToast = useAppStore((s) => s.addToast);
  const { loadFlow, listSavedFlows, deleteSavedFlow, clearFlow, importFlowJSON, exportFlowJSON } = useFlowStore();
  const { fitView } = useReactFlow();

  const [query, setQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const importRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  void refreshKey; // dependency to re-read flows after duplicate/delete
  const flows = listSavedFlows()
    .filter((f) => (f.nodeCount ?? 0) > 0) // Hide empty flows
    .filter((f) => !query || f.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const handleLoad = (id: string) => {
    if (loadFlow(id)) {
      setOpen(false);
      addToast('Flow loaded', 'success');
      // Fit view after a tick so React Flow has time to render the new nodes
      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100);
    } else {
      addToast('Failed to load flow', 'error');
    }
  };

  const handleDuplicate = (id: string) => {
    try {
      const raw = localStorage.getItem(`fal-canvas-flow-${id}`);
      if (!raw) { addToast('Flow not found', 'error'); return; }
      const data = JSON.parse(raw);
      const newId = `flow_${Date.now()}`;
      const duplicated = {
        ...data,
        id: newId,
        name: `${data.name || 'Untitled Flow'} (copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      localStorage.setItem(`fal-canvas-flow-${newId}`, JSON.stringify(duplicated));
      // Update flow index
      const index = JSON.parse(localStorage.getItem('fal-canvas-flow-index') || '[]');
      index.push({ id: newId, name: duplicated.name, description: duplicated.description || '', createdAt: duplicated.createdAt, updatedAt: duplicated.updatedAt, nodeCount: duplicated.nodes?.length, models: duplicated.models || [] });
      localStorage.setItem('fal-canvas-flow-index', JSON.stringify(index));
      setRefreshKey((k) => k + 1);
      addToast('Flow duplicated', 'success');
    } catch {
      addToast('Failed to duplicate flow', 'error');
    }
  };

  const handleDelete = (id: string) => {
    deleteSavedFlow(id);
    setConfirmDelete(null);
    setRefreshKey((k) => k + 1);
    addToast('Flow deleted', 'success');
  };

  const handleNewFlow = () => {
    clearFlow();
    setOpen(false);
    addToast('New flow created', 'success');
  };

  const handleExport = () => {
    const json = exportFlowJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `riverflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importFlowJSON(reader.result as string);
      if (ok) {
        setOpen(false);
        addToast('Flow imported', 'success');
      } else {
        addToast('Invalid flow file', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="animate-slide-up flex flex-col"
        style={{
          width: 520,
          maxHeight: 'min(600px, 80vh)',
          borderRadius: 16,
          background: 'rgba(26, 26, 28, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '16px 20px 12px' }}>
          <span style={{ font: 'var(--font-heading-xsmall)', color: 'var(--color-text-primary)' }}>
            Your Flows
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewFlow}
              className="flex items-center gap-1.5 transition-colors duration-150 hover:brightness-125"
              style={{
                font: 'var(--font-tip)',
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-transparent-w10)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Plus size={12} /> New
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center justify-center transition-colors duration-150"
              style={{ width: 28, height: 28, borderRadius: 8, color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-transparent-w10)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '0 20px 12px' }}>
          <div
            className="flex items-center gap-2 search-container"
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            <Search size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search flows…"
              className="flex-1 bg-transparent focus:outline-none focus:shadow-none"
              style={{ font: 'var(--font-body-small)', color: 'var(--color-text-primary)', boxShadow: 'none' }}
              autoFocus
            />
          </div>
        </div>

        {/* Flow list */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '0 20px' }}>
          {flows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--color-text-muted)' }}>
              <p style={{ font: 'var(--font-body-small)' }}>
                {query ? 'No flows match your search' : 'No saved flows yet'}
              </p>
              <p style={{ font: 'var(--font-helper)', marginTop: 4 }}>
                {!query && 'Create a flow and press ⌘S to save'}
              </p>
            </div>
          )}

          {flows.map((flow) => (
            <FlowCard
              key={flow.id}
              flow={flow}
              onLoad={() => handleLoad(flow.id)}
              onDuplicate={() => handleDuplicate(flow.id)}
              onDelete={() => {
                if (confirmDelete === flow.id) {
                  handleDelete(flow.id);
                } else {
                  setConfirmDelete(flow.id);
                }
              }}
              isConfirmingDelete={confirmDelete === flow.id}
              onCancelDelete={() => setConfirmDelete(null)}
            />
          ))}
        </div>

        {/* Footer — import/export */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <button
            onClick={() => importRef.current?.click()}
            className="flex items-center gap-1.5 transition-colors duration-150"
            style={{ font: 'var(--font-helper)', color: 'var(--color-text-muted)', padding: '4px 8px', borderRadius: 6 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          >
            <Upload size={12} /> Import JSON
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 transition-colors duration-150"
            style={{ font: 'var(--font-helper)', color: 'var(--color-text-muted)', padding: '4px 8px', borderRadius: 6 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          >
            <Download size={12} /> Export Current
          </button>
        </div>
      </div>
    </div>
  );
}

function FlowCard({
  flow,
  onLoad,
  onDuplicate,
  onDelete,
  isConfirmingDelete,
  onCancelDelete,
}: {
  flow: FlowMeta;
  onLoad: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isConfirmingDelete: boolean;
  onCancelDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex items-start gap-3 transition-colors duration-150 cursor-pointer"
      style={{
        padding: '12px',
        borderRadius: 12,
        marginBottom: 4,
      }}
      onClick={onLoad}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; setHovered(true); }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; setHovered(false); }}
    >
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div style={{ font: 'var(--font-label-medium)', color: 'var(--color-text-primary)' }}>
          {flow.name}
        </div>
        <div className="flex items-center gap-2 mt-1" style={{ font: 'var(--font-helper)', color: 'var(--color-text-muted)' }}>
          <span>{relativeTime(flow.updatedAt)}</span>
          {flow.nodeCount != null && (
            <>
              <span>·</span>
              <span>{flow.nodeCount} nodes</span>
            </>
          )}
          {flow.createdAt && (
            <>
              <span>·</span>
              <span>Created {formatDate(flow.createdAt)}</span>
            </>
          )}
        </div>
        {/* Model chips */}
        {flow.models && flow.models.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {flow.models.slice(0, 3).map((id) => (
              <span
                key={id}
                style={{
                  font: 'var(--font-tiny-label)',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-transparent-w10)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {modelName(id)}
              </span>
            ))}
            {flow.models.length > 3 && (
              <span style={{ font: 'var(--font-tiny-label)', color: 'var(--color-text-muted)' }}>
                +{flow.models.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-1 shrink-0 transition-opacity duration-150"
        style={{ opacity: hovered || isConfirmingDelete ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {isConfirmingDelete ? (
          <>
            <button
              onClick={onDelete}
              style={{ font: 'var(--font-tip)', color: '#ff453a', padding: '4px 8px', borderRadius: 6 }}
            >
              Delete
            </button>
            <button
              onClick={onCancelDelete}
              style={{ font: 'var(--font-tip)', color: 'var(--color-text-muted)', padding: '4px 8px', borderRadius: 6 }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onDuplicate}
              className="flex items-center justify-center transition-colors duration-150"
              style={{ width: 28, height: 28, borderRadius: 8, color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-transparent-w10)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
              title="Duplicate flow"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={onDelete}
              className="flex items-center justify-center transition-colors duration-150"
              style={{ width: 28, height: 28, borderRadius: 8, color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-transparent-w10)'; e.currentTarget.style.color = '#ff453a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
              title="Delete flow"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
