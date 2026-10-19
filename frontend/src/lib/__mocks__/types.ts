/**
 * Mock-only types for backend shapes that are not (yet) exported from src/types/index.ts.
 * Mirrors backend/openapi.json. Do not import these from application code.
 */
import type {
  AuditRecord,
  Currency,
  RemittancePlan,
  RemittanceRoute,
  SecurityTier,
  UniversityInvoice,
} from '@/types';

export interface AgentChatResponse {
  status: string;
  assistant_message: string;
  requires_clarification: boolean;
  missing_fields: string[];
  required_security_tier: SecurityTier | null;
  routes: RemittanceRoute[];
  plan: RemittancePlan | null;
}

export interface FXRatesResponse {
  source_currency: Currency;
  target_currency: Currency;
  target_amount: number;
  mid_market_rate: number;
  security_tier: SecurityTier;
  all_usd_rates: Record<Currency, number>;
  routes: RemittanceRoute[];
}

export interface InvoiceUploadResponse {
  filename: string;
  invoice: UniversityInvoice;
  field_confidences: Record<string, number>;
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

export interface MockErrorResponse {
  status: number;
  body: Record<string, unknown>;
}

export type HealthResponse = Record<string, string>;
