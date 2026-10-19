'use client';

import { ArrowRightLeft, Lock } from 'lucide-react';
import type { Currency } from '@/types';
import type { MicroConvertResponse } from '@/lib/api';
import { formatAmount } from '@/lib/utils';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

/** Mirrors the backend `DEFAULT_WALLET_BALANCES` for pre-execution projections. */
export const DEFAULT_WALLET_BALANCES: Record<Currency, number> = {
  USD: 10000,
  CNY: 150000,
  HKD: 50000,
  AUD: 15000,
  SGD: 15000,
};

export const TIER2_FEE_RATE = 0.002;
export const DEFAULT_MAX_SLIPPAGE_BPS = 50;

interface Tier2ConvertModalProps {
  open: boolean;
  sourceCurrency: Currency;
  targetCurrency: Currency;
  sourceAmount: number;
  quotedRate: number;
  midMarketRate?: number;
  onClose: () => void;
  onConfirm: () => void;
  executing?: boolean;
  result?: MicroConvertResponse | null;
  errorMessage?: string | null;
}

/**
 * Tier 2 micro-conversion modal — DESIGN_SYSTEM.md §7 / Flow 5.
 * Low-risk conversions (<= $500 USD equivalent) with a locked rate, 0.20% fee,
 * 50 bps slippage guard, and before/after wallet balances. Requires one click only.
 */
export function Tier2ConvertModal({
  open,
  sourceCurrency,
  targetCurrency,
  sourceAmount,
  quotedRate,
  midMarketRate,
  onClose,
  onConfirm,
  executing = false,
  result = null,
  errorMessage = null,
}: Tier2ConvertModalProps) {
  if (!open) return null;

  const feeUsd = sourceAmount * quotedRate * TIER2_FEE_RATE;
  const netSource = sourceAmount * (1 - TIER2_FEE_RATE);
  const projectedTarget = netSource * quotedRate;

  const srcBefore = result?.source_balance_before ?? DEFAULT_WALLET_BALANCES[sourceCurrency];
  const srcAfter = result?.source_balance_after ?? srcBefore - sourceAmount;
  const tgtBefore = result?.target_balance_before ?? DEFAULT_WALLET_BALANCES[targetCurrency];
  const tgtAfter = result?.target_balance_after ?? tgtBefore + projectedTarget;

  const slippageBps =
    midMarketRate && midMarketRate > 0
      ? (Math.abs(quotedRate - midMarketRate) / midMarketRate) * 10000
      : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      testId="tier2-modal"
      title="Confirm micro-conversion"
      subtitle="Tier 2 operation - single-click confirmation, no biometric step-up required."
      icon={<ArrowRightLeft size={16} strokeWidth={2} className="text-cobalt" />}
      footer={
        result ? (
          <div className="flex items-center justify-between gap-3">
            <span
              className="font-mono text-mono-sm text-text-secondary"
              data-testid="tier2-conversion-id"
            >
              {result.conversion_id}
            </span>
            <Button onClick={onClose} data-testid="tier2-done">
              Done
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <Badge tone="cobalt">Tier 2 confirmation</Badge>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={executing}
                data-testid="tier2-cancel"
              >
                Cancel
              </Button>
              <Button onClick={onConfirm} loading={executing} data-testid="tier2-confirm">
                Confirm conversion
              </Button>
            </div>
          </div>
        )
      }
    >
      {result ? (
        <div className="space-y-3" data-testid="tier2-success">
          <Badge tone="success" animate>
            Completed
          </Badge>
          <div className="glass-inline p-3 font-mono text-mono text-text-primary">
            {result.source_currency} {formatAmount(result.source_amount)} &rarr;{' '}
            {result.target_currency} {formatAmount(result.converted_target_amount)}
          </div>
          <dl className="space-y-2">
            <div className="flex items-center justify-between">
              <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">
                Executed rate
              </dt>
              <dd className="font-mono text-mono text-text-primary">
                {result.executed_rate.toFixed(4)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">
                Slippage
              </dt>
              <dd className="font-mono text-mono text-text-primary">
                {result.slippage_bps.toFixed(1)} bps
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-inline p-3">
            <div className="flex items-center justify-between gap-2 font-mono text-mono">
              <span className="text-text-secondary">
                {sourceCurrency} {formatAmount(sourceAmount)}
              </span>
              <span aria-hidden="true" className="text-text-muted">
                &rarr;
              </span>
              <span className="font-medium text-text-primary">
                {targetCurrency} {formatAmount(projectedTarget)}
              </span>
            </div>
          </div>

          <dl className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-caption uppercase tracking-[0.05em] text-text-secondary">
                <Lock size={11} strokeWidth={2} aria-hidden="true" />
                Locked rate
              </dt>
              <dd className="font-mono text-mono text-text-primary" data-testid="tier2-rate">
                1 {sourceCurrency} = {quotedRate.toFixed(4)} {targetCurrency}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">
                Fee (0.20%)
              </dt>
              <dd className="font-mono text-mono text-text-primary" data-testid="tier2-fee">
                ${formatAmount(feeUsd)} USD
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">
                Slippage guard
              </dt>
              <dd className="font-mono text-mono text-text-primary">
                {slippageBps === null
                  ? `${DEFAULT_MAX_SLIPPAGE_BPS} bps max`
                  : `${slippageBps.toFixed(1)} / ${DEFAULT_MAX_SLIPPAGE_BPS} bps`}
              </dd>
            </div>
          </dl>

          <div className="rule-hairline" />

          <div className="space-y-2" data-testid="tier2-balances">
            <div className="flex items-center justify-between gap-2">
              <span className="text-caption uppercase tracking-[0.05em] text-text-secondary">
                {sourceCurrency} wallet
              </span>
              <span className="font-mono text-mono text-text-primary">
                {formatAmount(srcBefore)} &rarr; {formatAmount(srcAfter)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-caption uppercase tracking-[0.05em] text-text-secondary">
                {targetCurrency} wallet
              </span>
              <span className="font-mono text-mono text-mint">
                {formatAmount(tgtBefore)} &rarr; {formatAmount(tgtAfter)}
              </span>
            </div>
          </div>

          {errorMessage ? (
            <p
              data-testid="tier2-error"
              className="rounded-md p-3 text-small text-danger"
              style={{
                background: 'rgba(220, 38, 38, 0.10)',
                border: '1px solid rgba(220,38,38,0.28)',
              }}
            >
              {errorMessage}
            </p>
          ) : null}
        </div>
      )}
    </Modal>
  );
}

export default Tier2ConvertModal;

