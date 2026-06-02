import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ModelParam } from '../fal/model-registry';

interface Props {
  params: ModelParam[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

const ADVANCED_KEYS = new Set(['thinking_level', 'enable_web_search', 'seed', 'safety_tolerance', 'output_format']);

function renderParam(param: ModelParam, value: unknown, onChange: (key: string, value: unknown) => void) {
  // ── Select dropdown ──
  if (param.type === 'select' && param.options) {
    return (
      <div key={param.key}>
        <label style={{ marginBottom: 4, display: 'block', font: 'var(--font-tip)', color: 'var(--color-text-secondary)' }}>
          {param.label}
        </label>
        <select
          value={String(value || '')}
          onChange={(e) => onChange(param.key, e.target.value)}
          className="w-full rounded nodrag nopan nowheel"
        >
          {param.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  // ── Slider ──
  if (param.type === 'slider') {
    const numValue = Number(value) || param.default as number;
    return (
      <div key={param.key}>
        <label className="flex items-center justify-between" style={{ marginBottom: 4, font: 'var(--font-tip)', color: 'var(--color-text-secondary)' }}>
          <span>{param.label}</span>
          <span style={{ color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {numValue}
          </span>
        </label>
        <input
          type="range"
          min={param.min}
          max={param.max}
          step={param.step}
          value={numValue}
          onChange={(e) => onChange(param.key, Number(e.target.value))}
          className="w-full nodrag"
          style={{ accentColor: 'var(--color-secondary-c300)', height: 4 }}
        />
      </div>
    );
  }

  // ── Toggle ──
  if (param.type === 'toggle') {
    const checked = Boolean(value);
    return (
      <div key={param.key} className="flex items-center justify-between">
        <label style={{ font: 'var(--font-tip)', color: 'var(--color-text-secondary)' }}>
          {param.label}
        </label>
        <button
          onClick={() => onChange(param.key, !checked)}
          className="nodrag relative"
          style={{
            width: 32, height: 18, borderRadius: 9,
            background: checked ? 'var(--color-secondary-c300)' : 'var(--color-secondary-c600)',
            transition: 'background 0.15s ease',
            border: 'none', cursor: 'pointer',
          }}
        >
          <div style={{
            width: 14, height: 14, borderRadius: '50%', background: '#fff',
            position: 'absolute', top: 2, left: checked ? 16 : 2,
            transition: 'left 0.15s ease',
          }} />
        </button>
      </div>
    );
  }

  // ── Number input ──
  if (param.type === 'number') {
    return (
      <div key={param.key}>
        <label style={{ marginBottom: 4, display: 'block', font: 'var(--font-tip)', color: 'var(--color-text-secondary)' }}>
          {param.label}
        </label>
        <input
          type="number"
          value={Number(value) || 0}
          min={param.min}
          max={param.max}
          step={param.step}
          onChange={(e) => onChange(param.key, Number(e.target.value))}
          className="w-full rounded nodrag nopan nowheel"
          placeholder={String(param.default)}
        />
      </div>
    );
  }

  return null;
}

/** Renders dynamic UI controls for model-specific parameters */
export function ModelParamControls({ params, values, onChange }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const mainParams = params.filter((p) => !ADVANCED_KEYS.has(p.key));
  const advancedParams = params.filter((p) => ADVANCED_KEYS.has(p.key));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {mainParams.map((param) => renderParam(param, values[param.key] ?? param.default, onChange))}

      {advancedParams.length > 0 && (
        <>
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex items-center gap-1 w-full nodrag transition-colors duration-150"
            style={{
              font: 'var(--font-tip)',
              color: 'var(--color-text-muted)',
              padding: '4px 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {advancedOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Advanced
          </button>
          {advancedOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 2 }}>
              {advancedParams.map((param) => renderParam(param, values[param.key] ?? param.default, onChange))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
