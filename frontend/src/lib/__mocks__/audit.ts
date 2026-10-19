import { MOCK_PLAN_ID, MOCK_USER_ID } from './agent';
import type { AuditChainVerification, AuditLogsResponse, ChainedAuditRecord } from './types';

const GENESIS_HASH = '0'.repeat(64);

/** Deterministic 64-char lowercase hex string derived from a seed index. */
function hex64(seed: number): string {
  let out = '';
  let n = (seed + 1) * 2654435761;
  while (out.length < 64) {
    n = (n * 1103515245 + 12345) % 2147483648;
    out += n.toString(16).padStart(8, '0');
  }
  return out.slice(0, 64);
}

const ACTIONS: Array<Pick<ChainedAuditRecord, 'action_type' | 'security_tier' | 'status'>> = [
  { action_type: 'INVOICE_PARSED', security_tier: 'TIER_1_AUTONOMOUS', status: 'SUCCESS' },
  { action_type: 'QUOTA_CHECK', security_tier: 'TIER_1_AUTONOMOUS', status: 'ALLOW' },
  { action_type: 'CORRIDOR_SELECTED', security_tier: 'TIER_1_AUTONOMOUS', status: 'SUCCESS' },
  { action_type: 'MICRO_CONVERT', security_tier: 'TIER_2_CONFIRMATION', status: 'COMPLETED' },
  { action_type: 'WIRE_EXECUTED', security_tier: 'TIER_3_BIOMETRIC', status: 'SETTLED' },
];

/** 5 hash-chained records. Each previous_hash equals the prior record_hash. */
export function mockAuditRecords(): ChainedAuditRecord[] {
  const records: ChainedAuditRecord[] = [];
  let prev = GENESIS_HASH;
  ACTIONS.forEach((a, i) => {
    const record_hash = hex64(i + 100);
    records.push({
      record_id: `rec-00${i + 1}`,
      timestamp: `2026-10-19T09:0${i}:00Z`,
      user_id: MOCK_USER_ID,
      action_type: a.action_type,
      security_tier: a.security_tier,
      plan_id: MOCK_PLAN_ID,
      payload_hash: hex64(i),
      previous_hash: prev,
      signature_verified: a.security_tier === 'TIER_3_BIOMETRIC',
      status: a.status,
      record_hash,
    });
    prev = record_hash;
  });
  return records;
}

export function mockChainVerification(): AuditChainVerification {
  const records = mockAuditRecords();
  return {
    is_valid: true,
    total_records: 5,
    latest_hash: records[records.length - 1].record_hash,
    tampered_record_id: null,
    reason: 'Hash chain verified: all records link correctly.',
  };
}

export function mockAuditLogsResponse(): AuditLogsResponse {
  return {
    records: mockAuditRecords(),
    verification: mockChainVerification(),
  };
}
