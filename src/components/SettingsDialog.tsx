import { useState } from 'react';
import { X, Eye, EyeOff, Monitor, Key } from 'lucide-react';
import { useAppStore, type BgStyle } from '../store/app-store';

/* ===== Reusable toggle switch ===== */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative shrink-0 transition-colors duration-200"
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: checked ? 'rgba(120, 72, 255, 0.5)' : 'rgba(255,255,255,0.1)',
        border: checked ? '1px solid rgba(120, 72, 255, 0.6)' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        className="absolute top-[2px] transition-all duration-200 rounded-full"
        style={{
          width: 16,
          height: 16,
          left: checked ? 20 : 3,
          background: checked ? '#fff' : 'rgba(255,255,255,0.5)',
        }}
      />
    </button>
  );
}

/* ===== Pill radio group ===== */
function PillRadio<T extends string>({ options, value, onChange }: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="flex"
      style={{
        borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: 2,
      }}
    >
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className="flex-1 transition-all duration-150"
          style={{
            padding: '5px 12px',
            borderRadius: 6,
            font: 'var(--font-tip)',
            color: value === opt.key ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            background: value === opt.key ? 'rgba(255,255,255,0.1)' : 'transparent',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ===== Setting row ===== */
function SettingRow({ label, description, children }: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4" style={{ padding: '12px 0' }}>
      <div className="flex-1 min-w-0">
        <div style={{ font: 'var(--font-label-small)', color: 'var(--color-text-primary)' }}>{label}</div>
        {description && (
          <div style={{ font: 'var(--font-helper)', color: 'var(--color-text-muted)', marginTop: 2 }}>{description}</div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ===== Section heading ===== */
function SectionLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        font: 'var(--font-tip)',
        color: 'var(--color-secondary-c300)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        padding: '16px 0 4px',
      }}
    >
      {children}
    </div>
  );
}

/* ===== Grid style visual picker ===== */
const BG_OPTIONS: { key: BgStyle; label: string; dots: { gap: number; size: number } }[] = [
  { key: 'fine', label: 'Fine', dots: { gap: 6, size: 1 } },
  { key: 'coarse', label: 'Coarse', dots: { gap: 10, size: 1.8 } },
  { key: 'cross', label: 'Cross', dots: { gap: 10, size: 0 } },
];

function GridPicker({ value, onChange }: { value: BgStyle; onChange: (v: BgStyle) => void }) {
  return (
    <div className="flex gap-2">
      {BG_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className="flex flex-col items-center gap-1.5 transition-all duration-150"
          style={{
            width: 64,
            padding: '8px 4px',
            borderRadius: 8,
            background: value === opt.key ? 'rgba(255,255,255,0.08)' : 'transparent',
            border: value === opt.key ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
          }}
        >
          <svg width={28} height={28} viewBox="0 0 28 28">
            {opt.key === 'cross' ? (
              [7, 21].map((x) =>
                [7, 21].map((y) => (
                  <g key={`${x}-${y}`}>
                    <line x1={x - 3} y1={y} x2={x + 3} y2={y} stroke="rgba(255,255,255,0.3)" strokeWidth={0.8} />
                    <line x1={x} y1={y - 3} x2={x} y2={y + 3} stroke="rgba(255,255,255,0.3)" strokeWidth={0.8} />
                  </g>
                ))
              )
            ) : (
              Array.from({ length: 4 }, (_, i) =>
                Array.from({ length: 4 }, (_, j) => (
                  <circle
                    key={`${i}-${j}`}
                    cx={4 + i * (opt.dots.gap)}
                    cy={4 + j * (opt.dots.gap)}
                    r={opt.dots.size}
                    fill={`rgba(255,255,255,${value === opt.key ? 0.5 : 0.25})`}
                  />
                ))
              )
            )}
          </svg>
          <span style={{ font: 'var(--font-tiny-label)', color: value === opt.key ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ===== Tab definitions ===== */
const TABS = [
  { key: 'display', label: 'Display', icon: <Monitor size={14} /> },
  { key: 'api', label: 'API', icon: <Key size={14} /> },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/* ===== Display tab ===== */
function DisplayTab() {
  const showGradient = useAppStore((s) => s.showGradient);
  const setShowGradient = useAppStore((s) => s.setShowGradient);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const bgStyle = useAppStore((s) => s.bgStyle);
  const setBgStyle = useAppStore((s) => s.setBgStyle);

  return (
    <div>
      <SectionLabel>Appearance</SectionLabel>

      <SettingRow label="Background gradient" description="Animated gradient overlay on the canvas">
        <Toggle checked={showGradient} onChange={setShowGradient} />
      </SettingRow>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} />

      <div style={{ opacity: 0.4, pointerEvents: 'none' }}>
        <SettingRow label="Theme" description="Interface color scheme — coming soon">
          <PillRadio
            options={[{ key: 'dark' as const, label: 'Dark' }, { key: 'light' as const, label: 'Light' }]}
            value={theme}
            onChange={setTheme}
          />
        </SettingRow>
      </div>

      <SectionLabel>Canvas</SectionLabel>

      <SettingRow label="Grid pattern" description="Dot pattern on the canvas background">
        <GridPicker value={bgStyle} onChange={setBgStyle} />
      </SettingRow>
    </div>
  );
}

/* ===== API tab ===== */
function ApiTab() {
  const { falApiKey, setFalApiKey } = useAppStore();
  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState(falApiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setFalApiKey(keyInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <SectionLabel>fal.ai</SectionLabel>

      <div style={{ padding: '12px 0' }}>
        <div style={{ font: 'var(--font-label-small)', color: 'var(--color-text-primary)', marginBottom: 8 }}>
          API Key
        </div>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={keyInput}
            onChange={(e) => { setKeyInput(e.target.value); setSaved(false); }}
            placeholder="Enter your fal.ai API key"
            className="w-full focus:outline-none"
            style={{
              font: 'var(--font-body-small)',
              padding: '10px 36px 10px 12px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--color-text-primary)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors duration-150"
            style={{ color: 'var(--color-secondary-c300)' }}
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
          <p style={{ font: 'var(--font-helper)', color: 'var(--color-text-muted)' }}>
            Get your key at{' '}
            <a
              href="https://fal.ai/dashboard/keys"
              target="_blank"
              rel="noopener"
              style={{ color: 'var(--color-accent-text)', textDecoration: 'underline' }}
            >
              fal.ai/dashboard/keys
            </a>
          </p>

          <button
            onClick={handleSave}
            disabled={keyInput === falApiKey}
            className="transition-all duration-150"
            style={{
              font: 'var(--font-tip)',
              padding: '5px 14px',
              borderRadius: 'var(--radius-full)',
              background: saved
                ? 'rgba(48, 209, 88, 0.1)'
                : keyInput !== falApiKey
                  ? 'rgba(120, 72, 255, 0.1)'
                  : 'transparent',
              color: saved ? '#30d158' : keyInput !== falApiKey ? '#a78bfa' : 'var(--color-text-muted)',
              border: saved
                ? '1px solid rgba(48, 209, 88, 0.2)'
                : keyInput !== falApiKey
                  ? '1px solid rgba(120, 72, 255, 0.25)'
                  : '1px solid transparent',
              opacity: keyInput === falApiKey && !saved ? 0.4 : 1,
            }}
          >
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* Status indicator */}
      {falApiKey && (
        <div
          className="flex items-center gap-2"
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(48, 209, 88, 0.05)',
            border: '1px solid rgba(48, 209, 88, 0.08)',
            marginTop: 4,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#30d158' }} />
          <span style={{ font: 'var(--font-helper)', color: '#30d158' }}>Connected to fal.ai</span>
        </div>
      )}
    </div>
  );
}

/* ===== Main Settings Dialog ===== */
export function SettingsDialog() {
  const { settingsOpen, setSettingsOpen } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>('display');

  if (!settingsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.70)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false); }}
    >
      <div
        className="animate-slide-up flex overflow-hidden"
        style={{
          width: 560,
          height: 420,
          background: 'rgba(26, 26, 28, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Left sidebar — tab list */}
        <div
          className="shrink-0 flex flex-col"
          style={{
            width: 160,
            borderRight: '1px solid var(--color-border)',
            padding: '16px 8px',
          }}
        >
          <div style={{ font: 'var(--font-heading-xxsmall)', color: 'var(--color-text-primary)', padding: '0 8px 12px' }}>
            Settings
          </div>

          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2.5 w-full text-left transition-colors duration-150"
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                font: 'var(--font-label-small)',
                color: activeTab === tab.key ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                background: activeTab === tab.key ? 'rgba(255,255,255,0.08)' : 'transparent',
              }}
              onMouseEnter={(e) => { if (activeTab !== tab.key) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { if (activeTab !== tab.key) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ opacity: activeTab === tab.key ? 1 : 0.5 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0" style={{ padding: '16px 20px 8px' }}>
            <span style={{ font: 'var(--font-heading-xxsmall)', color: 'var(--color-text-primary)' }}>
              {TABS.find((t) => t.key === activeTab)?.label}
            </span>
            <button
              onClick={() => setSettingsOpen(false)}
              className="flex items-center justify-center hover:bg-[rgba(255,255,255,0.06)] transition-colors duration-150"
              style={{ width: 28, height: 28, borderRadius: 8, color: 'var(--color-secondary-c200)' }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '0 20px 20px' }}>
            {activeTab === 'display' && <DisplayTab />}
            {activeTab === 'api' && <ApiTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
