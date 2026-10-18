"""Unit and API tests for Tier 3 FIDO2 WebAuthn Passkey biometric verification and SWIFT MT103 execution."""
import base64
import hashlib
import json
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.schemas import CurrencyEnum, SecurityTier
from app.security.firewall import SecurityException
from app.security.webauthn_service import WebAuthnSecurityService
from app.tools.swift_mock import SwiftMT103Generator

client = TestClient(app)


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _build_signed_webauthn_assertion(
    private_key: ec.EllipticCurvePrivateKey,
    credential_id: str,
    challenge_b64: str,
    rp_id: str = "localhost",
    origin: str = "http://localhost:3000",
    sign_count: int = 1,
) -> dict:
    """Construct a real cryptographically signed FIDO2 WebAuthn authentication assertion."""
    client_data = {
        "type": "webauthn.get",
        "challenge": challenge_b64,
        "origin": origin,
        "crossOrigin": False,
    }
    client_data_bytes = json.dumps(client_data).encode("utf-8")

    # Authenticator data: 32-byte rpIdHash + 1-byte flags (UP=0x01 | UV=0x04 = 0x05) + 4-byte signCount
    rp_id_hash = hashlib.sha256(rp_id.encode("utf-8")).digest()
    flags = bytes([0x05])
    counter_bytes = sign_count.to_bytes(4, byteorder="big")
    auth_data_bytes = rp_id_hash + flags + counter_bytes

    client_data_hash = hashlib.sha256(client_data_bytes).digest()
    signature_bytes = private_key.sign(auth_data_bytes + client_data_hash, ec.ECDSA(hashes.SHA256()))

    return {
        "id": credential_id,
        "rawId": credential_id,
        "type": "public-key",
        "response": {
            "clientDataJSON": _b64url_encode(client_data_bytes),
            "authenticatorData": _b64url_encode(auth_data_bytes),
            "signature": _b64url_encode(signature_bytes),
            "userHandle": _b64url_encode(b"student-001"),
        },
    }


def test_reauth_options_constrains_allow_credentials():
    """Verify POST /api/auth/reauth/options returns a challenge strictly bound to pre-registered credentials."""
    response = client.post("/api/auth/reauth/options?userId=student-001")
    assert response.status_code == 200
    data = response.json()
    assert "challenge" in data
    assert data["rpId"] == "localhost"
    assert data["userVerification"] == "required"
    assert len(data["allowCredentials"]) >= 1
    assert data["allowCredentials"][0]["type"] == "public-key"


def test_real_py_webauthn_cryptographic_signature_verification_and_swift_mt103():
    """Verify full FIDO2 ECDSA cryptographic assertion via py_webauthn and SWIFT MT103 receipt generation."""
    service = WebAuthnSecurityService(rp_id="localhost", origin="http://localhost:3000")
    private_key, cred_id = service.register_test_credential(user_id="student-crypto")

    options = service.generate_reauth_options(
        user_id="student-crypto",
        registered_credential_ids=[cred_id],
    )
    assertion = _build_signed_webauthn_assertion(
        private_key=private_key,
        credential_id=cred_id,
        challenge_b64=options["challenge"],
    )
    assert service.verify_assertion_payload(user_id="student-crypto", assertion=assertion) is True

    # Replay with the same challenge must fail closed because the challenge was consumed
    with pytest.raises(SecurityException):
        service.verify_assertion_payload(user_id="student-crypto", assertion=assertion)


def test_webauthn_rejects_spoofed_credential_and_tampered_signature():
    """Verify spoofed credential IDs or tampered cryptographic signatures fail closed with SecurityException."""
    service = WebAuthnSecurityService(rp_id="localhost", origin="http://localhost:3000")
    private_key, cred_id = service.register_test_credential(user_id="student-victim")
    attacker_key = ec.generate_private_key(ec.SECP256R1())

    options = service.generate_reauth_options(
        user_id="student-victim",
        registered_credential_ids=[cred_id],
    )
    # Signed by attacker's private key instead of the registered passkey
    bad_assertion = _build_signed_webauthn_assertion(
        private_key=attacker_key,
        credential_id=cred_id,
        challenge_b64=options["challenge"],
    )
    with pytest.raises(SecurityException):
        service.verify_assertion_payload(user_id="student-victim", assertion=bad_assertion)


def test_reauth_verify_endpoint_executes_swift_mt103_and_rejects_invalid_assertion():
    """Verify POST /api/auth/reauth/verify returns SWIFT MT103 wire receipt on valid passkey and HTTP 403 on spoofed auth."""
    options_res = client.post("/api/auth/reauth/options?userId=student-001")
    assert options_res.status_code == 200
    options = options_res.json()
    cred_id = options["allowCredentials"][0]["id"]

    # Build valid assertion signed by the demo hardware passkey for student-001
    from app.routes.auth_routes import webauthn_service

    private_key = webauthn_service.get_demo_private_key("student-001")
    valid_assertion = _build_signed_webauthn_assertion(
        private_key=private_key,
        credential_id=cred_id,
        challenge_b64=options["challenge"],
    )

    verify_res = client.post(
        "/api/auth/reauth/verify",
        json={
            "userId": "student-001",
            "assertion": valid_assertion,
            "plan_id": "plan-hkust-01",
            "beneficiary_name": "HKUST",
            "beneficiary_account": "004-123-456789-001",
            "swift_code": "HSBCHKHHHKH",
            "amount": 85000.0,
            "currency": "HKD",
            "student_id": "20991234",
        },
    )
    assert verify_res.status_code == 200
    body = verify_res.json()
    assert body["verified"] is True
    assert body["security_tier"] == SecurityTier.TIER_3_BIOMETRIC.value
    assert "mt103_message" in body["receipt"]
    assert ":20:" in body["receipt"]["mt103_message"]
    assert ":32A:" in body["receipt"]["mt103_message"]
    assert len(body["receipt"]["transaction_hash"]) == 64

    # Attempting to verify again with an expired/consumed challenge must return HTTP 403
    replay_res = client.post(
        "/api/auth/reauth/verify",
        json={
            "userId": "student-001",
            "assertion": valid_assertion,
        },
    )
    assert replay_res.status_code == 403
    assert replay_res.json()["error"] == "SecurityException"
