import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
}

export function Tooltip({ content, children, side = 'right', delay = 300 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 8;

    let x = 0;
    let y = 0;

    switch (side) {
      case 'top':
        x = rect.left + rect.width / 2;
        y = rect.top - gap;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2;
        y = rect.bottom + gap;
        break;
      case 'left':
        x = rect.left - gap;
        y = rect.top + rect.height / 2;
        break;
      case 'right':
        x = rect.right + gap;
        y = rect.top + rect.height / 2;
        break;
    }

    setCoords({ x, y });
  }, [side]);

  const show = () => {
    timeout.current = setTimeout(() => {
      updatePosition();
      setVisible(true);
    }, delay);
  };

  const hide = () => {
    clearTimeout(timeout.current);
    setVisible(false);
  };

  useEffect(() => {
    return () => clearTimeout(timeout.current);
  }, []);

  const transformStyle: React.CSSProperties = {
    top: { left: coords.x, top: coords.y, transform: 'translate(-50%, -100%)' },
    bottom: { left: coords.x, top: coords.y, transform: 'translate(-50%, 0)' },
    left: { left: coords.x, top: coords.y, transform: 'translate(-100%, -50%)' },
    right: { left: coords.x, top: coords.y, transform: 'translate(0, -50%)' },
  }[side];

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </div>
      {visible && createPortal(
        <div
          className="fixed pointer-events-none whitespace-nowrap animate-fade-in"
          style={{
            ...transformStyle,
            zIndex: 99999,
            font: 'var(--font-tip)',
            color: 'var(--color-text-primary)',
            background: 'rgba(50, 50, 52, 0.95)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '4px 10px',
            borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}
