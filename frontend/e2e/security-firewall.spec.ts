import { expect, test } from '@playwright/test';
import {
  ADVERSARIAL_PROMPTS,
  firewallChat,
  mockBackend,
  openApp,
  sendMessage,
  WIRE_PROMPT,
} from './helpers';

test.describe('Pre-agent security firewall', () => {
  test('blocks adversarial prompt with crimson alert banner, allows dismissal, and permits normal prompts after', async ({
    page,
  }) => {
    const adversarialSet = new Set(ADVERSARIAL_PROMPTS);
    await mockBackend(page, {
      chat: firewallChat((msg) => adversarialSet.has(msg)),
    });
    await openApp(page);

    await sendMessage(page, ADVERSARIAL_PROMPTS[0]);

    const alerts = page.getByTestId('security-alert');
    await expect(alerts.first()).toBeVisible();
    await expect(page.getByTestId('security-alert-reason').first()).toContainText(
      'Prompt injection detected',
    );
    await expect(page.getByTestId('dag-viewer')).toHaveCount(0);

    await page.getByTestId('security-alert-dismiss').first().click();

    await sendMessage(page, WIRE_PROMPT);
    await expect(page.getByTestId('dag-viewer')).toBeVisible();
  });
});
