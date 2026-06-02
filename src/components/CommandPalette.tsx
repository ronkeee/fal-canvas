import { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { NODE_CONFIGS } from '../nodes';
import { CATEGORY_COLORS } from '../engine/types';
import { useFlowStore } from '../store/flow-store';
import { useAppStore } from '../store/app-store';

interface CommandItem {
  id: string;
  label: string;
  category: string;
  categoryColor: string;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const addNode = useFlowStore((s) => s.addNode);
  const clearFlow = useFlowStore((s) => s.clearFlow);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  // Build command list
  const commands: CommandItem[] = [
    // Node types
    ...Object.entries(NODE_CONFIGS).map(([type, config]) => ({
      id: `add-${type}`,
      label: `Add ${config.label}`,
      category: config.category,
      categoryColor: CATEGORY_COLORS[config.category],
      action: () => addNode(type, { x: 300, y: 300 }),
    })),
    // Actions
    {
      id: 'clear',
      label: 'Clear Canvas',
      category: 'action',
      categoryColor: '#ff453a',
      action: clearFlow,
    },
    {
      id: 'toggle-theme',
      label: 'Toggle Theme',
      category: 'action',
      categoryColor: '#8e8e93',
      action: toggleTheme,
    },
  ];

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = useCallback(
    (item: CommandItem) => {
      item.action();
      setOpen(false);
      setQuery('');
    },
    []
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) handleSelect(filtered[selectedIndex]);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
      style={{ backgroundColor: 'var(--color-modal-overlay)', backdropFilter: 'blur(10px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-[420px] overflow-hidden"
        style={{
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <Search size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search nodes and actions..."
            className="flex-1 bg-transparent focus:outline-none"
            style={{ color: 'var(--color-text-primary)', font: 'var(--font-body-medium)' }}
          />
          <kbd className="px-1.5 py-0.5 rounded" style={{ font: 'var(--font-helper)', backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-center" style={{ font: 'var(--font-body-small)', color: 'var(--color-text-secondary)' }}>
              No results found
            </div>
          )}
          {filtered.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
              style={{
                backgroundColor: i === selectedIndex ? 'var(--color-surface-hover)' : 'transparent',
                color: 'var(--color-text-primary)',
              }}
              onMouseEnter={() => setSelectedIndex(i)}
              onClick={() => handleSelect(item)}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.categoryColor }} />
              <span className="flex-1" style={{ font: 'var(--font-body-small)' }}>{item.label}</span>
              <span style={{ font: 'var(--font-helper)', color: 'var(--color-text-secondary)' }}>
                {item.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
