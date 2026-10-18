"""Unit and API tests for multimodal tuition invoice ingestion and extraction."""
import io
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.schemas import CurrencyEnum, UniversityInvoice
from app.tools.invoice_parser import InvoiceParserTool

client = TestClient(app)


@pytest.fixture
def parser() -> InvoiceParserTool:
    return InvoiceParserTool()


SAMPLE_HKUST_INVOICE_TEXT = """
THE HONG KONG UNIVERSITY OF SCIENCE AND TECHNOLOGY (HKUST)
Official Tuition Fee Advice - Fall Semester 2026
Student ID: 20991234
Beneficiary Account: 004-123-456789-001
SWIFT Code: HSBCHKHHHKH
Amount Due: 85,000.00 HKD
Due Date: 2026-11-15
"""

SAMPLE_MELBOURNE_INVOICE_TEXT = """
University of Melbourne
Tuition Statement
Student Number: 11882233
IBAN / Account: AU987654321000
BIC / SWIFT: NATAAU3303M
Total Payable: 18,500 AUD
Payment Deadline: 2026-11-30
"""


def test_parse_hkust_invoice_text_extracts_all_fields(parser: InvoiceParserTool):
    """Verify deterministic extraction of HKUST invoice text into UniversityInvoice."""
    invoice = parser.parse_document(
        raw_bytes=SAMPLE_HKUST_INVOICE_TEXT.encode("utf-8"),
        filename="hkust_tuition_2026.pdf",
    )
    assert isinstance(invoice, UniversityInvoice)
    assert "HKUST" in invoice.institution_name or "Hong Kong University of Science and Technology" in invoice.institution_name
    assert invoice.beneficiary_account == "004-123-456789-001"
    assert invoice.swift_code == "HSBCHKHHHKH"
    assert invoice.amount_due == 85000.0
    assert invoice.currency == CurrencyEnum.HKD
    assert invoice.due_date == "2026-11-15"
    assert invoice.student_id == "20991234"
    assert 0.90 <= invoice.confidence_score <= 1.0


def test_parse_melbourne_invoice_text_extracts_aud_fields(parser: InvoiceParserTool):
    """Verify extraction of University of Melbourne invoice in AUD."""
    invoice = parser.parse_document(
        raw_bytes=SAMPLE_MELBOURNE_INVOICE_TEXT.encode("utf-8"),
        filename="unimelb_invoice.png",
    )
    assert "University of Melbourne" in invoice.institution_name
    assert invoice.swift_code == "NATAAU3303M"
    assert invoice.amount_due == 18500.0
    assert invoice.currency == CurrencyEnum.AUD
    assert invoice.due_date == "2026-11-30"
    assert invoice.student_id == "11882233"
    assert invoice.confidence_score >= 0.90


def test_parse_binary_image_fallback_uses_filename_preset(parser: InvoiceParserTool):
    """Verify binary image/PDF without embedded text falls back cleanly to realistic APEC university invoice."""
    fake_png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    invoice = parser.parse_document(
        raw_bytes=fake_png_bytes,
        filename="nus_tuition_bill.png",
    )
    assert isinstance(invoice, UniversityInvoice)
    assert "National University of Singapore" in invoice.institution_name
    assert invoice.currency == CurrencyEnum.SGD
    assert invoice.amount_due > 0
    assert len(invoice.swift_code) >= 8
    assert 0.80 <= invoice.confidence_score <= 1.0


def test_invoice_upload_endpoint_returns_structured_invoice_and_field_confidences():
    """Verify POST /api/invoice/upload accepts multipart file upload and returns UniversityInvoice + field confidences."""
    file_content = io.BytesIO(SAMPLE_HKUST_INVOICE_TEXT.encode("utf-8"))
    response = client.post(
        "/api/invoice/upload",
        files={"file": ("hkust_tuition.pdf", file_content, "application/pdf")},
    )
    assert response.status_code == 200
    payload = response.json()
    assert "invoice" in payload
    assert "field_confidences" in payload

    inv = payload["invoice"]
    assert inv["swift_code"] == "HSBCHKHHHKH"
    assert inv["amount_due"] == 85000.0
    assert inv["currency"] == "HKD"
    assert inv["student_id"] == "20991234"
    assert inv["confidence_score"] >= 0.90

    field_conf = payload["field_confidences"]
    for key in ("institution_name", "beneficiary_account", "swift_code", "amount_due", "currency", "due_date"):
        assert key in field_conf
        assert 0.0 <= field_conf[key] <= 1.0


def test_invoice_upload_rejects_unsupported_file_extension():
    """Verify POST /api/invoice/upload returns HTTP 400 on unsupported file types."""
    file_content = io.BytesIO(b"malicious executable content")
    response = client.post(
        "/api/invoice/upload",
        files={"file": ("exploit.exe", file_content, "application/octet-stream")},
    )
    assert response.status_code == 400
