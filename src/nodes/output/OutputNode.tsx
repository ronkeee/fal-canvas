import { type NodeProps } from '@xyflow/react';
import { Eye, Download } from 'lucide-react';
import { BaseNode } from '../base/BaseNode';
import { useExecutionStore } from '../../store/execution-store';
import type { PortDef } from '../../engine/types';

const inputs: PortDef[] = [
  { id: 'default', label: 'Input', type: 'any', required: true },
];

export function OutputNode({ id, selected }: NodeProps) {
  const nodeState = useExecutionStore((s) => s.nodeStates[id]);
  const result = nodeState?.result as Record<string, unknown> | undefined;

  const imageUrl = result?.image as string | undefined;
  const videoUrl = result?.video as string | undefined;
  const textContent = result?.text as string | undefined;

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  return (
    <BaseNode
      id={id}
      label="Output"
      category="output"
      icon={<Eye size={14} />}
      inputs={inputs}
      selected={selected}
    >
      <div className="min-h-[60px]">
        {!result && (
          <div
            className="flex items-center justify-center h-[60px] rounded"
            style={{
              font: 'var(--font-helper)',
              backgroundColor: 'var(--color-surface-hover)',
              color: 'var(--color-text-secondary)',
              border: '1px dashed var(--color-border)',
            }}
          >
            Run flow to see output
          </div>
        )}

        {imageUrl && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="rounded overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
              <img src={imageUrl} alt="Output" className="w-full h-auto" />
            </div>
            <button
              onClick={() => handleDownload(imageUrl, 'fal-canvas-output.png')}
              className="flex items-center gap-1 px-2 py-1 rounded nodrag"
              style={{
                font: 'var(--font-helper)',
                backgroundColor: 'var(--color-surface-hover)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Download size={10} /> Download
            </button>
          </div>
        )}

        {videoUrl && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <video src={videoUrl} controls className="w-full rounded" />
            <button
              onClick={() => handleDownload(videoUrl, 'fal-canvas-output.mp4')}
              className="flex items-center gap-1 px-2 py-1 rounded nodrag"
              style={{
                font: 'var(--font-helper)',
                backgroundColor: 'var(--color-surface-hover)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Download size={10} /> Download
            </button>
          </div>
        )}

        {textContent && !imageUrl && !videoUrl && (
          <div
            className="rounded px-2 py-1.5 break-words"
            style={{
              font: 'var(--font-body-small)',
              backgroundColor: 'var(--color-surface-hover)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            {textContent}
          </div>
        )}

        {nodeState?.status === 'running' && (
          <div className="flex items-center gap-2 mt-1" style={{ font: 'var(--font-helper)', color: 'var(--color-text-secondary)' }}>
            <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            Receiving...
          </div>
        )}
      </div>
    </BaseNode>
  );
}
