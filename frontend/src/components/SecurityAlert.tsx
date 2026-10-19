'use client';

import { ShieldAlert, X } from 'lucide-react';
import { Button } from './ui/Button';

interface SecurityAlertProps {
  reason: string;
  onDismiss: () => void;
  onViewLedger?: () => void;
}

/**
 * Fail-closed security banner — DESIGN_SYSTEM.md §7, shown when the pre-agent
 * firewall blocks an adversarial prompt (HTTP 403 SecurityException).
 * Crimson containment glow, never a purple/generic error toast.
 */
export function SecurityAlert({ reason, onDismiss, onViewLedger }: SecurityAlertProps) {
  return (
    <div
      role="alert"
      data-testid="security-alert"
      className="card-sheen relative w-full max-w-chat overflow-hidden rounded-lg border p-4"
      style={{
        background: 'rgba(60, 12, 12, 0.55)',
        borderColor: 'rgba(220, 38, 38, 0.35)',
        backdropFilter: 'blur(24px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px rgba(220,38,38,0.15), 0 0 60px rgba(220,38,38,0.08)',
      }}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
          style={{ background: 'rgba(220, 38, 38, 0.15)' }}
        >
          <ShieldAlert size={16} strokeWidth={2} className="text-danger" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-h4 font-semibold uppercase tracking-[0.05em] text-danger">
            Prompt blocked by security firewall
          </p>
          <p className="mt-1 text-small text-text-secondary" data-testid="security-alert-reason">
            {reason}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {onViewLedger ? (
              <button
                type="button"
                onClick={onViewLedger}
                data-testid="security-alert-ledger-link"
                className="glass-inline px-2 py-1 text-caption font-medium uppercase tracking-[0.05em] text-danger transition-colors hover:text-text-primary"
              >
                Logged to audit trail
              </button>
            ) : null}
            <span className="text-caption text-text-muted">
              Fail-closed: no funds were moved and no plan was compiled.
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={onDismiss}
          aria-label="Dismiss security alert"
          data-testid="security-alert-dismiss"
          className="shrink-0 border-0 px-2 py-1"
        >
          <X size={14} strokeWidth={2} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export default SecurityAlert;
