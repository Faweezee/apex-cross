'use client';

import { ArrowRightLeft, Check, TrendingDown, Zap } from 'lucide-react';
import type { RemittanceRoute } from '@/types';
import { cn, formatAmount } from '@/lib/utils';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface CorridorCardsProps {
  routes: RemittanceRoute[];
  selectedRail?: string | null;
  onSelect?: (route: RemittanceRoute) => void;
  /** Read-only mode used inside the DAG panel before execution. */
  interactive?: boolean;
}

/**
 * Tier 1 FX corridor comparator — DESIGN_SYSTEM.md §13.1.
 * Three equal-width glass cards; the recommended corridor carries the only mint glow.
 * All monetary figures use IBM Plex Mono tabular numerals.
 */
export function CorridorCards({
  routes,
  selectedRail,
  onSelect,
  interactive = true,
}: CorridorCardsProps) {
  if (routes.length === 0) return null;

  return (
    <div className="grid w-full gap-4 md:grid-cols-3" data-testid="corridor-cards">
      {routes.map((route) => {
        const recommended = route.is_recommended;
        const selected = selectedRail === route.rail_name;
        return (
          <article
            key={route.rail_name}
            data-testid={`corridor-card-${route.rail_name.replace(/\s+/g, '-').toLowerCase()}`}
            data-recommended={recommended}
            data-selected={selected}
            className={cn(
              'glass-card card-sheen lift flex flex-col gap-4 p-6',
              (recommended || selected) && 'border-mint/30',
            )}
            style={
              recommended
                ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px rgba(2,245,161,0.12), 0 0 60px rgba(2,245,161,0.06)' }
                : undefined
            }
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={15} strokeWidth={1.5} className="shrink-0 text-text-secondary" />
                <h3 className="text-h4 font-semibold leading-snug text-text-primary">
                  {route.rail_name}
                </h3>
              </div>
              {recommended ? (
                <Badge tone="mint" animate icon={<Zap size={11} strokeWidth={2} />}>
                  Recommended
                </Badge>
              ) : null}
            </div>

            {/* Amount conversion block */}
            <div className="glass-inline flex flex-col gap-1.5 p-3">
              <div className="flex items-center justify-between gap-2 font-mono text-mono">
                <span className="text-text-secondary">
                  {route.source_currency} {formatAmount(route.source_amount)}
                </span>
                <span aria-hidden="true" className="text-text-muted">
                  &rarr;
                </span>
                <span className="font-medium text-text-primary">
                  {route.target_currency} {formatAmount(route.target_amount)}
                </span>
              </div>
              <p className="font-mono text-mono-sm text-text-muted">
                1 {route.source_currency} = {route.exchange_rate.toFixed(4)} {route.target_currency}
              </p>
            </div>

            {/* Telemetry */}
            <dl className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">Fee</dt>
                <dd className="font-mono text-mono text-text-primary">
                  ${formatAmount(route.total_fee_usd)} USD
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">
                  Arrival
                </dt>
                <dd className="font-mono text-mono text-text-primary">
                  {route.estimated_arrival_hours} hours
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">
                  Savings
                </dt>
                <dd
                  className={cn(
                    'flex items-center gap-1 font-mono text-mono',
                    route.savings_vs_standard_usd > 0 ? 'text-mint' : 'text-text-muted',
                  )}
                >
                  {route.savings_vs_standard_usd > 0 ? (
                    <TrendingDown size={12} strokeWidth={2} aria-hidden="true" />
                  ) : null}
                  ${formatAmount(route.savings_vs_standard_usd)} USD
                </dd>
              </div>
            </dl>

            {/* Action */}
            {interactive && onSelect ? (
              <Button
                variant={recommended ? 'accent' : 'ghost'}
                className="mt-auto w-full"
                icon={selected ? <Check size={14} strokeWidth={2} aria-hidden="true" /> : undefined}
                onClick={() => onSelect(route)}
                data-testid={`corridor-select-${route.rail_name.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {selected ? 'Selected' : 'Select this route'}
              </Button>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

export default CorridorCards;
