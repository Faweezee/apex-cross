import { expect, test } from '@playwright/test';
import { mockBackend, openApp, RAILS, requestPlan } from './helpers';

test.describe('Corridor cards', () => {
  test('renders 3 corridor cards, highlights recommended route, shows telemetry, and allows route selection', async ({
    page,
  }) => {
    await mockBackend(page);
    await openApp(page);
    await requestPlan(page);

    const container = page.getByTestId('corridor-cards');
    await expect(container).toBeVisible();
    await expect(container.locator('article')).toHaveCount(3);

    const apecCard = page.getByTestId(`corridor-card-${RAILS.apec}`);
    const swiftCard = page.getByTestId(`corridor-card-${RAILS.swift}`);
    const wiseCard = page.getByTestId(`corridor-card-${RAILS.wise}`);

    await expect(apecCard).toHaveAttribute('data-recommended', 'true');
    await expect(apecCard).toHaveAttribute('data-selected', 'true');
    await expect(apecCard).toContainText('Recommended');
    await expect(apecCard).toContainText('$18.50 USD');
    await expect(apecCard).toContainText('6 hours');
    await expect(apecCard).toContainText('$395.95 USD');

    await expect(swiftCard).toHaveAttribute('data-recommended', 'false');
    await expect(wiseCard).toHaveAttribute('data-recommended', 'false');

    const selectWise = page.getByTestId(`corridor-select-${RAILS.wise}`);
    await selectWise.click();
    await expect(wiseCard).toHaveAttribute('data-selected', 'true');
    await expect(apecCard).toHaveAttribute('data-selected', 'false');
    await expect(selectWise).toContainText('Selected');
  });
});
