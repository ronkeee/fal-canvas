import { type NodeProps } from '@xyflow/react';
import { Upload, Loader2, Music2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { BaseNode } from '../base/BaseNode';
import { useFlowStore } from '../../store/flow-store';
import { uploadFile } from '../../fal/fal-service';
import { useAppStore } from '../../store/app-store';
import type { PortDef } from '../../engine/types';

const outputs: PortDef[] = [
  { id: 'image', label: 'Image', type: 'image', required: false },
  { id: 'video', label: 'Video', type: 'video', required: false },
  { id: 'audio', label: 'Audio', type: 'audio', required: false },
];

export function FileUploadNode({ id, data, selected }: NodeProps) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const rawPreviewUrl = data.previewUrl as string | undefined;
  const cdnUrl = data.cdnUrl as string | undefined;
  const fileType = (data.fileType as 'image' | 'video' | 'audio') || 'image';
  // Use CDN URL as fallback when blob: URL is stale (after reload)
  const previewUrl = (rawPreviewUrl && !rawPreviewUrl.startsWith('blob:')) ? rawPreviewUrl
    : (rawPreviewUrl && typeof document !== 'undefined') ? rawPreviewUrl  // blob might still be valid in same session
    : cdnUrl; // fallback to CDN
  const hasFile = !!(previewUrl || cdnUrl);

  const handleFile = async (file: File) => {
    // Detect file type from MIME
    const detectedType: 'image' | 'video' | 'audio' = file.type.startsWith('video/')
      ? 'video'
      : file.type.startsWith('audio/')
      ? 'audio'
      : 'image';
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    updateNodeData(id, { previewUrl: localUrl, fileName: file.name, fileType: detectedType, cdnUrl: undefined });

    // Check if API key is set
    const falApiKey = useAppStore.getState().falApiKey;
    if (!falApiKey) {
      useAppStore.getState().addToast('Set your fal.ai API key to enable file upload', 'error');
      useAppStore.getState().setSettingsOpen(true);
      return;
    }

    // Upload to fal CDN for public URL
    setUploading(true);
    try {
      const url = await uploadFile(file);
      updateNodeData(id, { cdnUrl: url });
      useAppStore.getState().addToast('File uploaded', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      useAppStore.getState().addToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <BaseNode
      id={id}
      label="File Upload"
      category="input"
      icon={<Upload size={14} />}
      outputs={outputs}
      selected={selected}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!hasFile ? (
          <div
            className="flex flex-col items-center justify-center h-[80px] rounded cursor-pointer nodrag"
            style={{
              font: 'var(--font-helper)',
              backgroundColor: 'var(--color-surface-hover)',
              color: 'var(--color-text-secondary)',
              border: '2px dashed var(--color-border)',
            }}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleDrop}
          >
            <Upload size={20} style={{ marginBottom: 4, opacity: 0.5 }} />
            Drop file or click
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Audio placeholder */}
            {fileType === 'audio' ? (
              <div
                className="relative rounded cursor-pointer nodrag"
                onClick={() => fileRef.current?.click()}
                title="Click to replace"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-hover)',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                {/* Waveform visual */}
                <div className="flex items-center justify-center gap-[3px]" style={{ padding: '16px 12px 12px' }}>
                  <Music2 size={18} style={{ color: '#30d158', flexShrink: 0, marginRight: 6 }} />
                  {Array.from({ length: 18 }).map((_, i) => {
                    const heights = [6,10,14,18,22,16,12,20,24,18,14,22,16,10,18,14,8,12];
                    return (
                      <div
                        key={i}
                        style={{
                          width: 3,
                          height: heights[i] ?? 10,
                          borderRadius: 2,
                          background: '#30d158',
                          opacity: 0.7 + (i % 3) * 0.1,
                          flexShrink: 0,
                        }}
                      />
                    );
                  })}
                </div>
                {/* Native audio player */}
                <audio
                  src={previewUrl || cdnUrl}
                  controls
                  className="w-full nodrag"
                  style={{ display: 'block', height: 32, marginTop: 4 }}
                  onClick={(e) => e.stopPropagation()}
                />
                {uploading && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.5)' }}
                  >
                    <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-text-primary)' }} />
                  </div>
                )}
              </div>
            ) : (
              /* Image / Video preview */
              <div
                className="relative rounded overflow-hidden border cursor-pointer nodrag"
                style={{ borderColor: 'var(--color-border)' }}
                onClick={() => fileRef.current?.click()}
                title="Click to replace"
              >
                {fileType === 'video' ? (
                  <video
                    src={previewUrl || cdnUrl}
                    className="w-full h-auto"
                    controls
                    style={{ display: 'block' }}
                  />
                ) : (
                  <img
                    src={previewUrl || cdnUrl}
                    alt="Upload"
                    className="w-full h-auto"
                    onError={(e) => {
                      if (cdnUrl && e.currentTarget.src !== cdnUrl) {
                        e.currentTarget.src = cdnUrl;
                      }
                    }}
                  />
                )}
                {uploading && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.5)' }}
                  >
                    <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-text-primary)' }} />
                  </div>
                )}
              </div>
            )}

            {/* Filename row */}
            <div className="flex items-center justify-between gap-2">
              <span className="truncate" style={{ font: 'var(--font-helper)', color: 'var(--color-text-secondary)' }}>
                {(data.fileName as string) || 'uploaded'}
              </span>
              <span style={{ font: 'var(--font-tiny-label)', color: 'var(--color-text-secondary)', flexShrink: 0, textTransform: 'uppercase', opacity: 0.6 }}>
                {fileType}
              </span>
              {cdnUrl && !uploading && (
                <span style={{ font: 'var(--font-tiny-label)', color: '#30d158', flexShrink: 0 }}>
                  ✓ CDN
                </span>
              )}
              <button
                onClick={() => {
                  updateNodeData(id, { previewUrl: undefined, fileName: undefined, cdnUrl: undefined, fileType: undefined });
                }}
                className="px-1 rounded nodrag shrink-0"
                style={{ font: 'var(--font-helper)', color: 'var(--color-text-secondary)' }}
              >
                Clear
              </button>
            </div>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*,audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
    </BaseNode>
  );
}
