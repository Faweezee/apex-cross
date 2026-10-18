"""FastAPI route for multimodal university tuition invoice ingestion and OCR extraction."""
from pathlib import Path
from typing import Dict
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.schemas import UniversityInvoice
from app.tools.invoice_parser import InvoiceParserTool

router = APIRouter(prefix="/api/invoice", tags=["Invoice Ingestion"])
invoice_parser = InvoiceParserTool()

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".txt"}


class InvoiceUploadResponse(BaseModel):
    """Structured response containing extracted UniversityInvoice and per-field confidence scores."""

    filename: str
    invoice: UniversityInvoice
    field_confidences: Dict[str, float]


@router.post("/upload", response_model=InvoiceUploadResponse)
async def upload_invoice(file: UploadFile = File(...)) -> InvoiceUploadResponse:
    """Ingest an uploaded tuition invoice (PDF/image) and extract UniversityInvoice fields."""
    filename = file.filename or "invoice.pdf"
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension '{ext}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )

    raw_bytes = await file.read()
    invoice, field_confidences = invoice_parser.parse_document_with_confidences(
        raw_bytes=raw_bytes,
        filename=filename,
    )
    return InvoiceUploadResponse(
        filename=filename,
        invoice=invoice,
        field_confidences=field_confidences,
    )
