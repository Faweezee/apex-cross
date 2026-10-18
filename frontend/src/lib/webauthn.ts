/**
 * Triggers native WebAuthn biometric prompt (TouchID/FaceID/Windows Hello).
 */
import { startAuthentication } from '@simplewebauthn/browser';

export async function executePasskeyReauth(userId: string): Promise<boolean> {
  try {
    // 1. Fetch challenge from backend
    const optionsRes = await fetch(`/api/auth/reauth/options?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!optionsRes.ok) {
      throw new Error('Failed to fetch authentication challenge options');
    }

    const options = await optionsRes.json();

    // 2. Trigger native browser authenticator
    const assertion = await startAuthentication(options);

    // 3. Send assertion back for verification
    const verifyRes = await fetch('/api/auth/reauth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, assertion })
    });

    return verifyRes.ok;
  } catch (error) {
    console.error('WebAuthn step-up authentication failed or cancelled:', error);
    return false;
  }
}
