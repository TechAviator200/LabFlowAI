"""
Pydantic schemas for API request/response contracts.
These mirror the database models but are safe to expose over HTTP.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, field_validator


# ── Shared ────────────────────────────────────────────────────────────────────

class OKResponse(BaseModel):
    ok: bool = True
    message: str = ""


# ── Workflow ──────────────────────────────────────────────────────────────────

class WorkflowStepOut(BaseModel):
    id: str
    step_number: int
    title: str
    description: str
    duration_minutes: Optional[int] = None
    temperature_celsius: Optional[float] = None
    notes: Optional[str] = None


class MaterialOut(BaseModel):
    id: str
    name: str
    quantity: Optional[str] = None
    unit: Optional[str] = None
    catalog_number: Optional[str] = None
    notes: Optional[str] = None


class ParameterOut(BaseModel):
    id: str
    name: str
    value: Optional[str] = None
    unit: Optional[str] = None
    expected_range: Optional[str] = None


class OutputSchemaOut(BaseModel):
    id: str
    field_name: str
    field_type: str
    required: bool
    description: Optional[str] = None


class WorkflowOut(BaseModel):
    id: str
    title: str
    objective: Optional[str] = None
    status: str
    source_text: Optional[str] = None
    ambiguities: List[str] = []
    confidence: Optional[float] = None  # AI parse confidence 0–1
    version: int = 1
    created_at: datetime
    updated_at: datetime
    steps: List[WorkflowStepOut] = []
    materials: List[MaterialOut] = []
    parameters: List[ParameterOut] = []
    output_schema: List[OutputSchemaOut] = []

    @field_validator("ambiguities", mode="before")
    @classmethod
    def _parse_ambiguities(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            import json as _json
            try:
                return _json.loads(v)
            except Exception:
                return []
        return v or []


class WorkflowListItem(BaseModel):
    id: str
    title: str
    objective: Optional[str] = None
    status: str
    created_at: datetime
    step_count: int = 0
    run_count: int = 0


class WorkflowCreateRequest(BaseModel):
    text: str
    title: Optional[str] = None


# ── Documents ─────────────────────────────────────────────────────────────────

class UploadedDocumentOut(BaseModel):
    id: str
    workflow_id: Optional[str] = None
    filename: str
    file_type: str
    storage_path: str
    extracted_text: Optional[str] = None
    created_at: datetime


# ── Experiment Runs ───────────────────────────────────────────────────────────

class RunOutputOut(BaseModel):
    id: str
    field_name: str
    raw_value: Optional[str] = None
    normalized_value: Optional[str] = None
    unit: Optional[str] = None
    flagged: bool = False
    flag_reason: Optional[str] = None


class ExperimentRunOut(BaseModel):
    id: str
    workflow_id: str
    status: str
    operator_notes: Optional[str] = None
    run_summary: Optional[Dict[str, Any]] = None
    created_at: datetime
    outputs: List[RunOutputOut] = []

    @field_validator("run_summary", mode="before")
    @classmethod
    def _parse_run_summary(cls, v: Any) -> Any:
        if isinstance(v, str):
            import json as _json
            try:
                return _json.loads(v)
            except Exception:
                return None
        return v


class RunCreateRequest(BaseModel):
    workflow_id: str
    operator_notes: Optional[str] = None


# ── Audit ─────────────────────────────────────────────────────────────────────

class AuditEventOut(BaseModel):
    id: str
    workflow_id: Optional[str] = None
    run_id: Optional[str] = None
    event_type: str
    actor: str
    detail: Dict[str, Any]
    created_at: datetime

    @field_validator("detail", mode="before")
    @classmethod
    def _parse_detail(cls, v: Any) -> Dict:
        if isinstance(v, str):
            import json as _json
            try:
                return _json.loads(v)
            except Exception:
                return {}
        return v or {}


# ── AI Parse Response (internal, also returned via API) ──────────────────────

class ParsedProtocol(BaseModel):
    title: str
    objective: str
    materials: List[Dict[str, Any]]
    steps: List[Dict[str, Any]]
    parameters: List[Dict[str, Any]]
    expected_outputs: List[Dict[str, Any]]
    ambiguities: List[str]
    confidence: float  # 0-1, model self-reported


class MappedOutput(BaseModel):
    field_name: str
    raw_value: Optional[str] = None
    normalized_value: Optional[str] = None
    unit: Optional[str] = None
    flagged: bool = False
    flag_reason: Optional[str] = None


class RunSummary(BaseModel):
    planned: List[str]
    executed: List[str]
    missing: List[str]
    review_required: List[str]
    overall_status: str  # complete | partial | review_required
    narrative: str
