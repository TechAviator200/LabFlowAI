"""
audit_logger.py
Writes immutable audit events to the audit_events table.
All mutations in the system should call log_event().
"""
from __future__ import annotations
import uuid
import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)

# Event type constants
EV_WORKFLOW_CREATED = "workflow.created"
EV_WORKFLOW_UPDATED = "workflow.updated"
EV_DOCUMENT_UPLOADED = "document.uploaded"
EV_PROTOCOL_PARSED = "protocol.parsed"
EV_RUN_CREATED = "run.created"
EV_OUTPUTS_MAPPED = "outputs.mapped"
EV_SUMMARY_GENERATED = "summary.generated"
EV_DEMO_SEEDED = "demo.seeded"


def log_event(
    db,
    event_type: str,
    detail: dict[str, Any],
    workflow_id: str | None = None,
    run_id: str | None = None,
    actor: str = "system",
) -> None:
    """
    Insert an audit event row. Silently logs on failure — audit must not
    block primary business operations.
    """
    row = {
        "id": str(uuid.uuid4()),
        "workflow_id": workflow_id,
        "run_id": run_id,
        "event_type": event_type,
        "actor": actor,
        "detail": detail,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        db.table("audit_events").insert(row).execute()
    except Exception as e:
        logger.warning("Audit log insert failed (non-fatal): %s", e)
