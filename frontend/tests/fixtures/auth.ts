import { MOCK_PLAN_ID, MOCK_USER_ID } from './agent';
import type { MockErrorResponse, SwiftWireReceipt, WebAuthnVerifyResponse } from './types';

/** Base64url challenge. Response of POST /api/auth/reauth/options (untyped object in OpenAPI). */
export function mockReauthOptions(): Record<string, unknown> {
  return {
    challenge: 'dGVzdC1jaGFsbGVuZ2UtYXBleGNyb3NzLTAwMQ',
    timeout: 60000,
    rpId: 'localhost',
    allowCredentials: [
      {
        type: 'public-key',
        id: 'ZGVtby1jcmVkZW50aWFsLWlkLTAwMQ',
        transports: ['internal', 'hybrid'],
      },
    ],
    userVerification: 'required',
  };
}

export const MOCK_TRANSACTION_HASH =
  'a3f1c9d2e87b4560f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708';

export function mockSwiftReceipt(): SwiftWireReceipt {
  return {
    reference_id: 'APX20261019001',
    uetr: '97ed4827-7b6f-4491-a06f-b548d5a7512d',
    value_date: '2026-10-21',
    beneficiary_name: 'Hong Kong University of Science and Technology',
    beneficiary_account: '012-345-6789012',
    swift_code: 'HSBCHKHHHKH',
    amount: 85000.0,
    currency: 'HKD',
    student_id: 'HKUST-2026-04821',
    mt103_message: [
      '{1:F01APEXCNSHAXXX0000000000}',
      '{2:I103HSBCHKHHHKHXN}',
      '{4:',
      ':20:APX20261019001',
      ':23B:CRED',
      ':32A:261021HKD85000,00',
      ':50K:/CN-DEMO-USER-001',
      ':59:/012-345-6789012',
      'HONG KONG UNIVERSITY OF SCIENCE AND TECHNOLOGY',
      ':70:TUITION HKUST-2026-04821',
      ':71A:SHA',
      '-}',
    ].join('\n'),
    transaction_hash: MOCK_TRANSACTION_HASH,
    status: 'SETTLED',
  };
}

export function mockVerifySuccessResponse(): WebAuthnVerifyResponse {
  return {
    verified: true,
    security_tier: 'TIER_3_BIOMETRIC',
    user_id: MOCK_USER_ID,
    plan_id: MOCK_PLAN_ID,
    receipt: mockSwiftReceipt(),
  };
}

/** HTTP 403 when the WebAuthn assertion fails. Fail-closed. */
export function mockVerifyFailureResponse(): MockErrorResponse {
  return {
    status: 403,
    body: {
      detail: 'SecurityException: WebAuthn assertion verification failed.',
    },
  };
}
