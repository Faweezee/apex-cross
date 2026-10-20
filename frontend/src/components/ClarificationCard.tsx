'use client';

import { Question, UploadSimple } from '@/components/icons';
import { Button } from './ui/Button';

interface ClarificationCardProps {
  message: string;
  missingFields: string[];
  onAttachInvoice: () => void;
}

/** Human-readable labels for backend `missing_fields` keys. */
const FIELD_LABELS: Record<string, string> = {
  institution_name: 'University / institution name',
  amount_due: 'Tuition amount due',
  currency: 'Payment currency',
  beneficiary_account: 'Beneficiary account',
  swift_code: 'SWIFT / BIC code',
  due_date: 'Payment due date',
  student_id: 'Student ID',
};

/**
 * Interactive clarification card — DESIGN_SYSTEM.md §7 / Flow 3.
 * Rendered when `requires_clarification === true`; the agent cannot compile a DAG yet.
 */
export function ClarificationCard({ message, missingFields, onAttachInvoice }: ClarificationCardProps) {
  return (
    <div
      data-testid="clarification-card"
      className="glass-card card-sheen w-full max-w-chat p-4"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
          style={{ background: 'rgba(217, 119, 6, 0.12)' }}
        >
          <Question size={17} weight="fill" className="text-warning" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-h4 font-semibold uppercase tracking-[0.05em] text-warning">
            More details required
          </p>
          <p className="mt-1 text-small text-text-secondary">{message}</p>

          {missingFields.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2" data-testid="clarification-missing-fields">
              {missingFields.map((field) => (
                <li key={field}>
                  <span className="glass-inline px-2 py-1 text-caption uppercase tracking-[0.05em] text-text-secondary">
                    {FIELD_LABELS[field] ?? field}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4">
            <Button
              variant="ghost"
              icon={<UploadSimple size={15} weight="bold" aria-hidden="true" />}
              onClick={onAttachInvoice}
              data-testid="clarification-upload"
            >
              Upload tuition invoice instead
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClarificationCard;
