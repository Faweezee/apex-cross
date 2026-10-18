"""FastAPI routes for Tier 3 FIDO2 WebAuthn step-up challenges and SWIFT MT103 wire execution."""
from typing import Any, Dict, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.schemas import CurrencyEnum, SecurityTier
from app.security.webauthn_service import WebAuthnSecurityService
from app.tools.swift_mock import SwiftMT103Generator, SwiftWireReceipt

router = APIRouter(prefix="/api/auth", tags=["WebAuthn Biometric Security"])
webauthn_service = WebAuthnSecurityService()
swift_generator = SwiftMT103Generator()


class WebAuthnVerifyRequest(BaseModel):
    """Request payload for verifying a FIDO2 WebAuthn biometric assertion and executing a Tier 3 wire."""

    userId: str = Field(default="student-001")
    assertion: Dict[str, Any]
    plan_id: str = Field(default="plan-default")
    beneficiary_name: str = Field(default="HKUST")
    beneficiary_account: str = Field(default="004-123-456789-001")
    swift_code: str = Field(default="HSBCHKHHHKH")
    amount: float = Field(default=85000.0, gt=0.0)
    currency: CurrencyEnum = Field(default=CurrencyEnum.HKD)
    student_id: str = Field(default="20991234")


class WebAuthnVerifyResponse(BaseModel):
    """Structured response returned after successful FIDO2 passkey verification and SWIFT clearing."""

    verified: bool
    security_tier: SecurityTier = SecurityTier.TIER_3_BIOMETRIC
    user_id: str
    plan_id: str
    receipt: SwiftWireReceipt


@router.post("/reauth/options")
async def generate_reauth_options(
    userId: str = Query(default="student-001"),
) -> Dict[str, Any]:
    """Generate FIDO2 WebAuthn step-up challenge options constrained to pre-registered user credentials."""
    return webauthn_service.generate_reauth_options(user_id=userId)


@router.post("/reauth/verify", response_model=WebAuthnVerifyResponse)
async def verify_reauth_and_execute_wire(
    payload: WebAuthnVerifyRequest,
) -> WebAuthnVerifyResponse:
    """
    Verify the FIDO2 WebAuthn biometric assertion signature via py_webauthn (failing closed with
    HTTP 403 SecurityException on invalid signature or expired challenge), then execute the
    sandbox SWIFT MT103 wire and return the verifiable receipt.
    """
    webauthn_service.verify_assertion_payload(
        user_id=payload.userId,
        assertion=payload.assertion,
    )
    receipt = swift_generator.generate_mt103_receipt(
        beneficiary_name=payload.beneficiary_name,
        beneficiary_account=payload.beneficiary_account,
        swift_code=payload.swift_code,
        amount=payload.amount,
        currency=payload.currency,
        student_id=payload.student_id,
    )
    from app.routes.audit_routes import audit_logger

    audit_logger.log_event(
        user_id=payload.userId,
        action_type="TIER3_WIRE_SETTLED",
        security_tier=SecurityTier.TIER_3_BIOMETRIC,
        plan_id=payload.plan_id,
        payload={
            "reference_id": receipt.reference_id,
            "transaction_hash": receipt.transaction_hash,
            "amount": receipt.amount,
            "currency": receipt.currency.value,
        },
        signature_verified=True,
        status="SETTLED",
    )
    return WebAuthnVerifyResponse(
        verified=True,
        security_tier=SecurityTier.TIER_3_BIOMETRIC,
        user_id=payload.userId,
        plan_id=payload.plan_id,
        receipt=receipt,
    )
