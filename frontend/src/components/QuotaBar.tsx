'use client';

import { Gauge } from 'lucide-react';
import { cn, formatAmount, quotaPercentage } from '@/lib/utils';

export const ANNUAL_QUOTA_USD = 50000;
export const WARNING_THRESHOLD_USD = 5000;

export type QuotaDecision = 'ALLOW' | 'WARNING' | 'REJECT';

interface QuotaBarProps {
  /** Remaining annual allowance in USD. */
  remainingUsd: number;
  /** Explicit decision flag from the backend. Defaults to a derived value. */
  decision?: QuotaDecision;
  /** Compact variant used inside the header. */
  compact?: boolean;
  className?: string;
}

function deriveDecision(remainingUsd: number): QuotaDecision {
  if (remainingUsd <= 0) return 'REJECT';
  if (remainingUsd < WARNING_THRESHOLD_USD) return 'WARNING';
  return 'ALLOW';
}

const DECISION_COLOR: Record<QuotaDecision, string> = {
  ALLOW: '#02F5A1',
  WARNING: '#D97706',
  REJECT: '#DC2626',
};

const DECISION_LABEL: Record<QuotaDecision, string> = {
  ALLOW: 'Within allowance',
  WARNING: 'Low allowance',
  REJECT: 'Quota exhausted',
};

/**
 * Annual SAFE foreign exchange quota telemetry — DESIGN_SYSTEM.md §13.
 * $50,000 USD annual limit; bar fills to the used percentage with eased animation.
 */
export function QuotaBar({ remainingUsd, decision, compact = false, className }: QuotaBarProps) {
  const resolved = decision ?? deriveDecision(remainingUsd);
  const clampedRemaining = Math.max(0, Math.min(remainingUsd, ANNUAL_QUOTA_USD));
  const usedUsd = ANNUAL_QUOTA_USD - clampedRemaining;
  const usedPct = quotaPercentage(usedUsd, ANNUAL_QUOTA_USD);
  const color = DECISION_COLOR[resolved];

  return (
    <div
      data-testid="quota-bar"
      data-decision={resolved}
      className={cn('glass-card card-sheen flex flex-col gap-2 p-3', compact ? 'min-w-[260px]' : 'w-full', className)}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-caption font-medium uppercase tracking-[0.05em] text-text-secondary">
          <Gauge size={13} strokeWidth={1.5} aria-hidden="true" />
          Annual FX Quota
        </span>
        <span
          className="font-mono text-mono-sm font-medium"
          style={{ color }}
          data-testid="quota-remaining"
        >
          ${formatAmount(clampedRemaining)} USD
        </span>
      </div>

      <div
        className="relative h-1.5 w-full overflow-hidden rounded-sm"
        style={{ background: 'rgba(30, 41, 59, 0.8)' }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(usedPct)}
        aria-label="Annual foreign exchange quota utilization"
      >
        <div
          data-testid="quota-fill"
          className="h-full rounded-sm animate-bar-fill"
          style={{
            width: `${usedPct}%`,
            background: `linear-gradient(90deg, ${color} 0%, ${color}99 100%)`,
            boxShadow: `0 0 12px ${color}55`,
          }}
        />
      </div>

      {!compact ? (
        <div className="flex items-center justify-between gap-3 text-caption text-text-muted">
          <span className="font-mono">
            Used ${formatAmount(usedUsd)} / ${formatAmount(ANNUAL_QUOTA_USD)}
          </span>
          <span style={{ color }}>{DECISION_LABEL[resolved]}</span>
        </div>
      ) : null}
    </div>
  );
}

export default QuotaBar;
