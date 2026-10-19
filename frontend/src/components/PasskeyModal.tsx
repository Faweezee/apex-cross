'use client';

import { useState } from 'react';
import { Fingerprint, ShieldCheck } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';
import type { Currency } from '@/types';
import {
  ApiError,
  postReauthOptions,
  postReauthVerify,
  type SwiftWireReceipt,
} from '@/lib/api';
import { formatAmount } from '@/lib/utils';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

export interface WireAuthorizationTarget {
  planId: string;
  beneficiaryName: string;
  beneficiaryAccount: string;
  swiftCode: string;
  amount: number;
  currency: Currency;
  studentId: string;
}

type Phase = 'idle' | 'authenticating' | 'verifying' | 'failed';

interface PasskeyModalProps {
  open: boolean;
  target: WireAuthorizationTarget | null;
  onClose: () => void;
  onSuccess: (receipt: SwiftWireReceipt) => void;
}

/**
 * Tier 3 biometric authorization modal — DESIGN_SYSTEM.md §7 / Flow 1.
 * Native `<dialog>` for high-value wires (> $1,000 USD). Triggers a hardware-backed
 * FIDO2 WebAuthn assertion (Touch ID / Face ID / Windows Hello) constrained to the
 * user's registered credential. Fails closed: no wire executes without verification.
 * Locked while verification is in flight (no backdrop dismiss, no Escape).
 */
export function PasskeyModal({ open, target, onClose, onSuccess }: PasskeyModalProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  if (!open || !target) return null;

  const locked = phase === 'authenticating' || phase === 'verifying';

  async function authenticate() {
    if (!target) return;
    setError(null);
    setPhase('authenticating');
    try {
      const options = await postReauthOptions('student-001');
      const assertion = await startAuthentication({
        optionsJSON: options as unknown as Parameters<typeof startAuthentication>[0]['optionsJSON'],
      });
      setPhase('verifying');
      const response = await postReauthVerify({
        userId: 'student-001',
        assertion: assertion as unknown as Record<string, unknown>,
        plan_id: target.planId,
        beneficiary_name: target.beneficiaryName,
        beneficiary_account: target.beneficiaryAccount,
        swift_code: target.swiftCode,
        amount: target.amount,
        currency: target.currency,
        student_id: target.studentId,
      });
      setPhase('idle');
      onSuccess(response.receipt);
    } catch (cause) {
      setPhase('failed');
      if (cause instanceof ApiError) {
        setError(cause.reason);
      } else {
        setError(
          'Biometric verification was cancelled or failed. The wire was NOT executed and this event has been logged to the audit trail.',
        );
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      testId="tier3-modal"
      locked={locked}
      title="Authorize high-value wire"
      subtitle="This wire exceeds $1,000 USD and requires hardware-backed biometric verification."
      icon={<Fingerprint size={16} strokeWidth={2} className="text-danger" />}
      footer={
        <div className="flex items-center justify-between gap-3">
          <Badge tone="danger">Tier 3 biometric</Badge>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={locked}
              data-testid="tier3-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={authenticate}
              loading={locked}
              icon={<Fingerprint size={14} strokeWidth={2} aria-hidden="true" />}
              data-testid="tier3-authenticate"
            >
              {phase === 'failed' ? 'Try again' : 'Authenticate with passkey'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Wire summary */}
        <dl className="space-y-2" data-testid="tier3-summary">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">
              Beneficiary
            </dt>
            <dd className="text-small text-text-primary">{target.beneficiaryName}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">Account</dt>
            <dd className="font-mono text-mono text-text-primary">{target.beneficiaryAccount}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">
              SWIFT / BIC
            </dt>
            <dd className="font-mono text-mono text-text-primary">{target.swiftCode}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">
              Student ID
            </dt>
            <dd className="font-mono text-mono text-text-primary">{target.studentId}</dd>
          </div>
        </dl>

        <div className="glass-inline flex items-center justify-between gap-3 p-3">
          <span className="text-caption uppercase tracking-[0.05em] text-text-secondary">Amount</span>
          <span className="font-mono text-mono font-medium text-text-primary" data-testid="tier3-amount">
            {target.currency} {formatAmount(target.amount)}
          </span>
        </div>

        {/* Security explanation */}
        <div className="flex items-start gap-2 rounded-md p-3" style={{ background: 'rgba(2, 132, 199, 0.08)' }}>
          <ShieldCheck size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-cobalt" aria-hidden="true" />
          <p className="text-caption text-text-secondary">
            Your device will prompt for biometric confirmation. The signature is verified against
            your pre-registered public key credential — a stolen password cannot authorize this wire.
          </p>
        </div>

        {/* Progress + failure states */}
        {locked ? (
          <p className="text-small text-text-secondary" data-testid="tier3-progress">
            {phase === 'authenticating'
              ? 'Waiting for biometric confirmation...'
              : 'Verifying signature and clearing the wire...'}
          </p>
        ) : null}

        {phase === 'failed' && error ? (
          <p
            data-testid="tier3-error"
            className="rounded-md p-3 text-small text-danger"
            style={{
              background: 'rgba(220, 38, 38, 0.10)',
              border: '1px solid rgba(220,38,38,0.28)',
            }}
          >
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

export default PasskeyModal;

