"""Append-only SQLite cryptographic audit ledger with SHA-256 hash chaining."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sqlite3
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel

from app.config import settings
from app.schemas import AuditRecord, SecurityTier

GENESIS_HASH = "0" * 64


class ChainedAuditRecord(AuditRecord):
    """AuditRecord extended with its self-verifying SHA-256 record_hash."""

    record_hash: str


class AuditChainVerification(BaseModel):
    """Result of verifying the entire append-only SHA-256 hash chain."""

    is_valid: bool
    total_records: int
    latest_hash: str
    tampered_record_id: Optional[str] = None
    reason: str


def _compute_record_hash(
    record_id: str,
    timestamp: str,
    user_id: str,
    action_type: str,
    security_tier: str,
    plan_id: str,
    payload_hash: str,
    previous_hash: str,
    signature_verified: bool,
    status: str,
) -> str:
    canonical = (
        f"{record_id}|{timestamp}|{user_id}|{action_type}|{security_tier}|"
        f"{plan_id}|{payload_hash}|{previous_hash}|{int(signature_verified)}|{status}"
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


class AuditLogger:
    """Tamper-evident SQLite WAL-mode ledger with cryptographic SHA-256 hash chaining."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or str(Path(__file__).resolve().parent.parent.parent / settings.sqlite_db_path)
        self._init_db()

    def _init_db(self) -> None:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS audit_logs (
                    seq INTEGER PRIMARY KEY AUTOINCREMENT,
                    record_id TEXT UNIQUE NOT NULL,
                    timestamp TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    action_type TEXT NOT NULL,
                    security_tier TEXT NOT NULL,
                    plan_id TEXT NOT NULL,
                    payload_hash TEXT NOT NULL,
                    previous_hash TEXT NOT NULL,
                    record_hash TEXT NOT NULL,
                    signature_verified INTEGER NOT NULL,
                    status TEXT NOT NULL
                )
                """
            )
            conn.commit()

    def log_event(
        self,
        user_id: str,
        action_type: str,
        security_tier: SecurityTier,
        plan_id: str,
        payload: Optional[Dict[str, Any]] = None,
        signature_verified: bool = True,
        status: str = "COMPLETED",
    ) -> ChainedAuditRecord:
        """Append a new cryptographically chained record to the SQLite ledger."""
        record_id = f"aud-{uuid.uuid4().hex[:10]}"
        timestamp = datetime.now(timezone.utc).isoformat()
        payload_bytes = json.dumps(payload or {}, sort_keys=True, default=str).encode("utf-8")
        payload_hash = hashlib.sha256(payload_bytes).hexdigest()

        with sqlite3.connect(self.db_path) as conn:
            row = conn.execute(
                "SELECT record_hash FROM audit_logs ORDER BY seq DESC LIMIT 1"
            ).fetchone()
            previous_hash = row[0] if row else GENESIS_HASH

            record_hash = _compute_record_hash(
                record_id=record_id,
                timestamp=timestamp,
                user_id=user_id,
                action_type=action_type,
                security_tier=security_tier.value,
                plan_id=plan_id,
                payload_hash=payload_hash,
                previous_hash=previous_hash,
                signature_verified=signature_verified,
                status=status,
            )

            conn.execute(
                """
                INSERT INTO audit_logs (
                    record_id, timestamp, user_id, action_type, security_tier,
                    plan_id, payload_hash, previous_hash, record_hash,
                    signature_verified, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record_id,
                    timestamp,
                    user_id,
                    action_type,
                    security_tier.value,
                    plan_id,
                    payload_hash,
                    previous_hash,
                    record_hash,
                    int(signature_verified),
                    status,
                ),
            )
            conn.commit()

        return ChainedAuditRecord(
            record_id=record_id,
            timestamp=timestamp,
            user_id=user_id,
            action_type=action_type,
            security_tier=security_tier,
            plan_id=plan_id,
            payload_hash=payload_hash,
            previous_hash=previous_hash,
            record_hash=record_hash,
            signature_verified=signature_verified,
            status=status,
        )

    def get_logs(self, limit: int = 100) -> List[ChainedAuditRecord]:
        """Return ordered audit records from SQLite."""
        with sqlite3.connect(self.db_path) as conn:
            rows = conn.execute(
                """
                SELECT record_id, timestamp, user_id, action_type, security_tier,
                       plan_id, payload_hash, previous_hash, record_hash,
                       signature_verified, status
                FROM audit_logs
                ORDER BY seq ASC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

        return [
            ChainedAuditRecord(
                record_id=r[0],
                timestamp=r[1],
                user_id=r[2],
                action_type=r[3],
                security_tier=SecurityTier(r[4]),
                plan_id=r[5],
                payload_hash=r[6],
                previous_hash=r[7],
                record_hash=r[8],
                signature_verified=bool(r[9]),
                status=r[10],
            )
            for r in rows
        ]

    def verify_chain(self) -> AuditChainVerification:
        """Recompute all SHA-256 record hashes and verify sequential previous_hash linkage."""
        records = self.get_logs(limit=10000)
        expected_prev = GENESIS_HASH

        for rec in records:
            if rec.previous_hash != expected_prev:
                return AuditChainVerification(
                    is_valid=False,
                    total_records=len(records),
                    latest_hash=rec.record_hash,
                    tampered_record_id=rec.record_id,
                    reason=f"Broken previous_hash link detected at record {rec.record_id}.",
                )

            recomputed = _compute_record_hash(
                record_id=rec.record_id,
                timestamp=rec.timestamp,
                user_id=rec.user_id,
                action_type=rec.action_type,
                security_tier=rec.security_tier.value,
                plan_id=rec.plan_id,
                payload_hash=rec.payload_hash,
                previous_hash=rec.previous_hash,
                signature_verified=rec.signature_verified,
                status=rec.status,
            )
            if recomputed != rec.record_hash:
                return AuditChainVerification(
                    is_valid=False,
                    total_records=len(records),
                    latest_hash=rec.record_hash,
                    tampered_record_id=rec.record_id,
                    reason=f"Cryptographic SHA-256 hash mismatch detected at record {rec.record_id}.",
                )

            expected_prev = rec.record_hash

        return AuditChainVerification(
            is_valid=True,
            total_records=len(records),
            latest_hash=expected_prev,
            tampered_record_id=None,
            reason="All SHA-256 hash links verified intact.",
        )
