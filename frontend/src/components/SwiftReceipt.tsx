'use client';

import { useState } from 'react';
import { Check, Copy, FileCheck } from 'lucide-react';
import type { SwiftWireReceipt } from '@/lib/api';
import { formatAmount } from '@/lib/utils';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

interface SwiftReceiptProps {
  open: boolean;
  receipt: SwiftWireReceipt | null;
  onClose: () => void;
  onViewLedger?: () => void;
}

/** Copy-to-clipboard affordance for monospace hash / message blocks. */
function CopyButton({ value, testId }: { value: string; testId: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      data-testid={testId}
      aria-label="Copy to clipboard"
      className="glass-inline flex h-7 w-7 shrink-0 items-center justify-center text-text-secondary transition-colors duration-200 hover:text-mint"
    >
      {copied ? (
        <Check size={12} strokeWidth={2} aria-hidden="true" className="text-mint" />
      ) : (
        <Copy size={12} strokeWidth={2} aria-hidden="true" />
      )}
    </button>
  );
}


/**
 * SWIFT MT103 settlement receipt — DESIGN_SYSTEM.md §7 / Flow 1.
 * Bank-grade monospace message viewer with copy affordances and the 64-character
 * SHA-256 transaction hash for independent verification.
 */
export function SwiftReceipt({ open, receipt, onClose, onViewLedger }: SwiftReceiptProps) {
  if (!open || !receipt) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      testId="swift-receipt"
      width="receipt"
      title="Wire settled"
      subtitle="SWIFT MT103 single customer credit transfer confirmation."
      icon={<FileCheck size={16} strokeWidth={2} className="text-mint" />}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge tone="success" animate data-testid="swift-status">
            {receipt.status}
          </Badge>
          <div className="flex items-center gap-2">
            {onViewLedger ? (
              <Button variant="ghost" onClick={onViewLedger} data-testid="swift-view-ledger">
                View audit record
              </Button>
            ) : null}
            <Button onClick={onClose} data-testid="swift-done">
              Done
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Reference block */}
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="glass-inline p-3">
            <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">
              Reference
            </dt>
            <dd className="mt-1 font-mono text-mono text-text-primary" data-testid="swift-reference">
              {receipt.reference_id}
            </dd>
          </div>
          <div className="glass-inline p-3">
            <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">
              Value date
            </dt>
            <dd className="mt-1 font-mono text-mono text-text-primary">{receipt.value_date}</dd>
          </div>
          <div className="glass-inline p-3 sm:col-span-2">
            <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">
              UETR (end-to-end tracking)
            </dt>
            <dd className="mt-1 break-all font-mono text-mono-sm text-text-secondary">
              {receipt.uetr}
            </dd>
          </div>
        </dl>

        {/* Settlement amount */}
        <div className="glass-inline flex items-center justify-between gap-3 p-3">
          <span className="text-caption uppercase tracking-[0.05em] text-text-secondary">
            Settled amount
          </span>
          <span className="font-mono text-mono font-medium text-text-primary">
            {receipt.currency} {formatAmount(receipt.amount)}
          </span>
        </div>

        {/* MT103 message */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-caption font-medium uppercase tracking-[0.05em] text-text-secondary">
              SWIFT MT103 message
            </span>
            <CopyButton value={receipt.mt103_message} testId="swift-copy-mt103" />
          </div>
          <pre
            data-testid="swift-mt103"
            className="max-h-64 overflow-auto rounded-md border border-glass p-3 font-mono text-mono-sm leading-relaxed text-text-secondary"
            style={{ background: 'rgba(7, 25, 30, 0.75)' }}
          >
            {receipt.mt103_message}
          </pre>
        </div>

        {/* SHA-256 hash */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-caption font-medium uppercase tracking-[0.05em] text-text-secondary">
              SHA-256 transaction hash
            </span>
            <CopyButton value={receipt.transaction_hash} testId="swift-copy-hash" />
          </div>
          <p
            data-testid="swift-tx-hash"
            className="break-all rounded-md border border-glass p-3 font-mono text-mono-sm text-mint"
            style={{ background: 'rgba(2, 245, 161, 0.06)' }}
          >
            {receipt.transaction_hash}
          </p>
        </div>
      </div>
    </Modal>
  );
}

export default SwiftReceipt;
