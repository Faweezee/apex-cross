"""FastAPI routes for inspecting and cryptographically verifying the append-only audit ledger."""
from typing import List
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.security.audit_logger import (
    AuditChainVerification,
    AuditLogger,
    ChainedAuditRecord,
)

router = APIRouter(prefix="/api/audit", tags=["Cryptographic Audit Ledger"])
audit_logger = AuditLogger()


class AuditLogsResponse(BaseModel):
    """Typed response containing SHA-256 hash-chained audit records and chain integrity status."""

    records: List[ChainedAuditRecord]
    verification: AuditChainVerification


@router.get("/logs", response_model=AuditLogsResponse)
async def list_audit_logs(limit: int = Query(default=100, ge=1, le=1000)) -> AuditLogsResponse:
    """Return ordered cryptographic audit records and live chain verification status."""
    records = audit_logger.get_logs(limit=limit)
    verification = audit_logger.verify_chain()
    return AuditLogsResponse(records=records, verification=verification)


@router.get("/verify", response_model=AuditChainVerification)
async def verify_audit_chain() -> AuditChainVerification:
    """Recompute and verify every SHA-256 link across the SQLite append-only ledger."""
    return audit_logger.verify_chain()
