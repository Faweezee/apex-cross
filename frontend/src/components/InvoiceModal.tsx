'use client';

import { useEffect, useState } from 'react';
import { FileSearch } from 'lucide-react';
import type { InvoiceUploadResponse } from '@/lib/api';
import type { Currency, UniversityInvoice } from '@/types';
import { Badge, type BadgeTone } from './ui/Badge';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

const CURRENCIES: Currency[] = ['USD', 'CNY', 'HKD', 'AUD', 'SGD'];

interface FieldSpec {
  key: keyof UniversityInvoice;
  label: string;
  type: 'text' | 'number' | 'currency' | 'date';
}

const FIELDS: FieldSpec[] = [
  { key: 'institution_name', label: 'Institution', type: 'text' },
  { key: 'beneficiary_account', label: 'Beneficiary account', type: 'text' },
  { key: 'swift_code', label: 'SWIFT / BIC', type: 'text' },
  { key: 'amount_due', label: 'Amount due', type: 'number' },
  { key: 'currency', label: 'Currency', type: 'currency' },
  { key: 'due_date', label: 'Due date', type: 'date' },
  { key: 'student_id', label: 'Student ID', type: 'text' },
];

function confidenceTone(score: number | undefined): BadgeTone {
  if (score === undefined) return 'neutral';
  if (score >= 0.95) return 'success';
  if (score >= 0.85) return 'warning';
  return 'danger';
}

function confidenceLabel(score: number | undefined): string {
  if (score === undefined) return 'n/a';
  return `${Math.round(score * 100)}%`;
}

interface InvoiceModalProps {
  open: boolean;
  result: InvoiceUploadResponse | null;
  onClose: () => void;
  onConfirm: (invoice: UniversityInvoice) => void;
  submitting?: boolean;
}

/**
 * Invoice verification modal — DESIGN_SYSTEM.md §7 / Flow 2.
 * Native `<dialog>` showing extracted fields with per-field OCR confidence badges.
 * All fields are editable so the student can correct OCR mistakes before compiling the plan.
 */
export function InvoiceModal({ open, result, onClose, onConfirm, submitting = false }: InvoiceModalProps) {
  const [draft, setDraft] = useState<UniversityInvoice | null>(null);

  useEffect(() => {
    if (result?.invoice) {
      setDraft({ ...result.invoice });
    }
  }, [result]);

  if (!open || !draft) return null;

  const confidences = result?.field_confidences ?? {};
  const overall = draft.confidence_score;

  function update<K extends keyof UniversityInvoice>(key: K, value: UniversityInvoice[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      testId="invoice-modal"
      title="Verify extracted invoice"
      subtitle={result?.filename ? `Parsed from ${result.filename}` : undefined}
      icon={<FileSearch size={16} strokeWidth={2} className="text-mint" />}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-caption uppercase tracking-[0.05em] text-text-muted">Overall</span>
            <Badge tone={confidenceTone(overall)} animate>
              {confidenceLabel(overall)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} data-testid="invoice-modal-cancel">
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(draft)}
              loading={submitting}
              data-testid="invoice-modal-confirm"
            >
              Compile remittance plan
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4" data-testid="invoice-modal-fields">
        {FIELDS.map((field) => {
          const raw = draft[field.key];
          const confidence = confidences[field.key as string];
          return (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor={`invoice-field-${field.key}`}
                  className="text-caption font-medium uppercase tracking-[0.05em] text-text-secondary"
                >
                  {field.label}
                </label>
                <Badge tone={confidenceTone(confidence)} data-testid={`confidence-${field.key}`}>
                  {confidenceLabel(confidence)}
                </Badge>
              </div>

              {field.type === 'currency' ? (
                <select
                  id={`invoice-field-${field.key}`}
                  className="field font-mono"
                  value={String(raw ?? 'USD')}
                  onChange={(event) => update('currency', event.target.value as Currency)}
                  data-testid={`invoice-input-${field.key}`}
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`invoice-field-${field.key}`}
                  className="field font-mono"
                  type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  step={field.type === 'number' ? '0.01' : undefined}
                  value={raw === undefined || raw === null ? '' : String(raw)}
                  onChange={(event) =>
                    update(
                      field.key,
                      (field.type === 'number'
                        ? Number(event.target.value)
                        : event.target.value) as UniversityInvoice[typeof field.key],
                    )
                  }
                  data-testid={`invoice-input-${field.key}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

export default InvoiceModal;
