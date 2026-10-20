/**
 * Typed API client for the ApexCross FastAPI backend.
 *
 * Requests are proxied through Next.js rewrites (`next.config.ts`) from `/api/*`
 * to `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`).
 *
 * Every method surfaces backend failures as a structured `ApiError` so components can
 * render the fail-closed security banner (HTTP 403 SecurityException) distinctly from
 * validation errors and network failures.
 */
import type {
  AuditRecord,
  Currency,
  DagTask,
  RemittancePlan,
  RemittanceRoute,
  SecurityTier,
  UniversityInvoice,
} from '@/types';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export type ApiErrorKind = 'security' | 'validation' | 'not_found' | 'network' | 'server';

export interface SecurityExceptionPayload {
  status: 'BLOCKED';
  error: 'SecurityException';
  reason: string;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly reason: string;
  readonly payload: unknown;

  constructor(kind: ApiErrorKind, status: number, message: string, payload: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.reason = message;
    this.payload = payload;
  }

  /** True when the pre-agent firewall blocked the request (HTTP 403 SecurityException). */
  get isSecurityBlock(): boolean {
    return this.kind === 'security';
  }
}

function isSecurityPayload(value: unknown): value is SecurityExceptionPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { error?: unknown }).error === 'SecurityException'
  );
}

function extractDetail(payload: unknown, fallback: string): string {
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (typeof payload === 'object' && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (typeof record.reason === 'string' && record.reason.trim()) return record.reason;
    const detail = record.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: unknown } | undefined;
      if (first && typeof first.msg === 'string') return first.msg;
    }
  }
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    });
  } catch (cause) {
    throw new ApiError(
      'network',
      0,
      'Unable to reach the ApexCross backend. Check that the API is running on port 8000.',
      cause,
    );
  }

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }

  if (!response.ok) {
    if (response.status === 403 && isSecurityPayload(payload)) {
      throw new ApiError('security', 403, payload.reason, payload);
    }
    const kind: ApiErrorKind =
      response.status === 422
        ? 'validation'
        : response.status === 404
          ? 'not_found'
          : response.status >= 500
            ? 'server'
            : 'validation';
    throw new ApiError(
      kind,
      response.status,
      extractDetail(payload, `Request failed with status ${response.status}.`),
      payload,
    );
  }

  return payload as T;
}

/* ------------------------------------------------------------------ *
 * Health
 * ------------------------------------------------------------------ */

export interface HealthResponse {
  status: string;
  service: string;
}

export function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return request<HealthResponse>('/api/health', { signal });
}

/* ------------------------------------------------------------------ *
 * Agent — planning & clarification
 * ------------------------------------------------------------------ */

export interface AgentChatRequest {
  user_id?: string;
  message: string;
  source_currency?: Currency;
  invoice?: UniversityInvoice | null;
}

export interface AgentChatResponse {
  status: string;
  assistant_message: string;
  requires_clarification: boolean;
  missing_fields: string[];
  required_security_tier: SecurityTier | null;
  routes: RemittanceRoute[];
  plan: RemittancePlan | null;
}

export function postAgentChat(
  payload: AgentChatRequest,
  signal?: AbortSignal,
): Promise<AgentChatResponse> {
  return request<AgentChatResponse>('/api/agent/chat', {
    method: 'POST',
    body: JSON.stringify({
      user_id: payload.user_id ?? 'student-001',
      message: payload.message,
      source_currency: payload.source_currency ?? 'CNY',
      invoice: payload.invoice ?? null,
    }),
    signal,
  });
}

/* ------------------------------------------------------------------ *
 * Invoice ingestion
 * ------------------------------------------------------------------ */

export interface InvoiceUploadResponse {
  filename: string;
  invoice: UniversityInvoice;
  field_confidences: Record<string, number>;
}

export function uploadInvoice(file: File, signal?: AbortSignal): Promise<InvoiceUploadResponse> {
  const form = new FormData();
  form.append('file', file);
  return request<InvoiceUploadResponse>('/api/invoice/upload', {
    method: 'POST',
    body: form,
    signal,
  });
}

/* ------------------------------------------------------------------ *
 * FX rates & corridor comparison
 * ------------------------------------------------------------------ */

export interface FxRatesResponse {
  source_currency: Currency;
  target_currency: Currency;
  target_amount: number;
  mid_market_rate: number;
  security_tier: SecurityTier;
  all_usd_rates: Record<string, number>;
  routes: RemittanceRoute[];
}

export interface FxRatesQuery {
  source_currency?: Currency;
  target_currency?: Currency;
  target_amount?: number;
  use_live?: boolean;
}

export function getFxRates(query: FxRatesQuery = {}, signal?: AbortSignal): Promise<FxRatesResponse> {
  const params = new URLSearchParams({
    source_currency: query.source_currency ?? 'CNY',
    target_currency: query.target_currency ?? 'HKD',
    target_amount: String(query.target_amount ?? 85000),
    use_live: String(query.use_live ?? false),
  });
  return request<FxRatesResponse>(`/api/fx/rates?${params.toString()}`, { signal });
}

/* ------------------------------------------------------------------ *
 * Tier 2 — micro-conversion
 * ------------------------------------------------------------------ */

export interface MicroConvertRequest {
  user_id?: string;
  source_currency: Currency;
  target_currency: Currency;
  source_amount: number;
  quoted_rate: number;
  max_slippage_bps?: number;
  user_confirmed: boolean;
}

export interface MicroConvertResponse {
  conversion_id: string;
  status: string;
  security_tier: SecurityTier;
  biometric_required: boolean;
  source_currency: Currency;
  target_currency: Currency;
  source_amount: number;
  executed_rate: number;
  converted_target_amount: number;
  fee_usd: number;
  slippage_bps: number;
  source_balance_before: number;
  source_balance_after: number;
  target_balance_before: number;
  target_balance_after: number;
}

export function postMicroConvert(
  payload: MicroConvertRequest,
  signal?: AbortSignal,
): Promise<MicroConvertResponse> {
  return request<MicroConvertResponse>('/api/transfers/micro-convert', {
    method: 'POST',
    body: JSON.stringify({
      user_id: payload.user_id ?? 'student-001',
      source_currency: payload.source_currency,
      target_currency: payload.target_currency,
      source_amount: payload.source_amount,
      quoted_rate: payload.quoted_rate,
      max_slippage_bps: payload.max_slippage_bps ?? 50,
      user_confirmed: payload.user_confirmed,
    }),
    signal,
  });
}

/* ------------------------------------------------------------------ *
 * Tier 3 — WebAuthn step-up & SWIFT clearing
 * ------------------------------------------------------------------ */

export interface WebAuthnVerifyRequest {
  userId?: string;
  assertion: Record<string, unknown>;
  plan_id?: string;
  beneficiary_name?: string;
  beneficiary_account?: string;
  swift_code?: string;
  amount?: number;
  currency?: Currency;
  student_id?: string;
}

export interface SwiftWireReceipt {
  reference_id: string;
  uetr: string;
  value_date: string;
  beneficiary_name: string;
  beneficiary_account: string;
  swift_code: string;
  amount: number;
  currency: Currency;
  student_id: string;
  mt103_message: string;
  transaction_hash: string;
  status: string;
}

export interface WebAuthnVerifyResponse {
  verified: boolean;
  security_tier: SecurityTier;
  user_id: string;
  plan_id: string;
  receipt: SwiftWireReceipt;
}

export function postReauthOptions(
  userId = 'student-001',
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/auth/reauth/options?userId=${encodeURIComponent(userId)}`,
    { method: 'POST', signal },
  );
}

export function postReauthVerify(
  payload: WebAuthnVerifyRequest,
  signal?: AbortSignal,
): Promise<WebAuthnVerifyResponse> {
  return request<WebAuthnVerifyResponse>('/api/auth/reauth/verify', {
    method: 'POST',
    body: JSON.stringify({
      userId: payload.userId ?? 'student-001',
      assertion: payload.assertion,
      plan_id: payload.plan_id ?? 'plan-default',
      beneficiary_name: payload.beneficiary_name ?? 'HKUST',
      beneficiary_account: payload.beneficiary_account ?? '004-123-456789-001',
      swift_code: payload.swift_code ?? 'HSBCHKHHHKH',
      amount: payload.amount ?? 85000,
      currency: payload.currency ?? 'HKD',
      student_id: payload.student_id ?? '20991234',
    }),
    signal,
  });
}


/* ------------------------------------------------------------------ *
 * Cryptographic audit ledger
 * ------------------------------------------------------------------ */

export interface ChainedAuditRecord extends AuditRecord {
  record_hash: string;
}

export interface AuditChainVerification {
  is_valid: boolean;
  total_records: number;
  latest_hash: string;
  tampered_record_id: string | null;
  reason: string;
}

export interface AuditLogsResponse {
  records: ChainedAuditRecord[];
  verification: AuditChainVerification;
}

export function getAuditLogs(limit = 100, signal?: AbortSignal): Promise<AuditLogsResponse> {
  return request<AuditLogsResponse>(`/api/audit/logs?limit=${limit}`, { signal });
}

export function getAuditVerify(signal?: AbortSignal): Promise<AuditChainVerification> {
  return request<AuditChainVerification>('/api/audit/verify', { signal });
}

/* ------------------------------------------------------------------ *
 * Security gateway
 * ------------------------------------------------------------------ */

export interface PromptInspectResponse {
  status: string;
  is_safe: boolean;
  reason: string;
}

export function postSecurityInspect(
  message: string,
  signal?: AbortSignal,
): Promise<PromptInspectResponse> {
  return request<PromptInspectResponse>('/api/security/inspect', {
    method: 'POST',
    body: JSON.stringify({ message }),
    signal,
  });
}

/* ------------------------------------------------------------------ *
 * Namespace export
 * ------------------------------------------------------------------ */

export const api = {
  getHealth,
  postAgentChat,
  uploadInvoice,
  getFxRates,
  postMicroConvert,
  postReauthOptions,
  postReauthVerify,
  getAuditLogs,
  getAuditVerify,
  postSecurityInspect,
};

export type {
  AuditRecord,
  Currency,
  DagTask,
  RemittancePlan,
  RemittanceRoute,
  SecurityTier,
  UniversityInvoice,
};


