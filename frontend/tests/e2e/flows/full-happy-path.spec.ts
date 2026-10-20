import { expect, test } from '@playwright/test';
import {
  installWebAuthnStub,
  mockBackend,
  openApp,
  openLedger,
  RAILS,
  requestPlan,
} from '../support/helpers';

test.describe('Full end-to-end happy path', () => {
  test('wire request -> 4-step DAG -> 3 corridors -> passkey step-up -> SWIFT receipt -> audit ledger record', async ({
    page,
  }) => {
    await installWebAuthnStub(page);
    await mockBackend(page);
    await openApp(page);

    await requestPlan(page);

    await expect(page.getByTestId('dag-steps').locator('li')).toHaveCount(4);
    await expect(page.getByTestId(`corridor-card-${RAILS.apec}`)).toHaveAttribute(
      'data-recommended',
      'true',
    );
    await expect(page.getByTestId('quota-remaining')).toContainText('$41,500.00 USD');

    await page.getByTestId('dag-execute').click();
    await expect(page.getByTestId('tier3-modal')).toBeVisible();

    await page.getByTestId('tier3-authenticate').click();
    await expect(page.getByTestId('tier3-modal')).toHaveCount(0);

    const receipt = page.getByTestId('swift-receipt');
    await expect(receipt).toBeVisible();
    await expect(page.getByTestId('swift-status')).toContainText('SETTLED');
    await expect(page.getByTestId('swift-reference')).toContainText('APX20261019001');

    await page.getByTestId('swift-done').click();
    await expect(receipt).toHaveCount(0);

    await openLedger(page);
    await expect(page.getByTestId('chain-verification')).toHaveAttribute('data-valid', 'true');
    await expect(page.getByTestId('audit-record-rec-005')).toContainText('TIER3_WIRE_SETTLED');
  });
});
