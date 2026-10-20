import { describe, expect, it } from 'vitest';
import {
  clamp,
  cn,
  formatAmount,
  formatCurrency,
  formatUsd,
  quotaPercentage,
  tierLabel,
  tierShort,
  truncateHash,
} from '@/lib/utils';

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center');
  });

  it('resolves Tailwind conflicts with the last class winning', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-text-secondary', 'text-mint')).toContain('text-mint');
  });

  it('handles undefined, null and false inputs', () => {
    expect(cn('a', undefined, null, false, 'b')).toBe('a b');
    expect(cn()).toBe('');
  });

  it('supports conditional object syntax', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active');
  });
});

describe('formatters', () => {
  it('formatAmount groups thousands with 2 decimals', () => {
    expect(formatAmount(85000)).toBe('85,000.00');
    expect(formatAmount(0.5)).toBe('0.50');
  });

  it('formatCurrency prefixes the ISO code', () => {
    expect(formatCurrency(85000, 'HKD')).toBe('HKD 85,000.00');
  });

  it('formatUsd uses the dollar prefix and USD suffix', () => {
    expect(formatUsd(395.95)).toBe('$395.95 USD');
  });
});

describe('truncateHash()', () => {
  const hash = 'a'.repeat(64);

  it('keeps the first 8 and last 6 characters by default', () => {
    expect(truncateHash(hash)).toBe(`${'a'.repeat(8)}...${'a'.repeat(6)}`);
  });

  it('returns short values unchanged', () => {
    expect(truncateHash('abc')).toBe('abc');
    expect(truncateHash('')).toBe('');
  });
});

describe('clamp() and quotaPercentage()', () => {
  it('clamps to the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('computes used percentage', () => {
    expect(quotaPercentage(8500, 50000)).toBeCloseTo(17, 5);
  });

  it('never exceeds 100 or drops below 0', () => {
    expect(quotaPercentage(60000, 50000)).toBe(100);
    expect(quotaPercentage(-5, 50000)).toBe(0);
  });

  it('returns 0 for a non-positive limit', () => {
    expect(quotaPercentage(100, 0)).toBe(0);
  });
});

describe('tier labels', () => {
  it('maps known tiers', () => {
    expect(tierShort('TIER_1_AUTONOMOUS')).toBe('TIER 1');
    expect(tierShort('TIER_2_CONFIRMATION')).toBe('TIER 2');
    expect(tierShort('TIER_3_BIOMETRIC')).toBe('TIER 3');
    expect(tierLabel('TIER_3_BIOMETRIC')).toBe('Tier 3 - Biometric');
  });

  it('passes unknown tiers through', () => {
    expect(tierShort('OTHER')).toBe('OTHER');
    expect(tierLabel('OTHER')).toBe('OTHER');
  });
});
