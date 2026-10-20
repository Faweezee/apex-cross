import { expect, test } from '@playwright/test';
import { mockInvoiceUploadResponse } from '../src/lib/__mocks__';
import { mockBackend, openApp } from './helpers';

test.describe('Invoice upload & OCR verification modal', () => {
  test('accepts file in dropzone, shows loading state, opens editable modal, and compiles plan on confirm', async ({
    page,
  }) => {
    await mockBackend(page, {
      invoice: () => ({ status: 200, body: mockInvoiceUploadResponse(), delayMs: 250 }),
    });
    await openApp(page);

    await page.getByTestId('chat-attach').click();
    const dropzone = page.getByTestId('invoice-dropzone');
    await expect(dropzone).toBeVisible();

    const fileInput = page.getByTestId('invoice-file-input');
    await fileInput.setInputFiles({
      name: 'hkust_tuition_invoice.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 mock invoice'),
    });

    await expect(page.getByTestId('invoice-parsing')).toBeVisible();

    const modal = page.getByTestId('invoice-modal');
    await expect(modal).toBeVisible();
    await expect(page.getByTestId('confidence-institution_name')).toContainText('99%');

    const amountInput = page.getByTestId('invoice-input-amount_due');
    await expect(amountInput).toHaveValue('85000');
    await amountInput.fill('86000');
    await expect(amountInput).toHaveValue('86000');

    await page.getByTestId('invoice-modal-confirm').click();
    await expect(modal).toHaveCount(0);
    await expect(page.getByTestId('dag-viewer')).toBeVisible();
  });
});
