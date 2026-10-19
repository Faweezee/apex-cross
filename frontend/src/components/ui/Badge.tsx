import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'mint' | 'cobalt' | 'success' | 'warning' | 'danger';

const TONE_STYLES: Record<BadgeTone, string> = {
  neutral: 'text-text-secondary',
  mint: 'text-mint',
  cobalt: 'text-cobalt',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

const TONE_BACKGROUND: Record<BadgeTone, string> = {
  neutral: 'rgba(30, 41, 59, 0.70)',
  mint: 'rgba(2, 245, 161, 0.10)',
  cobalt: 'rgba(2, 132, 199, 0.12)',
  success: 'rgba(5, 150, 105, 0.12)',
  warning: 'rgba(217, 119, 6, 0.12)',
  danger: 'rgba(220, 38, 38, 0.12)',
};

const TONE_BORDER: Record<BadgeTone, string> = {
  neutral: 'rgba(255, 255, 255, 0.06)',
  mint: 'rgba(2, 245, 161, 0.24)',
  cobalt: 'rgba(2, 132, 199, 0.28)',
  success: 'rgba(5, 150, 105, 0.28)',
  warning: 'rgba(217, 119, 6, 0.28)',
  danger: 'rgba(220, 38, 38, 0.28)',
};

interface BadgeProps {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  animate?: boolean;
  title?: string;
  'data-testid'?: string;
}

/**
 * Status badge — DESIGN_SYSTEM.md §13.2
 * radius 4px, height 22px, uppercase caption, glass Tier 3.
 */
export function Badge({
  tone = 'neutral',
  icon,
  children,
  className,
  animate = false,
  title,
  'data-testid': testId,
}: BadgeProps) {
  return (
    <span
      data-testid={testId}
      title={title}
      className={cn('badge', TONE_STYLES[tone], animate && 'animate-badge-pop', className)}
      style={{
        backgroundColor: TONE_BACKGROUND[tone],
        borderColor: TONE_BORDER[tone],
      }}
    >
      {icon ? <span className="flex shrink-0 items-center">{icon}</span> : null}
      {children}
    </span>
  );
}

export default Badge;
