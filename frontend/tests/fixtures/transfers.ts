import type { MicroConvertResponse, MockErrorResponse } from './types';

export function mockMicroConvertSuccess(): MicroConvertResponse {
  return {
    conversion_id: 'conv-5b2e8d10',
    status: 'COMPLETED',
    security_tier: 'TIER_2_CONFIRMATION',
    biometric_required: false,
    source_currency: 'CNY',
    target_currency: 'HKD',
    source_amount: 1000.0,
    executed_rate: 1.0924,
    converted_target_amount: 1092.4,
    fee_usd: 1.5,
    slippage_bps: 2,
    source_balance_before: 50000.0,
    source_balance_after: 49000.0,
    target_balance_before: 12000.0,
    target_balance_after: 13092.4,
  };
}

/** HTTP 400: executed rate moved beyond max_slippage_bps. */
export function mockMicroConvertSlippageError(): MockErrorResponse {
  return {
    status: 400,
    body: { detail: 'Slippage exceeded: market moved 75 bps, maximum allowed is 50 bps.' },
  };
}

/** Amount above $500 equivalent needs TIER_3 biometric authorization. */
export function mockMicroConvertTierExceededError(): MockErrorResponse {
  return {
    status: 400,
    body: {
      detail:
        'Amount exceeds the $500 micro-conversion limit. TIER_3_BIOMETRIC authorization is required.',
    },
  };
}
