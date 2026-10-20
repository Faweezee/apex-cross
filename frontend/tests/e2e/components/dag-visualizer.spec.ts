import { expect, test } from '@playwright/test';
import { mockQuotaExceededResponse } from '../../fixtures';
import { mockBackend, openApp, requestPlan, sendMessage } from '../support/helpers';

test.describe('DAG visualizer', () => {
  test('renders 4 steps with status badges, expands step details, and shows Execute on Step 4', async ({
    page,
  }) => {
    await mockBackend(page);
    await openApp(page);
    await requestPlan(page);

    const steps = page.getByTestId('dag-steps').locator('li');
    await expect(steps).toHaveCount(4);

    await expect(page.getByTestId('dag-step-task-1')).toHaveAttribute('data-status', 'COMPLETED');
    await expect(page.getByTestId('dag-step-task-2')).toHaveAttribute('data-status', 'COMPLETED');
    await expect(page.getByTestId('dag-step-task-3')).toHaveAttribute('data-status', 'COMPLETED');
    await expect(page.getByTestId('dag-step-task-4')).toHaveAttribute('data-status', 'PENDING');

    const toggle1 = page.getByTestId('dag-step-toggle-task-1');
    await expect(toggle1).toBeVisible();
    await toggle1.click();
    await expect(page.getByTestId('dag-step-output-task-1')).toContainText(
      'Hong Kong University of Science and Technology',
    );
    await toggle1.click();
    await expect(page.getByTestId('dag-step-output-task-1')).toHaveCount(0);

    const executeBtn = page.getByTestId('dag-execute');
    await expect(executeBtn).toBeVisible();
    await expect(executeBtn).toContainText('Authorize with passkey');
  });

  test('shows blocked banner and hides execute button when Step 2 is BLOCKED', async ({ page }) => {
    await mockBackend(page, {
      chat: () => ({ status: 200, body: mockQuotaExceededResponse() }),
    });
    await openApp(page);
    await sendMessage(page, 'Wire 85,000 HKD to HKUST');

    await expect(page.getByTestId('dag-viewer')).toBeVisible();
    await expect(page.getByTestId('dag-step-task-2')).toHaveAttribute('data-status', 'BLOCKED');
    await expect(page.getByTestId('dag-blocked-note')).toBeVisible();
    await expect(page.getByTestId('dag-execute')).toHaveCount(0);
  });
});
