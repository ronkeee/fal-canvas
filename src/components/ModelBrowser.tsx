import { useState } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { useFlowStore } from '../store/flow-store';
import { MODELS, type ModelInfo } from '../fal/model-registry';

const ALL_CATEGORIES = ['image', 'video', 'audio', 'upscale', 'edit'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  upscale: 'Upscale',
  edit: 'Editing',
};

const CATEGORY_COLORS: Record<string, string> = {
  image: '#ff9f0a',
  video: '#bf5af2',
  audio: '#5e5ce6',
  upscale: '#30d158',
  edit: '#64d2ff',
};

// WCAG: pick dark or light text based on background luminance
function contrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000' : '#fff';
}

interface ModelBrowserProps {
  open: boolean;
  onClose: () => void;
}

export function ModelBrowser({ open, onClose }: ModelBrowserProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const addNode = useFlowStore((s) => s.addNode);

  if (!open) return null;

  const filtered = MODELS.filter((m) => {
    const matchesQuery = !query || m.name.toLowerCase().includes(query.toLowerCase()) || m.description.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !activeCategory || m.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  const handleAddModel = (model: ModelInfo) => {
    const nodeTypeMap: Record<string, string> = {
      image: 'imageGen', video: 'videoGen', audio: 'audioGen', upscale: 'upscale', edit: 'img2img',
    };
    addNode(nodeTypeMap[model.category] || 'imageGen', { x: 300, y: 300 });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-modal-overlay)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: 560,
          maxHeight: '70vh',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}
        >
          <span style={{ font: 'var(--font-heading-xxsmall)', color: 'var(--color-text-primary)' }}>
            Model Browser
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center hover:bg-[var(--color-surface-hover)] transition-colors duration-150"
            style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0" style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <div
            className="flex items-center gap-2"
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-surface-hover)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <Search size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models..."
              className="flex-1 bg-transparent focus:outline-none"
              style={{ color: 'var(--color-text-primary)', font: 'var(--font-body-medium)' }}
              autoFocus
            />
          </div>
        </div>

        {/* Category tabs */}
        <div
          className="flex items-center gap-2 shrink-0 overflow-x-auto"
          style={{ padding: '10px 20px', borderBottom: '1px solid var(--color-border)' }}
        >
          <button
            onClick={() => setActiveCategory(null)}
            className="whitespace-nowrap transition-colors duration-150"
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              font: 'var(--font-label-small)',
              backgroundColor: !activeCategory ? 'var(--color-accent)' : 'var(--color-surface-hover)',
              color: !activeCategory ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            All
          </button>
          {ALL_CATEGORIES.map((cat) => {
            const isActive = cat === activeCategory;
            const bg = isActive ? CATEGORY_COLORS[cat] : 'var(--color-surface-hover)';
            const fg = isActive ? contrastText(CATEGORY_COLORS[cat]) : 'var(--color-text-secondary)';
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className="whitespace-nowrap transition-colors duration-150"
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  font: 'var(--font-label-small)',
                  backgroundColor: bg,
                  color: fg,
                }}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>

        {/* Model list */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '8px 0' }}>
          {filtered.length === 0 && (
            <div className="text-center" style={{ padding: '32px 0', font: 'var(--font-body-medium)', color: 'var(--color-text-muted)' }}>
              No models found
            </div>
          )}
          {filtered.map((model) => (
            <div
              key={model.id}
              className="flex items-center gap-3 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors duration-150"
              style={{ padding: '10px 20px' }}
              onClick={() => handleAddModel(model)}
            >
              <div
                className="shrink-0"
                style={{ width: 3, height: 32, borderRadius: 2, backgroundColor: CATEGORY_COLORS[model.category] }}
              />
              <div className="flex-1 min-w-0">
                <div style={{ font: 'var(--font-label-medium)', color: 'var(--color-text-primary)' }}>
                  {model.name}
                </div>
                <div className="truncate" style={{ font: 'var(--font-body-small)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {model.description}
                </div>
                <div style={{ font: 'var(--font-helper)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {model.id}
                </div>
              </div>
              <button
                className="flex items-center gap-1 shrink-0 transition-colors duration-150"
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  font: 'var(--font-tip)',
                  backgroundColor: CATEGORY_COLORS[model.category] + '15',
                  color: CATEGORY_COLORS[model.category],
                }}
              >
                <Plus size={10} /> Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
