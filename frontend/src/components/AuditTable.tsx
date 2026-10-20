'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowsClockwise, Link, MagnifyingGlass, ShieldCheck, ShieldSlash } from '@/components/icons';
import {
  getAuditLogs,
  getAuditVerify,
  ApiError,
  type AuditChainVerification,
  type ChainedAuditRecord,
} from '@/lib/api';
import { cn, formatTimestamp, tierShort, truncateHash } from '@/lib/utils';
import { Badge, type BadgeTone } from './ui/Badge';
import { Button } from './ui/Button';
import { TableSkeleton } from './ui/Skeleton';

const ACTION_FILTERS = [
  'ALL',
  'TIER2_MICRO_CONVERT',
  'TIER3_WIRE_SETTLED',
  'SECURITY_EXCEPTION_BLOCKED',
] as const;

type ActionFilter = (typeof ACTION_FILTERS)[number];

function tierTone(tier: string): BadgeTone {
  if (tier === 'TIER_3_BIOMETRIC') return 'danger';
  if (tier === 'TIER_2_CONFIRMATION') return 'cobalt';
  return 'neutral';
}

function statusTone(status: string): BadgeTone {
  if (status === 'BLOCKED' || status === 'FAILED') return 'danger';
  if (status === 'SETTLED' || status === 'COMPLETED') return 'success';
  return 'neutral';
}


/**
 * Cryptographic SHA-256 audit ledger — DESIGN_SYSTEM.md §7 / Flow 8.
 * Live append-only ledger inspector with chain verification banner, hash linkage pills,
 * action filtering, and a live "Verify chain" recompute via `GET /api/audit/verify`.
 */
export function AuditTable() {
  const [records, setRecords] = useState<ChainedAuditRecord[]>([]);
  const [verification, setVerification] = useState<AuditChainVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ActionFilter>('ALL');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAuditLogs(200);
      setRecords(result.records);
      setVerification(result.verification);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.reason : 'Unable to load the audit ledger.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function verifyChain() {
    setVerifying(true);
    try {
      const result = await getAuditVerify();
      setVerification(result);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.reason : 'Chain verification failed.');
    } finally {
      setVerifying(false);
    }
  }

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return records.filter((record) => {
      const matchesAction = filter === 'ALL' || record.action_type === filter;
      const matchesQuery =
        !term ||
        record.record_id.toLowerCase().includes(term) ||
        record.plan_id.toLowerCase().includes(term);
      return matchesAction && matchesQuery;
    });
  }, [records, filter, query]);

  const isValid = verification?.is_valid ?? false;

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-6 pb-24">
      <section
        data-testid="chain-verification"
        data-valid={isValid}
        className="glass-card card-sheen flex flex-wrap items-center justify-between gap-4 p-6"
        style={
          isValid
            ? undefined
            : {
                borderColor: 'rgba(220,38,38,0.35)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px rgba(220,38,38,0.15), 0 0 60px rgba(220,38,38,0.08)',
              }
        }
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
            style={{ background: isValid ? 'rgba(5,150,105,0.12)' : 'rgba(220,38,38,0.12)' }}
          >
            {isValid ? (
              <ShieldCheck size={18} weight="fill" className="text-success" />
            ) : (
              <ShieldSlash size={18} weight="fill" className="text-danger" />
            )}
          </span>
          <div>
            <h2 className="text-h3 font-semibold text-text-primary" data-testid="chain-status">
              {isValid ? 'Chain verified' : 'Chain integrity failure'}
            </h2>
            <p className="mt-1 text-small text-text-secondary">
              {verification?.reason ?? 'Recomputing SHA-256 links across the append-only ledger.'}
            </p>
          </div>
        </div>

        <dl className="flex flex-wrap items-center gap-6">
          <div>
            <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">Records</dt>
            <dd className="font-mono text-mono text-text-primary" data-testid="chain-total">
              {verification?.total_records ?? records.length}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">
              Latest hash
            </dt>
            <dd
              className="font-mono text-mono-sm text-mint"
              data-testid="chain-latest-hash"
              title={verification?.latest_hash}
            >
              {verification ? truncateHash(verification.latest_hash, 10, 8) : '--'}
            </dd>
          </div>
          <Button
            variant="ghost"
            onClick={verifyChain}
            loading={verifying}
            icon={<ArrowsClockwise size={15} weight="bold" aria-hidden="true" />}
            data-testid="chain-verify-button"
          >
            Verify chain
          </Button>
        </dl>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <label className="glass-inline flex items-center gap-2 px-3 py-2">
          <MagnifyingGlass size={14} weight="regular" className="text-text-muted" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search record or plan ID"
            aria-label="Search audit records"
            data-testid="audit-search"
            className="w-56 bg-transparent text-small text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </label>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as ActionFilter)}
          aria-label="Filter by action type"
          data-testid="audit-filter"
          className="field w-auto font-mono"
        >
          {ACTION_FILTERS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <p
          data-testid="audit-error"
          className="rounded-md p-4 text-small text-danger"
          style={{ background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.28)' }}
        >
          {error}
        </p>
      ) : visible.length === 0 ? (
        <p className="glass-card p-6 text-small text-text-secondary" data-testid="audit-empty">
          No audit records match the current filter.
        </p>
      ) : (
        <ul className="stagger flex flex-col gap-2" data-testid="audit-records">
          {visible.map((record) => {
            const isOpen = expanded === record.record_id;
            return (
              <li
                key={record.record_id}
                data-testid={`audit-record-${record.record_id}`}
                className="glass-card card-sheen p-4"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : record.record_id)}
                  aria-expanded={isOpen}
                  data-testid={`audit-record-toggle-${record.record_id}`}
                  className="flex w-full flex-wrap items-center gap-3 text-left"
                >
                  <span className="font-mono text-mono text-text-primary">{record.record_id}</span>
                  <Badge tone={tierTone(record.security_tier)}>
                    {tierShort(record.security_tier)}
                  </Badge>
                  <span className="text-small text-text-secondary">{record.action_type}</span>
                  <Badge tone={statusTone(record.status)}>{record.status}</Badge>
                  <Badge tone={record.signature_verified ? 'success' : 'danger'}>
                    {record.signature_verified ? 'Verified' : 'Unverified'}
                  </Badge>
                  <span className="ml-auto font-mono text-mono-sm text-text-muted">
                    {formatTimestamp(record.timestamp)}
                  </span>
                </button>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="glass-inline flex items-center gap-1 px-2 py-1 font-mono text-mono-sm text-text-muted">
                    <Link size={12} weight="regular" aria-hidden="true" />
                    {truncateHash(record.previous_hash, 8, 6)}
                  </span>
                  <span aria-hidden="true" className="text-text-muted">
                    &rarr;
                  </span>
                  <span className="glass-inline flex items-center gap-1 px-2 py-1 font-mono text-mono-sm text-mint">
                    {truncateHash(record.record_hash, 8, 6)}
                  </span>
                </div>

                {isOpen ? (
                  <dl
                    data-testid={`audit-record-details-${record.record_id}`}
                    className="mt-3 space-y-2 rounded-sm border border-glass p-3"
                    style={{ background: 'rgba(7, 25, 30, 0.6)' }}
                  >
                    <div>
                      <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">
                        Plan ID
                      </dt>
                      <dd className="font-mono text-mono-sm text-text-primary">{record.plan_id}</dd>
                    </div>
                    <div>
                      <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">
                        User
                      </dt>
                      <dd className="font-mono text-mono-sm text-text-primary">{record.user_id}</dd>
                    </div>
                    <div>
                      <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">
                        Payload hash
                      </dt>
                      <dd className="break-all font-mono text-mono-sm text-text-secondary">
                        {record.payload_hash}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-caption uppercase tracking-[0.05em] text-text-secondary">
                        Record hash
                      </dt>
                      <dd className="break-all font-mono text-mono-sm text-mint">
                        {record.record_hash}
                      </dd>
                    </div>
                  </dl>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default AuditTable;

