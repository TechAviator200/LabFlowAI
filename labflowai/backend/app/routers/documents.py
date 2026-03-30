"""
POST /documents/upload   — upload a file, extract text, optionally link to workflow
GET  /documents/{id}     — fetch document record
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, UploadFile, File, Form

from app.database import get_db
from app.config import settings
from app.schemas import UploadedDocumentOut
from app.services.document_ingestion import ingest_document
from app.services import audit_logger as al

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=UploadedDocumentOut, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    workflow_id: str | None = Form(default=None),
    db=Depends(get_db),
):
    doc = await ingest_document(file, db, settings.supabase_storage_bucket, workflow_id)
    db.table("uploaded_documents").insert(doc).execute()

    al.log_event(
        db,
        al.EV_DOCUMENT_UPLOADED,
        {"filename": doc["filename"], "file_type": doc["file_type"]},
        workflow_id=workflow_id,
    )
    return UploadedDocumentOut(**doc)


@router.get("/{doc_id}", response_model=UploadedDocumentOut)
def get_document(doc_id: str, db=Depends(get_db)):
    from fastapi import HTTPException
    row = db.table("uploaded_documents").select("*").eq("id", doc_id).single().execute().data
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
    return UploadedDocumentOut(**row)
