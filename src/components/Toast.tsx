import { useEffect, useState } from 'react';
import { useAppStore } from '../store/app-store';

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

const TOAST_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  error: { bg: 'rgba(255, 69, 58, 0.14)', border: 'rgba(255, 69, 58, 0.25)', text: '#ff6961' },
  success: { bg: 'rgba(48, 209, 88, 0.14)', border: 'rgba(48, 209, 88, 0.25)', text: '#30d158' },
  info: { bg: 'rgba(26, 26, 28, 0.85)', border: 'var(--color-border)', text: 'var(--color-text-primary)' },
};

const TOAST_DURATION = 4000;
const FADE_OUT_MS = 400;

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  return (
    <div
      className="fixed z-[9999] flex flex-col items-center gap-2 pointer-events-none"
      style={{ top: 60, left: '50%', transform: 'translateX(-50%)' }}
    >
      {toasts.map((toast) => (
        <SingleToast key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function SingleToast({ toast, onRemove }: { toast: ToastItem; onRemove: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter');

  useEffect(() => {
    // Fade in
    const enterTimer = requestAnimationFrame(() => setPhase('visible'));

    // Start fade out before removal
    const exitTimer = setTimeout(() => setPhase('exit'), TOAST_DURATION - FADE_OUT_MS);

    // Actually remove
    const removeTimer = setTimeout(onRemove, TOAST_DURATION);

    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [onRemove]);

  const colors = TOAST_COLORS[toast.type] || TOAST_COLORS.info;

  return (
    <div
      className="pointer-events-auto"
      style={{
        font: 'var(--font-body-small)',
        padding: '10px 20px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: colors.bg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${colors.border}`,
        color: colors.text,
        boxShadow: 'var(--shadow-lg)',
        opacity: phase === 'visible' ? 1 : 0,
        transform: phase === 'enter' ? 'translateY(-8px)' : phase === 'exit' ? 'translateY(-4px)' : 'translateY(0)',
        transition: `opacity ${phase === 'enter' ? '200ms' : `${FADE_OUT_MS}ms`} ease-out, transform ${phase === 'enter' ? '200ms' : `${FADE_OUT_MS}ms`} ease-out`,
        whiteSpace: 'nowrap',
      }}
    >
      {toast.message}
    </div>
  );
}
