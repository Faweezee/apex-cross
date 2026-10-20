import { expect, test } from '@playwright/test';
import { mockMicroConvertSlippageError, mockTier2PlanResponse } from '../../fixtures';
import { mockBackend, openApp, sendMessage } from '../support/helpers';

test.describe('Tier 2 micro-conversion modal', () => {
  test('displays rate, fee, slippage, and wallet balances, confirms conversion, and shows success receipt', async ({
    page,
  }) => {
    await mockBackend(page, {
      chat: () => ({ status: 200, body: mockTier2PlanResponse() }),
    });
    await openApp(page);
    await sendMessage(page, 'Convert 1,000 CNY to HKD');

    const executeBtn = page.getByTestId('dag-execute');
    await expect(executeBtn).toContainText('Confirm conversion');
    await executeBtn.click();

    const modal = page.getByTestId('tier2-modal');
    await expect(modal).toBeVisible();
    await expect(page.getByTestId('tier2-rate')).toContainText('1 CNY = 1.0924 HKD');
    await expect(page.getByTestId('tier2-fee')).toBeVisible();
    await expect(page.getByTestId('tier2-balances')).toContainText('CNY wallet');
    await expect(page.getByTestId('tier2-balances')).toContainText('HKD wallet');

    await page.getByTestId('tier2-confirm').click();
    await expect(page.getByTestId('tier2-success')).toBeVisible();
    await expect(page.getByTestId('tier2-conversion-id')).toContainText('conv-');

    await page.getByTestId('tier2-done').click();
    await expect(modal).toHaveCount(0);
  });

  test('closes when Cancel is clicked without executing conversion', async ({ page }) => {
    await mockBackend(page, {
      chat: () => ({ status: 200, body: mockTier2PlanResponse() }),
    });
    await openApp(page);
    await sendMessage(page, 'Convert 1,000 CNY to HKD');

    await page.getByTestId('dag-execute').click();
    const modal = page.getByTestId('tier2-modal');
    await expect(modal).toBeVisible();

    await page.getByTestId('tier2-cancel').click();
    await expect(modal).toHaveCount(0);
  });

  test('surfaces slippage error inside modal when backend returns HTTP 400', async ({ page }) => {
    const err = mockMicroConvertSlippageError();
    await mockBackend(page, {
      chat: () => ({ status: 200, body: mockTier2PlanResponse() }),
      microConvert: () => ({ status: err.status, body: err.body }),
    });
    await openApp(page);
    await sendMessage(page, 'Convert 1,000 CNY to HKD');

    await page.getByTestId('dag-execute').click();
    await page.getByTestId('tier2-confirm').click();

    await expect(page.getByTestId('tier2-error')).toContainText('Slippage exceeded');
  });
});
