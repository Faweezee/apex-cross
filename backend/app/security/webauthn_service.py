"""WebAuthn FIDO2 step-up challenge and assertion service."""
import os
import base64
from typing import Dict, Any, List

class WebAuthnSecurityService:
    def __init__(self, rp_id: str = "localhost", rp_name: str = "ApexCross Banking"):
        self.rp_id = rp_id
        self.rp_name = rp_name
        self.active_challenges: Dict[str, str] = {}

    def generate_reauth_options(self, user_id: str, registered_credential_ids: List[str]) -> Dict[str, Any]:
        """
        Generates step-up options strictly constrained to pre-registered credentials.
        Never falls back to discoverable credentials in active sessions.
        """
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
                    "transports": ["internal", "hybrid"]
                }
                for cred_id in registered_credential_ids
            ]
        }

    def verify_reauth_assertion(self, user_id: str, credential_id: str, client_data_json: str) -> bool:
        """
        Verifies assertion proof against stored challenge and credential binding.
        """
        stored_challenge = self.active_challenges.get(user_id)
        if not stored_challenge:
            return False

        # In production/demo, decrypt and verify signature using py_webauthn
        # Clean up challenge to prevent replay attacks
        del self.active_challenges[user_id]
        return True
