'use client';

import { useCallback, useRef, useState } from 'react';
import { FileMagnifyingGlass, UploadSimple, X } from '@/components/icons';
import { uploadInvoice, ApiError, type InvoiceUploadResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from './ui/Button';
import { Skeleton } from './ui/Skeleton';

const ACCEPTED = '.pdf,.png,.jpg,.jpeg,.webp,.txt';

interface InvoiceDropzoneProps {
  onExtracted: (result: InvoiceUploadResponse) => void;
  onError: (message: string) => void;
  onCancel?: () => void;
}

/**
 * Multimodal invoice dropzone — DESIGN_SYSTEM.md §5 `.dropzone`.
 * Solid glass border with inner mint glow (never dashed), mint activation on drag-over.
 * Posts to `POST /api/invoice/upload` and hands the parsed invoice to the verification modal.
 */
export function InvoiceDropzone({ onExtracted, onError, onCancel }: InvoiceDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setParsing(true);
      try {
        const result = await uploadInvoice(file);
        onExtracted(result);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.reason
            : 'Invoice parsing failed. Please upload a valid tuition invoice.';
        onError(message);
      } finally {
        setParsing(false);
      }
    },
    [onExtracted, onError],
  );

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function onSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
  }

  if (parsing) {
    return (
      <div className="glass-card card-sheen w-full max-w-chat p-6" data-testid="invoice-parsing">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ background: 'rgba(2, 245, 161, 0.12)' }}
          >
            <FileMagnifyingGlass size={17} weight="regular" className="text-mint" />
          </span>
          <div className="min-w-0">
            <p className="text-small font-medium text-text-primary">Extracting invoice fields</p>
            <p className="truncate font-mono text-mono-sm text-text-secondary">{fileName}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton width="70%" height="12px" />
          <Skeleton width="88%" height="12px" />
          <Skeleton width="55%" height="12px" />
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="invoice-dropzone"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn('dropzone card-sheen w-full max-w-chat', dragging && 'dropzone-active')}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={onSelect}
        className="hidden"
        data-testid="invoice-file-input"
      />

      <div className="flex flex-col items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-lg"
          style={{
            background: 'rgba(2, 245, 161, 0.10)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <UploadSimple size={22} weight="light" className="text-mint" />
        </span>

        <div>
          <p className="text-h4 font-semibold text-text-primary">Drop your tuition invoice</p>
          <p className="mt-1 text-small text-text-secondary">
            PDF, PNG, JPG or WEBP. Fields are extracted with per-field confidence scores.
          </p>
        </div>

        <div className="mt-1 flex items-center gap-2">
          <Button
            icon={<FileMagnifyingGlass size={15} weight="bold" aria-hidden="true" />}
            onClick={() => inputRef.current?.click()}
            data-testid="invoice-browse"
          >
            Browse files
          </Button>
          {onCancel ? (
            <Button
              variant="ghost"
              icon={<X size={15} weight="bold" aria-hidden="true" />}
              onClick={onCancel}
              data-testid="invoice-cancel"
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default InvoiceDropzone;
