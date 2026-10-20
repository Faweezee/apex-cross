import { expect, test } from '@playwright/test';
import { mockQuotaWarningResponse } from '../src/lib/__mocks__';
import { mockBackend, openApp, requestPlan, sendMessage } from './helpers';

test.describe('Annual SAFE FX quota display', () => {
  test('shows initial $50,000 USD allowance with 0% bar fill, then updates to 17% after plan compilation', async ({
    page,
  }) => {
    await mockBackend(page);
    await openApp(page);

    const bar = page.getByTestId('quota-bar');
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute('data-decision', 'ALLOW');
    await expect(page.getByTestId('quota-remaining')).toContainText('$50,000.00 USD');

    const fill = page.getByTestId('quota-fill');
    await expect(fill).toHaveAttribute('style', /width:\s*0%/);

    await requestPlan(page);
    await expect(page.getByTestId('quota-remaining')).toContainText('$41,500.00 USD');
    await expect(fill).toHaveAttribute('style', /width:\s*17%/);
  });

  test('switches to WARNING state when remaining quota drops below $5,000 USD', async ({
    page,
  }) => {
    await mockBackend(page, {
      chat: () => ({ status: 200, body: mockQuotaWarningResponse() }),
    });
    await openApp(page);
    await sendMessage(page, 'Wire 85,000 HKD to HKUST');

    await expect(page.getByTestId('quota-bar')).toHaveAttribute('data-decision', 'WARNING');
    await expect(page.getByTestId('quota-remaining')).toContainText('$4,200.00 USD');
  });
});
