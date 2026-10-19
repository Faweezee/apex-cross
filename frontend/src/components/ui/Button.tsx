import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'accent' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
  loading?: boolean;
  children: ReactNode;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  accent: 'btn-accent',
  ghost: 'btn-ghost',
  danger: 'btn-accent',
};

/**
 * Button primitive — DESIGN_SYSTEM.md §13, radius 8px, hover lift <= 1px.
 * `danger` reuses the accent button geometry with the fail-closed crimson gradient.
 */
export function Button({
  variant = 'accent',
  icon,
  loading = false,
  children,
  className,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const dangerStyle =
    variant === 'danger'
      ? {
          background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
          color: '#F1F5F9',
        }
      : undefined;

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(VARIANT_CLASS[variant], className)}
      style={{ ...dangerStyle, ...style }}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : icon ? (
        <span className="flex shrink-0 items-center">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

export default Button;
