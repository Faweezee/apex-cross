import { expect, test } from '@playwright/test';
import { mockClarificationResponse, mockPlanReadyResponse } from '../src/lib/__mocks__';
import { mockBackend, openApp, sendMessage, WIRE_PROMPT } from './helpers';

test.describe('Chat flow', () => {
  test('submits message, shows typing skeleton, clears input, and renders agent turn', async ({
    page,
  }) => {
    await mockBackend(page, {
      chat: () => ({ status: 200, body: mockPlanReadyResponse(), delayMs: 250 }),
    });
    await openApp(page);

    const input = page.getByTestId('chat-input');
    await input.fill(WIRE_PROMPT);
    await expect(input).toHaveValue(WIRE_PROMPT);

    await page.getByTestId('chat-send').click();
    await expect(input).toHaveValue('');
    await expect(page.getByTestId('message-skeleton')).toBeVisible();

    await expect(page.getByTestId('message-user')).toContainText(WIRE_PROMPT);
    await expect(page.getByTestId('message-agent')).toContainText('APEC Direct Clearing');
    await expect(page.getByTestId('message-skeleton')).toHaveCount(0);
  });

  test('renders clarification card when agent requests missing fields', async ({ page }) => {
    await mockBackend(page, {
      chat: () => ({ status: 200, body: mockClarificationResponse() }),
    });
    await openApp(page);

    await sendMessage(page, 'I need to pay tuition soon');

    const card = page.getByTestId('clarification-card');
    await expect(card).toBeVisible();
    await expect(page.getByTestId('clarification-missing-fields')).toContainText('amount');
  });

  test('renders direct Tier 1 FX rate card on read-only rate query', async ({ page }) => {
    await mockBackend(page);
    await openApp(page);

    await sendMessage(page, 'What is the CNY to HKD exchange rate today?');
    await expect(page.getByTestId('fx-rates-panel')).toBeVisible();
    await expect(page.getByTestId('fx-rates-panel')).toContainText('1.0924');
  });
});
