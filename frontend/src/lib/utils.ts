import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional class names and resolve Tailwind utility conflicts.
 * `cn('px-2', 'px-4')` -> `'px-4'`
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a numeric amount as a currency string with 2 decimals.
 * Uses tabular-friendly grouping: 85000 -> "85,000.00"
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a value as a currency string with its ISO code.
 * 85000, 'HKD' -> "HKD 85,000.00"
 */
export function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${formatAmount(amount)}`;
}

/**
 * Format a USD figure with the $ prefix.
 * 395.95 -> "$395.95 USD"
 */
export function formatUsd(amount: number): string {
  return `$${formatAmount(amount)} USD`;
}

/**
 * Truncate a hash for display: first 8 and last 6 characters with an ellipsis.
 * Used for SHA-256 hash chips.
 */
export function truncateHash(hash: string, head = 8, tail = 6): string {
  if (!hash || hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}...${hash.slice(-tail)}`;
}

/**
 * Format an ISO timestamp for the audit ledger.
 */
export function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

/**
 * Clamp a number between a minimum and maximum.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Compute the percentage of a quota used, clamped to 0-100.
 */
export function quotaPercentage(usedUsd: number, limitUsd: number): number {
  if (limitUsd <= 0) return 0;
  return clamp((usedUsd / limitUsd) * 100, 0, 100);
}

/**
 * Human-readable security tier label.
 */
export function tierLabel(tier: string): string {
  switch (tier) {
    case 'TIER_1_AUTONOMOUS':
      return 'Tier 1 - Autonomous';
    case 'TIER_2_CONFIRMATION':
      return 'Tier 2 - Confirmation';
    case 'TIER_3_BIOMETRIC':
      return 'Tier 3 - Biometric';
    default:
      return tier;
  }
}

/**
 * Short security tier tag for badges.
 */
export function tierShort(tier: string): string {
  switch (tier) {
    case 'TIER_1_AUTONOMOUS':
      return 'TIER 1';
    case 'TIER_2_CONFIRMATION':
      return 'TIER 2';
    case 'TIER_3_BIOMETRIC':
      return 'TIER 3';
    default:
      return tier;
  }
}
