import { expect, test } from '@playwright/test';
import { mockBackend, openApp } from './helpers';

test.describe('Health indicator', () => {
  test('renders connected state in mint (#02F5A1) when backend is healthy', async ({ page }) => {
    await mockBackend(page, { health: 'healthy' });
    await openApp(page);

    const indicator = page.getByTestId('health-indicator');
    await expect(indicator).toBeVisible();
    await expect(indicator).toHaveAttribute('data-state', 'connected');
    await expect(indicator).toContainText('Connected');

    const labelColor = await indicator.locator('span').evaluate((el) => getComputedStyle(el).color);
    expect(labelColor).toBe('rgb(2, 245, 161)');
  });

  test('switches to crimson (#DC2626) Offline state when backend is unreachable', async ({
    page,
  }) => {
    await mockBackend(page, { health: 'offline' });
    await openApp(page);

    const indicator = page.getByTestId('health-indicator');
    await expect(indicator).toBeVisible();
    await expect(indicator).toHaveAttribute('data-state', 'disconnected');
    await expect(indicator).toContainText('Offline');

    const labelColor = await indicator.locator('span').evaluate((el) => getComputedStyle(el).color);
    expect(labelColor).toBe('rgb(220, 38, 38)');
  });

  test('switches to Offline state when backend returns HTTP 503', async ({ page }) => {
    await mockBackend(page, { health: 'unhealthy' });
    await openApp(page);

    const indicator = page.getByTestId('health-indicator');
    await expect(indicator).toHaveAttribute('data-state', 'disconnected');
    await expect(indicator).toContainText('Offline');
  });
});
