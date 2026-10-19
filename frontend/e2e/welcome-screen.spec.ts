import { expect, test } from '@playwright/test';
import { mockBackend, openApp } from './helpers';

test.describe('Welcome screen & suggestion chips', () => {
  test('renders welcome headline and description on empty transcript', async ({ page }) => {
    await mockBackend(page);
    await openApp(page);

    const welcome = page.getByTestId('welcome-state');
    await expect(welcome).toBeVisible();
    await expect(welcome.locator('h1')).toContainText('Cross-border tuition, cleared.');
    await expect(welcome).toContainText('SAFE annual quota');
  });

  test('displays all 4 suggestion chips and hides them after clicking one', async ({ page }) => {
    await mockBackend(page);
    await openApp(page);

    const chipsContainer = page.getByTestId('suggestion-chips');
    await expect(chipsContainer).toBeVisible();
    await expect(chipsContainer.locator('button')).toHaveCount(4);

    const hkustChip = page.getByTestId('suggestion-wire-85,000-hkd-to-hkust');
    await expect(hkustChip).toBeVisible();
    await hkustChip.click();

    await expect(page.getByTestId('message-user')).toContainText('Wire 85,000 HKD tuition to HKUST');
    await expect(page.getByTestId('message-agent')).toBeVisible();
    await expect(page.getByTestId('welcome-state')).toHaveCount(0);
    await expect(chipsContainer).toHaveCount(0);
  });
});
