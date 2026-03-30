"""
document_ingestion.py
Accepts uploaded files (PDF, TXT, CSV), extracts raw text, validates type,
and stores both the original file and extracted text in Supabase Storage.
"""
from __future__ import annotations
import io
import uuid
import mimetypes
from pathlib import Path

from fastapi import UploadFile, HTTPException

try:
    import PyPDF2
    _PDF_AVAILABLE = True
except ImportError:
    _PDF_AVAILABLE = False

ALLOWED_EXTENSIONS = {".txt", ".pdf", ".csv", ".md"}
MAX_FILE_SIZE_MB = 20


async def ingest_document(
    file: UploadFile,
    db,  # supabase client
    bucket: str,
    workflow_id: str | None = None,
) -> dict:
    """
    Validate, read, extract text, upload to storage, and return a document record dict.
    Does NOT commit to the database — caller owns that transaction.
    """
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{suffix}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )

    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds {MAX_FILE_SIZE_MB} MB limit.",
        )

    extracted_text = _extract_text(raw_bytes, suffix, file.filename)

    storage_path = f"{workflow_id or 'unlinked'}/{uuid.uuid4()}{suffix}"
    db.storage.from_(bucket).upload(
        path=storage_path,
        file=raw_bytes,
        file_options={"content-type": _content_type(suffix)},
    )

    return {
        "id": str(uuid.uuid4()),
        "workflow_id": workflow_id,
        "filename": file.filename,
        "file_type": suffix.lstrip("."),
        "storage_path": storage_path,
        "extracted_text": extracted_text,
    }


def _extract_text(raw: bytes, suffix: str, filename: str | None) -> str:
    if suffix == ".pdf":
        return _extract_pdf(raw)
    elif suffix == ".csv":
        # Return raw CSV text; structured parsing done in output_mapper
        return raw.decode("utf-8", errors="replace")
    else:
        return raw.decode("utf-8", errors="replace")


def _extract_pdf(raw: bytes) -> str:
    if not _PDF_AVAILABLE:
        raise HTTPException(
            status_code=500,
            detail="PDF parsing library not installed. Run: pip install PyPDF2",
        )
    reader = PyPDF2.PdfReader(io.BytesIO(raw))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n\n".join(pages).strip()


def _content_type(suffix: str) -> str:
    return mimetypes.types_map.get(suffix, "application/octet-stream")
