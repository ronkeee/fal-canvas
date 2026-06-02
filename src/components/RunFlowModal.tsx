import { createPortal } from 'react-dom';
import { X, Play, Image, Video, Music, ArrowUpCircle, Paintbrush, Clock, DollarSign, AlertTriangle, ArrowRight, Zap } from 'lucide-react';
import type { FlowAnalysis } from '../engine/types';

const CATEGORY_ICONS: Record<string, typeof Image> = {
  image: Image,
  video: Video,
  audio: Music,
  upscale: ArrowUpCircle,
  edit: Paintbrush,
};

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function formatCost(cents: number): string {
  if (cents < 1) return `<$0.01`;
  return `$${(cents / 100).toFixed(2)}`;
}

interface RunFlowModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  analysis: FlowAnalysis;
  flowName: string;
}

export function RunFlowModal({ open, onClose, onConfirm, analysis, flowName }: RunFlowModalProps) {
  if (!open) return null;

  const { aiModels, totalTimeRange, totalCostRange, warnings, totalNodes, totalEdges } = analysis;

  // Group duplicate models
  const modelGroups = new Map<string, { model: (typeof aiModels)[0]; count: number }>();
  for (const m of aiModels) {
    const existing = modelGroups.get(m.modelId);
    if (existing) {
      existing.count++;
    } else {
      modelGroups.set(m.modelId, { model: m, count: 1 });
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9990 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.70)' }} />

      {/* Modal */}
      <div
        className="relative animate-slide-up flex flex-col"
        style={{
          width: 480,
          maxHeight: '80vh',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(26, 26, 28, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: '#b196ff' }} />
            <span style={{ font: 'var(--font-label-medium)', color: 'var(--color-text-primary)' }}>
              Run Flow
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)]"
            style={{ width: 28, height: 28, borderRadius: 8 }}
          >
            <X size={14} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '16px 20px' }}>
          {/* Flow summary */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ font: 'var(--font-body)', color: 'var(--color-text-primary)', marginBottom: 4 }}>
              {flowName}
            </div>
            <div style={{ font: 'var(--font-tip)', color: 'var(--color-text-muted)' }}>
              {totalNodes} node{totalNodes !== 1 ? 's' : ''} · {totalEdges} connection{totalEdges !== 1 ? 's' : ''} · {aiModels.length} AI model{aiModels.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Model list */}
          {modelGroups.size > 0 && (
            <div
              style={{
                borderRadius: 10,
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              {Array.from(modelGroups.values()).map(({ model, count }, i) => {
                const Icon = CATEGORY_ICONS[model.category] || Image;
                return (
                  <div
                    key={model.modelId + i}
                    className="flex items-start gap-3"
                    style={{
                      padding: '12px 14px',
                      borderBottom: i < modelGroups.size - 1 ? '1px solid var(--color-border)' : 'none',
                    }}
                  >
                    <Icon size={14} style={{ color: 'var(--color-text-muted)', marginTop: 2, flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ font: 'var(--font-label-small)', color: 'var(--color-text-primary)' }}>
                          {model.modelName}
                        </span>
                        {count > 1 && (
                          <span
                            style={{
                              font: 'var(--font-tiny-label)',
                              color: 'var(--color-text-muted)',
                              background: 'var(--color-transparent-w10)',
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-full)',
                            }}
                          >
                            ×{count}
                          </span>
                        )}
                      </div>
                      <div style={{ font: 'var(--font-tip)', color: 'var(--color-secondary-c400)', marginTop: 2 }}>
                        {model.description}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5" style={{ flexShrink: 0 }}>
                      <span style={{ font: 'var(--font-tip)', color: 'var(--color-text-muted)' }}>
                        ~{formatTime(model.timeRange[0])}-{formatTime(model.timeRange[1])}
                      </span>
                      <span style={{ font: 'var(--font-tip)', color: 'var(--color-text-muted)' }}>
                        ~{formatCost(model.costRange[0])}-{formatCost(model.costRange[1])}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Totals */}
          {aiModels.length > 0 && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--color-transparent-w05)',
                marginBottom: 16,
              }}
            >
              <div style={{ font: 'var(--font-tiny-label)', color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />
                  <span style={{ font: 'var(--font-label-small)', color: 'var(--color-text-secondary)' }}>
                    ~{formatTime(totalTimeRange[0])}-{formatTime(totalTimeRange[1])}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign size={12} style={{ color: 'var(--color-text-muted)' }} />
                  <span style={{ font: 'var(--font-label-small)', color: 'var(--color-text-secondary)' }}>
                    ~{formatCost(totalCostRange[0])}-{formatCost(totalCostRange[1])}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Execution order */}
          {analysis.executionWaves.length > 1 && aiModels.length > 1 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ font: 'var(--font-tip)', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                Execution order
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  // Filter to waves that have AI nodes, then render with arrows between them
                  const aiWaves = analysis.executionWaves
                    .map((wave) => wave.filter((id) => aiModels.some((m) => m.nodeId === id)))
                    .filter((wave) => wave.length > 0);

                  return aiWaves.map((wave, wi) => {
                    const names = wave.map((id) => {
                      const m = aiModels.find((am) => am.nodeId === id);
                      return m?.modelName || 'Node';
                    });

                    return (
                      <div key={wi} className="flex items-center gap-2">
                        {wi > 0 && <ArrowRight size={12} style={{ color: 'var(--color-text-muted)' }} />}
                        <div className="flex items-center gap-1">
                          {names.map((name, ni) => (
                            <span
                              key={ni}
                              style={{
                                font: 'var(--font-tiny-label)',
                                color: 'var(--color-text-secondary)',
                                background: 'var(--color-transparent-w10)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {name}
                            </span>
                          ))}
                          {wave.length > 1 && (
                            <span style={{ font: 'var(--font-tiny-label)', color: 'var(--color-text-muted)' }}>
                              (parallel)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div className="flex items-center gap-1.5" style={{ marginBottom: 8 }}>
                <AlertTriangle size={12} style={{ color: '#ff9f0a' }} />
                <span style={{ font: 'var(--font-tip)', color: '#ff9f0a' }}>
                  {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
                </span>
              </div>
              {warnings.map((w, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2"
                  style={{
                    padding: '6px 10px',
                    font: 'var(--font-tip)',
                    color: 'var(--color-text-muted)',
                    borderRadius: 8,
                  }}
                >
                  <span style={{ color: 'var(--color-text-muted)' }}>•</span>
                  {w.message}
                </div>
              ))}
            </div>
          )}

          {/* Footnote */}
          <div style={{ font: 'var(--font-tiny-label)', color: 'var(--color-secondary-c500)', marginTop: 4 }}>
            Estimates may vary based on queue, resolution, and model load.
          </div>
        </div>

        {/* Footer CTAs */}
        <div
          className="flex items-center justify-end gap-2"
          style={{
            padding: '12px 20px',
          }}
        >
          <button
            onClick={onClose}
            className="transition-all duration-150"
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-full)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              font: 'var(--font-label-small)',
              minHeight: 36,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 transition-all duration-150 hover:brightness-125"
            style={{
              padding: '8px 24px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(120, 72, 255, 0.15)',
              color: '#b196ff',
              border: '1px solid rgba(120, 72, 255, 0.4)',
              font: 'var(--font-label-small)',
              minHeight: 36,
            }}
          >
            <Play size={11} fill="currentColor" /> Run Flow
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
