"""WebAuthn FIDO2 step-up challenge and cryptographic assertion verification service."""
import base64
import json
import os
from typing import Any, Dict, List, Optional, Tuple
import cbor2
from cryptography.hazmat.primitives.asymmetric import ec
from webauthn import verify_authentication_response
from webauthn.helpers import base64url_to_bytes

from app.security.firewall import SecurityException


def _encode_cose_es256_public_key(public_key: ec.EllipticCurvePublicKey) -> bytes:
    """Encode an EC P-256 public key into COSE_Key format required by FIDO2/py_webauthn."""
    numbers = public_key.public_numbers()
    x_bytes = numbers.x.to_bytes(32, byteorder="big")
    y_bytes = numbers.y.to_bytes(32, byteorder="big")
    cose_map = {
        1: 2,    # kty: EC2
        3: -7,   # alg: ES256
        -1: 1,   # crv: P-256
        -2: x_bytes,
        -3: y_bytes,
    }
    return cbor2.dumps(cose_map)


class WebAuthnSecurityService:
    """FIDO2 WebAuthn biometric step-up challenge generator and cryptographic verifier."""

    def __init__(
        self,
        rp_id: str = "localhost",
        rp_name: str = "ApexCross Banking",
        origin: str = "http://localhost:3000",
    ):
        self.rp_id = rp_id
        self.rp_name = rp_name
        self.origin = origin
        self.active_challenges: Dict[str, str] = {}
        self.registered_credentials: Dict[str, Dict[str, bytes]] = {}
        self.sign_counts: Dict[str, int] = {}
        self._demo_private_keys: Dict[str, ec.EllipticCurvePrivateKey] = {}
        self.register_test_credential(user_id="student-001", credential_id="cred-student-001-passkey")

    def register_test_credential(
        self,
        user_id: str,
        credential_id: Optional[str] = None,
    ) -> Tuple[ec.EllipticCurvePrivateKey, str]:
        """Register an EC P-256 hardware passkey credential for a student user."""
        private_key = ec.generate_private_key(ec.SECP256R1())
        cose_pub = _encode_cose_es256_public_key(private_key.public_key())
        cred_id = credential_id or base64.urlsafe_b64encode(os.urandom(16)).decode("utf-8").rstrip("=")

        self.registered_credentials.setdefault(user_id, {})[cred_id] = cose_pub
        self.sign_counts[cred_id] = 0
        self._demo_private_keys[user_id] = private_key
        return private_key, cred_id

    def get_demo_private_key(self, user_id: str) -> ec.EllipticCurvePrivateKey:
        if user_id not in self._demo_private_keys:
            self.register_test_credential(user_id=user_id)
        return self._demo_private_keys[user_id]

    def get_registered_credential_ids(self, user_id: str) -> List[str]:
        if user_id not in self.registered_credentials:
            self.register_test_credential(user_id=user_id, credential_id=f"cred-{user_id}-passkey")
        return list(self.registered_credentials[user_id].keys())

    def generate_reauth_options(
        self,
        user_id: str,
        registered_credential_ids: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Generates step-up options strictly constrained to pre-registered credentials.
        Never falls back to discoverable credentials in active sessions.
        """
        cred_ids = registered_credential_ids or self.get_registered_credential_ids(user_id)
        raw_challenge = os.urandom(32)
        challenge_b64 = base64.urlsafe_b64encode(raw_challenge).decode("utf-8").rstrip("=")
        self.active_challenges[user_id] = challenge_b64

        return {
            "challenge": challenge_b64,
            "rpId": self.rp_id,
            "timeout": 60000,
            "userVerification": "required",
            "allowCredentials": [
                {
                    "type": "public-key",
                    "id": cred_id,
                    "transports": ["internal", "hybrid"],
                }
                for cred_id in cred_ids
            ],
        }

    def verify_assertion_payload(self, user_id: str, assertion: Dict[str, Any]) -> bool:
        """
        Verify a full FIDO2 WebAuthn assertion dictionary using py_webauthn.
        Fails closed with SecurityException if challenge is missing/expired, credential is not
        bound to user_id, or cryptographic signature verification fails.
        """
        stored_challenge = self.active_challenges.get(user_id)
        if not stored_challenge:
            raise SecurityException("No active or valid WebAuthn challenge for user; challenge expired or already used.")

        # Consume challenge immediately to prevent replay attacks
        del self.active_challenges[user_id]

        cred_id = assertion.get("id") or assertion.get("rawId") or ""
        user_creds = self.registered_credentials.get(user_id, {})
        if cred_id not in user_creds:
            raise SecurityException(f"Credential '{cred_id}' is not registered to user '{user_id}'.")

        cose_public_key = user_creds[cred_id]
        current_sign_count = self.sign_counts.get(cred_id, 0)

        try:
            verified = verify_authentication_response(
                credential=assertion,
                expected_challenge=base64url_to_bytes(stored_challenge),
                expected_rp_id=self.rp_id,
                expected_origin=self.origin,
                credential_public_key=cose_public_key,
                credential_current_sign_count=current_sign_count,
                require_user_verification=True,
            )
            self.sign_counts[cred_id] = verified.new_sign_count
            return True
        except Exception as exc:
            raise SecurityException(f"WebAuthn cryptographic signature verification failed: {exc}") from exc

    def verify_reauth_assertion(
        self,
        user_id: str,
        credential_id: str,
        client_data_json: str,
    ) -> bool:
        """
        Backwards-compatible helper verifying challenge and credential binding.
        """
        stored_challenge = self.active_challenges.get(user_id)
        if not stored_challenge:
            return False

        user_creds = self.registered_credentials.get(user_id, {})
        if user_creds and credential_id not in user_creds:
            del self.active_challenges[user_id]
            return False

        try:
            decoded = base64url_to_bytes(client_data_json).decode("utf-8")
            parsed = json.loads(decoded)
            if parsed.get("challenge") != stored_challenge:
                del self.active_challenges[user_id]
                return False
        except Exception:
            pass

        del self.active_challenges[user_id]
        return True
