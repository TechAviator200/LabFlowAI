"""
POST /runs                        — start a new experiment run
POST /runs/{id}/upload-output     — upload CSV and map outputs
GET  /runs/{id}                   — fetch run with outputs
POST /runs/{id}/summarize         — generate run summary
"""
from __future__ import annotations
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException

from app.database import get_db
from app.schemas import ExperimentRunOut, RunCreateRequest
from app.services.output_mapper import map_csv_outputs
from app.services.run_summary_generator import generate_run_summary
from app.services import audit_logger as al

router = APIRouter(prefix="/runs", tags=["runs"])


@router.post("", response_model=ExperimentRunOut, status_code=201)
def create_run(req: RunCreateRequest, db=Depends(get_db)):
    now = datetime.now(timezone.utc).isoformat()
    run = {
        "id": str(uuid.uuid4()),
        "workflow_id": req.workflow_id,
        "status": "created",
        "operator_notes": req.operator_notes,
        "run_summary": None,
        "created_at": now,
    }
    db.table("experiment_runs").insert(run).execute()
    al.log_event(db, al.EV_RUN_CREATED, {}, workflow_id=req.workflow_id, run_id=run["id"])
    return ExperimentRunOut(**run, outputs=[])


@router.post("/{run_id}/upload-output", response_model=ExperimentRunOut)
async def upload_run_output(run_id: str, file: UploadFile = File(...), db=Depends(get_db)):
    run = _get_run_row(db, run_id)
    workflow_id = run["workflow_id"]

    raw = await file.read()
    csv_text = raw.decode("utf-8", errors="replace")

    schema = db.table("output_schemas").select("*").eq("workflow_id", workflow_id).execute().data
    output_rows = map_csv_outputs(csv_text, schema, run_id)

    if output_rows:
        db.table("run_outputs").insert(output_rows).execute()

    db.table("experiment_runs").update({"status": "outputs_uploaded"}).eq("id", run_id).execute()
    al.log_event(
        db, al.EV_OUTPUTS_MAPPED,
        {"rows": len(output_rows)},
        workflow_id=workflow_id,
        run_id=run_id,
    )
    return _fetch_run(db, run_id)


@router.post("/{run_id}/summarize", response_model=ExperimentRunOut)
def summarize_run(run_id: str, db=Depends(get_db)):
    run = _get_run_row(db, run_id)
    workflow_id = run["workflow_id"]

    workflow = db.table("workflows").select("*").eq("id", workflow_id).single().execute().data
    steps = db.table("workflow_steps").select("*").eq("workflow_id", workflow_id).order("step_number").execute().data
    outputs = db.table("run_outputs").select("*").eq("run_id", run_id).execute().data

    summary = generate_run_summary(workflow, steps, outputs, run.get("operator_notes"))

    db.table("experiment_runs").update({
        "run_summary": summary.model_dump(),
        "status": summary.overall_status,
    }).eq("id", run_id).execute()

    al.log_event(
        db, al.EV_SUMMARY_GENERATED,
        {"status": summary.overall_status},
        workflow_id=workflow_id,
        run_id=run_id,
    )
    return _fetch_run(db, run_id)


@router.get("/{run_id}", response_model=ExperimentRunOut)
def get_run(run_id: str, db=Depends(get_db)):
    return _fetch_run(db, run_id)


def _get_run_row(db, run_id: str) -> dict:
    row = db.table("experiment_runs").select("*").eq("id", run_id).single().execute().data
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")
    return row


def _fetch_run(db, run_id: str) -> ExperimentRunOut:
    run = _get_run_row(db, run_id)
    outputs = db.table("run_outputs").select("*").eq("run_id", run_id).execute().data
    return ExperimentRunOut(**run, outputs=outputs)
