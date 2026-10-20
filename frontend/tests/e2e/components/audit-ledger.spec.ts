import { expect, test } from '@playwright/test';
import { mockBackend, openApp, openLedger } from '../support/helpers';

test.describe('Audit ledger & SHA-256 hash chain', () => {
  test('renders chain verified banner, 5 chained records, supports Verify chain and action filter', async ({
    page,
  }) => {
    await mockBackend(page);
    await openApp(page);
    await openLedger(page);

    const banner = page.getByTestId('chain-verification');
    await expect(banner).toHaveAttribute('data-valid', 'true');
    await expect(page.getByTestId('chain-status')).toContainText('Chain verified');
    await expect(page.getByTestId('chain-total')).toHaveText('5');
    await expect(page.getByTestId('chain-latest-hash')).toBeVisible();

    const records = page.getByTestId('audit-records').locator('li');
    await expect(records).toHaveCount(5);

    await page.getByTestId('audit-record-toggle-rec-001').click();
    await expect(page.getByTestId('audit-record-details-rec-001')).toBeVisible();

    await page.getByTestId('chain-verify-button').click();
    await expect(page.getByTestId('chain-status')).toContainText('Chain verified');

    const filter = page.getByTestId('audit-filter');
    await filter.selectOption('TIER3_WIRE_SETTLED');
    await expect(records).toHaveCount(1);
    await expect(page.getByTestId('audit-record-rec-005')).toBeVisible();

    await filter.selectOption('ALL');
    await expect(records).toHaveCount(5);

    await page.getByTestId('audit-search').fill('rec-003');
    await expect(records).toHaveCount(1);
    await expect(page.getByTestId('audit-record-rec-003')).toBeVisible();
  });
});
