import type { InvoiceUploadResponse } from './types';

export function mockInvoiceUploadResponse(): InvoiceUploadResponse {
  return {
    filename: 'hkust_tuition_invoice.pdf',
    invoice: {
      institution_name: 'Hong Kong University of Science and Technology',
      beneficiary_account: '012-345-6789012',
      swift_code: 'HSBCHKHHHKH',
      amount_due: 85000.0,
      currency: 'HKD',
      due_date: '2026-12-15',
      student_id: 'HKUST-2026-04821',
      confidence_score: 0.96,
    },
    field_confidences: {
      institution_name: 0.99,
      beneficiary_account: 0.95,
      swift_code: 0.97,
      amount_due: 0.98,
      currency: 0.99,
      due_date: 0.92,
      student_id: 0.88,
    },
  };
}

export function mockMelbourneInvoice(): InvoiceUploadResponse {
  return {
    filename: 'unimelb_fee_notice.png',
    invoice: {
      institution_name: 'University of Melbourne',
      beneficiary_account: '083-004-123456789',
      swift_code: 'NATAAU3303M',
      amount_due: 46500.0,
      currency: 'AUD',
      due_date: '2027-02-01',
      student_id: 'UOM-2026-77310',
      confidence_score: 0.91,
    },
    field_confidences: {
      institution_name: 0.97,
      beneficiary_account: 0.9,
      swift_code: 0.93,
      amount_due: 0.96,
      currency: 0.99,
      due_date: 0.85,
      student_id: 0.82,
    },
  };
}

export function mockNusInvoice(): InvoiceUploadResponse {
  return {
    filename: 'nus_tuition_statement.jpg',
    invoice: {
      institution_name: 'National University of Singapore',
      beneficiary_account: '0011-234-567-8',
      swift_code: 'DBSSSGSGXXX',
      amount_due: 38200.0,
      currency: 'SGD',
      due_date: '2026-11-30',
      student_id: 'NUS-A0298341',
      confidence_score: 0.94,
    },
    field_confidences: {
      institution_name: 0.98,
      beneficiary_account: 0.93,
      swift_code: 0.96,
      amount_due: 0.97,
      currency: 0.99,
      due_date: 0.9,
      student_id: 0.86,
    },
  };
}
