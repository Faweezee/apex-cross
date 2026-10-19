import { expect, test } from '@playwright/test';
import { installWebAuthnStub, mockBackend, openApp, requestPlan } from './helpers';

test.describe('SWIFT MT103 settlement receipt', () => {
  test('displays SETTLED badge, monospace MT103 message, 64-char SHA-256 hash, and working copy buttons', async ({
    page,
  }) => {
    await installWebAuthnStub(page);
    await mockBackend(page);
    await openApp(page);
    await requestPlan(page);

    await page.getByTestId('dag-execute').click();
    await page.getByTestId('tier3-authenticate').click();

    const receipt = page.getByTestId('swift-receipt');
    await expect(receipt).toBeVisible();
    await expect(page.getByTestId('swift-status')).toContainText('SETTLED');
    await expect(page.getByTestId('swift-reference')).toContainText('APX20261019001');

    const mt103 = page.getByTestId('swift-mt103');
    await expect(mt103).toContainText(':20:APX20261019001');
    await expect(mt103).toContainText(':32A:261021HKD85000,00');

    const hashEl = page.getByTestId('swift-tx-hash');
    const hashText = (await hashEl.textContent())?.trim() ?? '';
    expect(hashText).toMatch(/^[0-9a-f]{64}$/);

    await page.getByTestId('swift-copy-mt103').click();
    await page.getByTestId('swift-copy-hash').click();

    await page.getByTestId('swift-done').click();
    await expect(receipt).toHaveCount(0);
  });
});
