"""Sandbox SWIFT MT103 clearing rail generator for ApexCross."""
from datetime import datetime, timezone
import hashlib
import uuid
from pydantic import BaseModel

from app.schemas import CurrencyEnum


class SwiftWireReceipt(BaseModel):
    """Structured SWIFT MT103 wire confirmation receipt and SHA-256 transaction hash."""

    reference_id: str
    uetr: str
    value_date: str
    beneficiary_name: str
    beneficiary_account: str
    swift_code: str
    amount: float
    currency: CurrencyEnum
    student_id: str
    mt103_message: str
    transaction_hash: str
    status: str = "SETTLED"


class SwiftMT103Generator:
    """Generates compliant SWIFT MT103 single customer credit transfer messages and hashes."""

    @staticmethod
    def generate_mt103_receipt(
        beneficiary_name: str = "HKUST",
        beneficiary_account: str = "004-123-456789-001",
        swift_code: str = "HSBCHKHHHKH",
        amount: float = 85000.0,
        currency: CurrencyEnum = CurrencyEnum.HKD,
        student_id: str = "20991234",
        ordering_customer: str = "APEC INTERNATIONAL STUDENT",
    ) -> SwiftWireReceipt:
        now = datetime.now(timezone.utc)
        yymmdd = now.strftime("%y%m%d")
        iso_date = now.strftime("%Y-%m-%d")
        ref_id = f"APX{now.strftime('%H%M%S')}{uuid.uuid4().hex[:6].upper()}"
        uetr = str(uuid.uuid4())
        formatted_amount = f"{amount:.2f}".replace(".", ",")

        mt103_lines = [
            f"{{1:F01APXCCNSZAXXX0000000000}}{{2:I103{swift_code.ljust(12, 'X')}N}}{{3:{{121:{uetr}}}}}{{4:",
            f":20:{ref_id}",
            ":23B:CRED",
            f":32A:{yymmdd}{currency.value}{formatted_amount}",
            f":50K:/CN8800112233\n{ordering_customer}",
            f":57A:{swift_code}",
            f":59:/{beneficiary_account}\n{beneficiary_name}",
            f":70:/RFB/TUITION STUDENT ID {student_id}",
            ":71A:OUR",
            "-}",
        ]
        mt103_message = "\n".join(mt103_lines)
        tx_hash = hashlib.sha256(mt103_message.encode("utf-8")).hexdigest()

        return SwiftWireReceipt(
            reference_id=ref_id,
            uetr=uetr,
            value_date=iso_date,
            beneficiary_name=beneficiary_name,
            beneficiary_account=beneficiary_account,
            swift_code=swift_code,
            amount=amount,
            currency=currency,
            student_id=student_id,
            mt103_message=mt103_message,
            transaction_hash=tx_hash,
            status="SETTLED",
        )
