"""
GET /audit?workflow_id=&run_id=  — fetch audit events with optional filters
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query

from app.database import get_db
from app.schemas import AuditEventOut

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=list[AuditEventOut])
def list_audit_events(
    workflow_id: str | None = Query(default=None),
    run_id: str | None = Query(default=None),
    limit: int = Query(default=100, le=500),
    db=Depends(get_db),
):
    q = db.table("audit_events").select("*").order("created_at", desc=True).limit(limit)
    if workflow_id:
        q = q.eq("workflow_id", workflow_id)
    if run_id:
        q = q.eq("run_id", run_id)
    return [AuditEventOut(**row) for row in q.execute().data]
