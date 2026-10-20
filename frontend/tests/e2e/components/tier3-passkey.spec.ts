import { expect, test } from '@playwright/test';
import { mockVerifyFailureResponse } from '../../fixtures';
import {
  installWebAuthnStub,
  mockBackend,
  openApp,
  requestPlan,
  webauthnCallCount,
} from '../support/helpers';

test.describe('Tier 3 passkey authorization modal', () => {
  test('shows wire summary and Tier 3 badge, triggers WebAuthn on Authenticate, and transitions to receipt', async ({
    page,
  }) => {
    await installWebAuthnStub(page);
    await mockBackend(page);
    await openApp(page);
    await requestPlan(page);

    await page.getByTestId('dag-execute').click();

    const modal = page.getByTestId('tier3-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Tier 3 biometric');
    await expect(page.getByTestId('tier3-summary')).toContainText(
      'Hong Kong University of Science and Technology',
    );
    await expect(page.getByTestId('tier3-summary')).toContainText('HSBCHKHHHKH');
    await expect(page.getByTestId('tier3-amount')).toContainText('HKD 85,000.00');

    await page.getByTestId('tier3-authenticate').click();
    await expect(page.getByTestId('swift-receipt')).toBeVisible();
    expect(await webauthnCallCount(page)).toBe(1);
  });

  test('displays crimson error when biometric assertion is cancelled or fails', async ({
    page,
  }) => {
    await installWebAuthnStub(page, { reject: true });
    await mockBackend(page);
    await openApp(page);
    await requestPlan(page);

    await page.getByTestId('dag-execute').click();
    await page.getByTestId('tier3-authenticate').click();

    await expect(page.getByTestId('tier3-error')).toBeVisible();
    await expect(page.getByTestId('tier3-error')).toContainText('NOT executed');
    await expect(page.getByTestId('swift-receipt')).toHaveCount(0);

    await page.getByTestId('tier3-cancel').click();
    await expect(page.getByTestId('tier3-modal')).toHaveCount(0);
  });

  test('surfaces backend verification rejection when /api/auth/reauth/verify returns 403', async ({
    page,
  }) => {
    const fail = mockVerifyFailureResponse();
    await installWebAuthnStub(page);
    await mockBackend(page, {
      reauthVerify: () => ({ status: fail.status, body: fail.body }),
    });
    await openApp(page);
    await requestPlan(page);

    await page.getByTestId('dag-execute').click();
    await page.getByTestId('tier3-authenticate').click();

    await expect(page.getByTestId('tier3-error')).toContainText('WebAuthn assertion');
  });
});
