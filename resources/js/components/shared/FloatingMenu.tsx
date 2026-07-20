import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { HTMLAttributes, ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';

interface FloatingMenuProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'style' | 'children'
> {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
  align?: 'left' | 'right';
  children: ReactNode;
}

/**
 * Renders `children` in a portal at `document.body`, positioned with
 * `position: fixed` under the trigger element. Unlike a plain
 * `absolute`-positioned panel, this escapes any scrollable/clipping ancestor
 * (e.g. a modal with `overflow-y-auto`), which was clipping dropdowns like
 * the project-role select when their row was near the bottom of the modal.
 */
export const FloatingMenu = ({
  open,
  onClose,
  triggerRef,
  align = 'right',
  className = '',
  children,
  ...rest
}: FloatingMenuProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    right: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Flip above the trigger when there's little room below and more
      // room above — e.g. a row near the bottom of a scrolled modal.
      const openUpward = spaceBelow < 200 && spaceAbove > spaceBelow;

      setPosition({
        ...(openUpward
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        left: rect.left,
        right: window.innerWidth - rect.right,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose, triggerRef]);

  if (!open || !position) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        ...(position.top !== undefined
          ? { top: position.top }
          : { bottom: position.bottom }),
        ...(align === 'right'
          ? { right: position.right }
          : { left: position.left }),
      }}
      className={`z-50 overflow-hidden rounded-lg border border-dark-border bg-dark-surface-2 py-1 shadow-2xl ${className}`}
      {...rest}
    >
      {children}
    </div>,
    document.body,
  );
};
