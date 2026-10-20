'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { X } from '@/components/icons';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  /** Override the icon container geometry (default h-9 w-9 rounded-md mint tint). */
  iconContainerClassName?: string;
  iconContainerStyle?: CSSProperties;
  width?: 'modal' | 'receipt';
  children: ReactNode;
  footer?: ReactNode;
  /** When true the backdrop click and Escape are ignored (destructive in-flight action). */
  locked?: boolean;
  testId?: string;
}

/**
 * Native HTML5 `<dialog>` wrapper — DESIGN_SYSTEM.md §5 Tier 2 / §11 one-modal-at-a-time.
 * Uses `showModal()` for native top-layer focus trapping and `::backdrop` frost blur.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  iconContainerClassName,
  iconContainerStyle,
  width = 'modal',
  children,
  footer,
  locked = false,
  testId,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    function onCancel(event: Event) {
      if (locked) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      onClose();
    }

    dialog.addEventListener('cancel', onCancel);
    return () => dialog.removeEventListener('cancel', onCancel);
  }, [locked, onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      data-testid={testId}
      aria-labelledby={`${testId ?? 'modal'}-title`}
      className={cn('apex-dialog w-[calc(100vw-32px)]', width === 'modal' ? 'max-w-modal' : 'max-w-receipt')}
      onClick={(event) => {
        if (locked) return;
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="card-sheen relative">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-glass p-6">
          {icon ? (
            <span
              aria-hidden="true"
              className={cn(
                'flex shrink-0 items-center justify-center rounded-md',
                iconContainerClassName ?? 'mt-0.5 h-9 w-9',
              )}
              style={{
                background: iconContainerStyle?.background ?? 'rgba(2, 245, 161, 0.10)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                ...iconContainerStyle,
              }}
            >
              {icon}
            </span>
          ) : null}

          <div className="min-w-0 flex-1">
            <h2
              id={`${testId ?? 'modal'}-title`}
              className="text-h3 font-semibold text-text-primary"
            >
              {title}
            </h2>
            {subtitle ? <p className="mt-1 text-small text-text-secondary">{subtitle}</p> : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={locked}
            aria-label="Close dialog"
            data-testid={`${testId ?? 'modal'}-close`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors duration-200 hover:text-text-primary disabled:opacity-30"
          >
            <X size={17} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {footer ? <div className="border-t border-glass p-6 pt-4">{footer}</div> : null}
      </div>
    </dialog>
  );
}

export default Modal;
