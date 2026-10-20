import type { RemittanceRoute } from '@/types';
import type { FXRatesResponse } from './types';

export const RATE_CNY_HKD = 1.0924;
export const RATE_CNY_USD = 0.1389;
export const RATE_CNY_AUD = 0.2134;
export const RATE_CNY_SGD = 0.1863;

/** Three corridors for CNY 77,812.50 -> HKD 85,000.00. APEC Direct is recommended. */
export function mockCorridorRoutes(): RemittanceRoute[] {
  return [
    {
      rail_name: 'Standard SWIFT Bank Wire',
      exchange_rate: 1.0812,
      source_currency: 'CNY',
      source_amount: 77812.5,
      target_currency: 'HKD',
      target_amount: 84129.38,
      total_fee_usd: 45.0,
      estimated_arrival_hours: 72,
      is_recommended: false,
      savings_vs_standard_usd: 0,
    },
    {
      rail_name: 'APEC Direct Clearing',
      exchange_rate: RATE_CNY_HKD,
      source_currency: 'CNY',
      source_amount: 77812.5,
      target_currency: 'HKD',
      target_amount: 85000.0,
      total_fee_usd: 18.5,
      estimated_arrival_hours: 6,
      is_recommended: true,
      savings_vs_standard_usd: 395.95,
    },
    {
      rail_name: 'Wise Multi-Currency Corridor',
      exchange_rate: 1.0891,
      source_currency: 'CNY',
      source_amount: 77812.5,
      target_currency: 'HKD',
      target_amount: 84745.1,
      total_fee_usd: 28.75,
      estimated_arrival_hours: 24,
      is_recommended: false,
      savings_vs_standard_usd: 112.4,
    },
  ];
}

export function mockFxRatesResponse(overrides: Partial<FXRatesResponse> = {}): FXRatesResponse {
  return {
    source_currency: 'CNY',
    target_currency: 'HKD',
    target_amount: 85000.0,
    mid_market_rate: RATE_CNY_HKD,
    security_tier: 'TIER_3_BIOMETRIC',
    all_usd_rates: {
      USD: 1.0,
      CNY: 7.2,
      HKD: 7.8,
      AUD: 1.54,
      SGD: 1.34,
    },
    routes: mockCorridorRoutes(),
    ...overrides,
  };
}
