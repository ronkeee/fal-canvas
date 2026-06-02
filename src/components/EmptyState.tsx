import { useEffect, useMemo, useState } from 'react';
import { ImageIcon, Video, ArrowUpCircle, GitCompare, FolderOpen, Plus } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useFlowStore } from '../store/flow-store';
import { usePopoverStore } from '../store/popover-store';
import { useAppStore } from '../store/app-store';
import { TEMPLATES } from '../templates';

const TEMPLATE_META: Record<string, { icon: React.ReactNode; subtitle: string }> = {
  'Text to Image': { icon: <ImageIcon size={22} />, subtitle: 'Prompt to picture' },
  'Image to Video': { icon: <Video size={22} />, subtitle: 'Animate any image' },
  'Multi-Model Compare': { icon: <GitCompare size={22} />, subtitle: 'Side-by-side models' },
  'Image Upscale': { icon: <ArrowUpCircle size={22} />, subtitle: 'Enhance resolution' },
};

const ACCENT = '#7848ff';

const cardBase: React.CSSProperties = {
  flex: '1 1 0',
  minWidth: 140,
  height: 200,
  padding: '22px 16px 18px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-sm)',
  gap: 10,
};

export function EmptyState() {
  const nodes = useFlowStore((s) => s.nodes);
  const fromJSON = useFlowStore((s) => s.fromJSON);
  const listSavedFlows = useFlowStore((s) => s.listSavedFlows);
  const { fitView } = useReactFlow();
  const savedFlows = useMemo(() => listSavedFlows(), [listSavedFlows]);
  const flowId = useFlowStore((s) => s.flowMeta.id);
  const [dismissed, setDismissed] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const greetings = hour < 6
      ? ['Night owl mode, Ron', 'Late night flow, Ron?', 'Burning the midnight oil, Ron']
      : hour < 12
      ? ['Good morning, Ron', 'Morning, Ron! Ready to create?', 'Fresh start, Ron']
      : hour < 17
      ? ['Good afternoon, Ron', 'Afternoon flow, Ron', 'Hey Ron, what are we building?']
      : hour < 21
      ? ['Good evening, Ron', 'Evening session, Ron', 'Hey Ron, one more flow?']
      : ['Late session, Ron', 'Still going, Ron?', 'Night mode, Ron'];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, []);

  // Reset dismissed when a new flow is created (e.g. clicking "New" in TopBar)
  useEffect(() => {
    setDismissed(false);
  }, [flowId]);

  if (nodes.length > 0 || dismissed) return null;

  const handleLoadTemplate = (index: number) => {
    const template = TEMPLATES[index];
    fromJSON({
      id: `template_${Date.now()}`,
      name: template.name,
      description: template.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nodes: JSON.parse(JSON.stringify(template.nodes)),
      edges: JSON.parse(JSON.stringify(template.edges)),
    });
    usePopoverStore.getState().dismissAll();
    const promptNode = template.nodes.find((n) => n.type === 'prompt');
    if (promptNode) {
      useAppStore.getState().setSelectedNodeId(promptNode.id);
    }
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100);
  };

  const handleOpenMyFlows = () => {
    useAppStore.getState().setFlowBrowserOpen(true);
  };

  const handleStartFromScratch = () => {
    setDismissed(true);
    usePopoverStore.getState().dismissAll();
  };

  const hasFlows = savedFlows.length > 0;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-[5] pointer-events-none animate-fade-in" style={{ paddingLeft: 64 }}>
      <div className="pointer-events-auto">
        <h2 style={{ font: '700 34px/40px var(--font-family-display)', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', marginBottom: 48, textAlign: 'center' }}>
          {greeting}
        </h2>

        {/* All cards in one row */}
        <div className="flex gap-3" style={{ width: 1100 }}>
          {TEMPLATES.map((template, i) => {
            const meta = TEMPLATE_META[template.name];
            return (
              <button
                key={template.name}
                onClick={() => handleLoadTemplate(i)}
                className="flex flex-col items-start text-left transition-all duration-150 hover:brightness-110"
                style={cardBase}
              >
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center"
                  style={{ background: `${ACCENT}15`, color: ACCENT }}
                >
                  {meta?.icon || <ImageIcon size={22} />}
                </div>
                <div className="mt-auto">
                  <div style={{ font: 'var(--font-label-small)', color: 'var(--color-text-primary)' }}>
                    {template.name}
                  </div>
                  <div className="mt-0.5" style={{ font: 'var(--font-helper)', color: 'var(--color-text-muted)' }}>
                    {meta?.subtitle}
                  </div>
                </div>
              </button>
            );
          })}

          {/* My Flows */}
          {hasFlows && (
            <button
              onClick={handleOpenMyFlows}
              className="flex flex-col items-start text-left transition-all duration-150 hover:brightness-110"
              style={cardBase}
            >
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-secondary)' }}
              >
                <FolderOpen size={22} />
              </div>
              <div className="mt-auto">
                <div style={{ font: 'var(--font-label-small)', color: 'var(--color-text-primary)' }}>
                  My Flows
                </div>
                <div className="mt-0.5" style={{ font: 'var(--font-helper)', color: 'var(--color-text-muted)' }}>
                  {savedFlows.length} saved flow{savedFlows.length !== 1 ? 's' : ''}
                </div>
              </div>
            </button>
          )}

          {/* Start from Scratch */}
          <button
            onClick={handleStartFromScratch}
            className="flex flex-col items-start text-left transition-all duration-150 hover:brightness-110"
            style={{ ...cardBase, border: '1px dashed var(--color-border)' }}
          >
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)' }}
            >
              <Plus size={22} />
            </div>
            <div className="mt-auto">
              <div style={{ font: 'var(--font-label-small)', color: 'var(--color-text-primary)' }}>
                Start from Scratch
              </div>
              <div className="mt-0.5" style={{ font: 'var(--font-helper)', color: 'var(--color-text-muted)' }}>
                Empty canvas
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
