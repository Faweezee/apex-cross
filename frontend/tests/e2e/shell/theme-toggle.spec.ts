import { expect, test } from '@playwright/test';
import { mockBackend, openApp } from '../support/helpers';

test.describe('Theme toggle', () => {
  test('toggles between dark and light theme and persists across page reload in localStorage', async ({
    page,
  }) => {
    await mockBackend(page);
    await openApp(page);

    const toggle = page.getByTestId('theme-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('data-theme', 'dark');

    await toggle.click();
    await expect(toggle).toHaveAttribute('data-theme', 'light');

    const stored = await page.evaluate(() => window.localStorage.getItem('apexcross-theme'));
    expect(stored).toBe('light');

    await page.reload();
    await expect(page.getByTestId('theme-toggle')).toHaveAttribute('data-theme', 'light');

    await page.getByTestId('theme-toggle').click();
    await expect(page.getByTestId('theme-toggle')).toHaveAttribute('data-theme', 'dark');
  });
});
