"""
Workflow CRUD + parse-and-structure endpoint.
POST /workflows       — create from raw text
GET  /workflows       — list all
GET  /workflows/{id}  — detail with steps, materials, parameters, output schema
"""
from __future__ import annotations
import logging
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.schemas import WorkflowCreateRequest, WorkflowOut, WorkflowListItem
from app.services.protocol_parser import parse_protocol
from app.services.workflow_structurer import structure_workflow
from app.services.metadata_checker import check_metadata
from app.services import audit_logger as al

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.post("", response_model=WorkflowOut, status_code=201)
def create_workflow(req: WorkflowCreateRequest, db=Depends(get_db)):
    parsed = parse_protocol(req.text)

    structured = structure_workflow(parsed, source_text=req.text)
    if req.title:
        structured["workflow"]["title"] = req.title

    extra_issues = check_metadata(structured)
    all_ambiguities = list(dict.fromkeys(parsed.ambiguities + extra_issues))
    structured["workflow"]["ambiguities"] = all_ambiguities
    structured["workflow"]["confidence"] = parsed.confidence

    wf = structured["workflow"]
    db.table("workflows").insert(wf).execute()
    _bulk_insert(db, "workflow_steps", structured["steps"])
    _bulk_insert(db, "materials", structured["materials"])
    _bulk_insert(db, "parameters", structured["parameters"])
    _bulk_insert(db, "output_schemas", structured["output_schema"])

    al.log_event(db, al.EV_WORKFLOW_CREATED, {"title": wf["title"]}, workflow_id=wf["id"])
    al.log_event(
        db,
        al.EV_PROTOCOL_PARSED,
        {"confidence": parsed.confidence, "ambiguities": len(all_ambiguities)},
        workflow_id=wf["id"],
    )

    return _fetch_workflow(db, wf["id"])


@router.get("", response_model=list[WorkflowListItem])
def list_workflows(db=Depends(get_db)):
    rows = db.table("workflows").select("*").order("created_at", desc=True).execute().data
    result = []
    for row in rows:
        step_count = (
            db.table("workflow_steps")
            .select("id", count="exact")
            .eq("workflow_id", row["id"])
            .execute()
            .count
            or 0
        )
        run_count = (
            db.table("experiment_runs")
            .select("id", count="exact")
            .eq("workflow_id", row["id"])
            .execute()
            .count
            or 0
        )
        result.append(WorkflowListItem(**row, step_count=step_count, run_count=run_count))
    return result


@router.get("/{workflow_id}", response_model=WorkflowOut)
def get_workflow(workflow_id: str, db=Depends(get_db)):
    return _fetch_workflow(db, workflow_id)


def _fetch_workflow(db, workflow_id: str) -> WorkflowOut:
    row = db.table("workflows").select("*").eq("id", workflow_id).single().execute().data
    if not row:
        raise HTTPException(status_code=404, detail="Workflow not found")

    steps = db.table("workflow_steps").select("*").eq("workflow_id", workflow_id).order("step_number").execute().data
    materials = db.table("materials").select("*").eq("workflow_id", workflow_id).execute().data
    params = db.table("parameters").select("*").eq("workflow_id", workflow_id).execute().data
    schema = db.table("output_schemas").select("*").eq("workflow_id", workflow_id).execute().data

    return WorkflowOut(
        **row,
        steps=steps,
        materials=materials,
        parameters=params,
        output_schema=schema,
    )


def _bulk_insert(db, table: str, rows: list[dict]) -> None:
    if rows:
        db.table(table).insert(rows).execute()
