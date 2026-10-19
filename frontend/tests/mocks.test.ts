import { describe, expect, it } from 'vitest';
import * as mocks from '@/lib/__mocks__';
import type { AgentChatResponse } from '@/lib/__mocks__';

const CURRENCIES = ['USD', 'CNY', 'HKD', 'AUD', 'SGD'];
const TIERS = ['TIER_1_AUTONOMOUS', 'TIER_2_CONFIRMATION', 'TIER_3_BIOMETRIC'];
const TASK_STATUSES = ['PENDING', 'RUNNING', 'COMPLETED', 'BLOCKED', 'FAILED'];
const HEX64 = /^[0-9a-f]{64}$/;

function expectValidRoute(route: Record<string, unknown>) {
  for (const key of [
    'rail_name',
    'exchange_rate',
    'source_currency',
    'source_amount',
    'target_currency',
    'target_amount',
    'total_fee_usd',
    'estimated_arrival_hours',
    'is_recommended',
    'savings_vs_standard_usd',
  ]) {
    expect(route, `route.${key}`).toHaveProperty(key);
  }
  expect(CURRENCIES).toContain(route.source_currency);
  expect(CURRENCIES).toContain(route.target_currency);
}

function expectValidChat(response: AgentChatResponse) {
  expect(typeof response.status).toBe('string');
  expect(typeof response.assistant_message).toBe('string');
  expect(typeof response.requires_clarification).toBe('boolean');
  expect(Array.isArray(response.missing_fields)).toBe(true);
  expect(Array.isArray(response.routes)).toBe(true);
  if (response.required_security_tier !== null) {
    expect(TIERS).toContain(response.required_security_tier);
  }
  response.routes.forEach((r) => expectValidRoute(r as unknown as Record<string, unknown>));
  if (response.plan) {
    expect(response.plan.dag_tasks).toHaveLength(4);
    expect(TIERS).toContain(response.plan.required_security_tier);
    response.plan.dag_tasks.forEach((task) => {
      expect(TASK_STATUSES).toContain(task.status);
      expect(TIERS).toContain(task.required_tier);
      expect(task.task_id).toBeTruthy();
    });
    expectValidRoute(response.plan.selected_route as unknown as Record<string, unknown>);
    expect(typeof response.plan.remaining_annual_quota_usd).toBe('number');
  }
}

describe('agent mocks', () => {
  it('mockPlanReadyResponse has 3 corridors, TIER_3 and an ALLOW quota step', () => {
    const r = mocks.mockPlanReadyResponse();
    expectValidChat(r);
    expect(r.status).toBe('PLAN_READY');
    expect(r.routes).toHaveLength(3);
    expect(r.required_security_tier).toBe('TIER_3_BIOMETRIC');
    expect(r.routes.filter((x) => x.is_recommended)).toHaveLength(1);
    expect(r.plan?.dag_tasks[1].output).toMatchObject({ decision: 'ALLOW' });
  });

  it('mockClarificationResponse requires clarification with missing fields', () => {
    const r = mocks.mockClarificationResponse();
    expectValidChat(r);
    expect(r.requires_clarification).toBe(true);
    expect(r.missing_fields.length).toBeGreaterThan(0);
    expect(r.plan).toBeNull();
  });

  it('mockQuotaExceededResponse blocks step 2', () => {
    const r = mocks.mockQuotaExceededResponse();
    expectValidChat(r);
    expect(r.status).toBe('QUOTA_EXCEEDED');
    expect(r.plan?.dag_tasks[1].status).toBe('BLOCKED');
  });

  it('mockQuotaWarningResponse has under 5000 USD remaining', () => {
    const r = mocks.mockQuotaWarningResponse();
    expectValidChat(r);
    expect(r.plan?.remaining_annual_quota_usd).toBeLessThan(5000);
  });

  it('mockTier2PlanResponse requires TIER_2', () => {
    const r = mocks.mockTier2PlanResponse();
    expectValidChat(r);
    expect(r.plan?.required_security_tier).toBe('TIER_2_CONFIRMATION');
  });

  it('mockFirewallBlockedResponse matches the SecurityException payload', () => {
    const r = mocks.mockFirewallBlockedResponse();
    expect(r.status).toBe(403);
    expect(r.body).toMatchObject({ status: 'BLOCKED', error: 'SecurityException' });
    expect(typeof r.body.reason).toBe('string');
  });
});

describe('fx mocks', () => {
  it('returns all 5 currencies and 3 corridors', () => {
    const r = mocks.mockFxRatesResponse();
    expect(Object.keys(r.all_usd_rates).sort()).toEqual([...CURRENCIES].sort());
    expect(r.routes).toHaveLength(3);
    r.routes.forEach((x) => expectValidRoute(x as unknown as Record<string, unknown>));
    expect(TIERS).toContain(r.security_tier);
    expect(r.mid_market_rate).toBeCloseTo(1.0924, 4);
  });

  it('exports the brief reference rates', () => {
    expect(mocks.RATE_CNY_HKD).toBe(1.0924);
    expect(mocks.RATE_CNY_USD).toBe(0.1389);
    expect(mocks.RATE_CNY_AUD).toBe(0.2134);
    expect(mocks.RATE_CNY_SGD).toBe(0.1863);
  });
});

describe('invoice mocks', () => {
  it.each([
    ['hkust', mocks.mockInvoiceUploadResponse],
    ['melbourne', mocks.mockMelbourneInvoice],
    ['nus', mocks.mockNusInvoice],
  ])('%s invoice is complete with per-field confidences', (_name, factory) => {
    const r = factory();
    expect(r.filename).toBeTruthy();
    expect(CURRENCIES).toContain(r.invoice.currency);
    expect(r.invoice.swift_code.length).toBeGreaterThanOrEqual(8);
    expect(r.invoice.confidence_score).toBeGreaterThan(0);
    expect(r.invoice.confidence_score).toBeLessThanOrEqual(1);
    for (const key of ['institution_name', 'amount_due', 'swift_code', 'currency']) {
      expect(r.field_confidences[key]).toBeGreaterThan(0);
    }
  });
});

describe('auth mocks', () => {
  it('reauth options carry a challenge and allowCredentials', () => {
    const r = mocks.mockReauthOptions();
    expect(typeof r.challenge).toBe('string');
    expect(Array.isArray(r.allowCredentials)).toBe(true);
  });

  it('verify success includes a settled receipt with a 64-char hash', () => {
    const r = mocks.mockVerifySuccessResponse();
    expect(r.verified).toBe(true);
    expect(TIERS).toContain(r.security_tier);
    expect(CURRENCIES).toContain(r.receipt.currency);
    expect(r.receipt.status).toBe('SETTLED');
    expect(r.receipt.transaction_hash).toMatch(HEX64);
    expect(r.receipt.mt103_message).toContain(':20:');
  });

  it('verify failure is HTTP 403', () => {
    expect(mocks.mockVerifyFailureResponse().status).toBe(403);
  });
});

describe('transfer mocks', () => {
  it('success has balances that reconcile', () => {
    const r = mocks.mockMicroConvertSuccess();
    expect(TIERS).toContain(r.security_tier);
    expect(CURRENCIES).toContain(r.source_currency);
    expect(CURRENCIES).toContain(r.target_currency);
    expect(r.source_balance_before - r.source_balance_after).toBeCloseTo(r.source_amount, 2);
    expect(r.target_balance_after - r.target_balance_before).toBeCloseTo(
      r.converted_target_amount,
      2,
    );
  });

  it('error mocks are HTTP 400 with a detail', () => {
    for (const r of [mocks.mockMicroConvertSlippageError(), mocks.mockMicroConvertTierExceededError()]) {
      expect(r.status).toBe(400);
      expect(typeof r.body.detail).toBe('string');
    }
  });
});

describe('audit mocks', () => {
  it('has 5 chained records and a valid verification', () => {
    const r = mocks.mockAuditLogsResponse();
    expect(r.records).toHaveLength(5);
    expect(r.verification.is_valid).toBe(true);
    expect(r.verification.total_records).toBe(5);
    expect(r.verification.tampered_record_id).toBeNull();
    expect(r.verification.latest_hash).toBe(r.records[4].record_hash);
  });

  it('links each record to the previous record hash', () => {
    const { records } = mocks.mockAuditLogsResponse();
    for (let i = 1; i < records.length; i++) {
      expect(records[i].previous_hash).toBe(records[i - 1].record_hash);
    }
    records.forEach((rec) => {
      expect(rec.record_hash).toMatch(HEX64);
      expect(rec.payload_hash).toMatch(HEX64);
      expect(TIERS).toContain(rec.security_tier);
    });
  });

  it('record ids are unique', () => {
    const ids = mocks.mockAuditRecords().map((r) => r.record_id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('health mocks', () => {
  it('healthy response reports healthy', () => {
    expect(mocks.mockHealthyResponse().status).toBe('healthy');
  });

  it('unhealthy response is an HTTP 503', () => {
    expect(mocks.mockUnhealthyResponse().status).toBe(503);
  });
});
