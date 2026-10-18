# 05: Multimodal Tuition Invoice Ingestion & OCR

**What to build:** An end-to-end invoice dropzone where a student uploads a tuition bill (PDF or image). The system extracts the university name, beneficiary SWIFT code, amount due, currency, and student ID, returning an editable preview card with confidence scoring.

**Blocked by:** 02: Universal Pydantic Schemas & TypeScript Contracts.

**Status:** completed (Backend Track)

- [ ] Frontend drag-and-drop file upload component supporting PDF and image files.
- [x] Backend route `POST /api/invoice/upload` parses uploaded documents and extracts structured `UniversityInvoice` fields.
- [ ] UI displays an invoice verification summary card allowing the student to inspect or adjust parsed values.
