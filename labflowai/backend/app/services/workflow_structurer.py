"""
workflow_structurer.py
Converts a ParsedProtocol into normalized database row dicts for
Workflow, WorkflowStep, Material, Parameter, and OutputSchema tables.
"""
from __future__ import annotations
import uuid
from datetime import datetime, timezone

from app.schemas import ParsedProtocol


def structure_workflow(parsed: ParsedProtocol, source_text: str) -> dict:
    """
    Return a dict with keys: workflow, steps, materials, parameters, output_schema.
    All IDs are pre-generated UUIDs suitable for batch insert.
    """
    now = datetime.now(timezone.utc).isoformat()
    workflow_id = str(uuid.uuid4())

    workflow = {
        "id": workflow_id,
        "title": parsed.title,
        "objective": parsed.objective,
        "status": "draft",
        "source_text": source_text,
        "ambiguities": parsed.ambiguities,
        "confidence": parsed.confidence,
        "version": 1,
        "created_at": now,
        "updated_at": now,
    }

    steps = [
        {
            "id": str(uuid.uuid4()),
            "workflow_id": workflow_id,
            "step_number": s.get("step_number", i + 1),
            "title": s.get("title", f"Step {i + 1}"),
            "description": s.get("description", ""),
            "duration_minutes": s.get("duration_minutes"),
            "temperature_celsius": s.get("temperature_celsius"),
            "notes": s.get("notes"),
        }
        for i, s in enumerate(parsed.steps)
    ]

    materials = [
        {
            "id": str(uuid.uuid4()),
            "workflow_id": workflow_id,
            "name": m.get("name", ""),
            "quantity": m.get("quantity"),
            "unit": m.get("unit"),
            "catalog_number": m.get("catalog_number"),
            "notes": m.get("notes"),
        }
        for m in parsed.materials
    ]

    parameters = [
        {
            "id": str(uuid.uuid4()),
            "workflow_id": workflow_id,
            "name": p.get("name", ""),
            "value": p.get("value"),
            "unit": p.get("unit"),
            "expected_range": p.get("expected_range"),
        }
        for p in parsed.parameters
    ]

    output_schema = [
        {
            "id": str(uuid.uuid4()),
            "workflow_id": workflow_id,
            "field_name": o.get("field_name", ""),
            "field_type": o.get("field_type", "string"),
            "required": o.get("required", False),
            "description": o.get("description"),
        }
        for o in parsed.expected_outputs
    ]

    return {
        "workflow": workflow,
        "steps": steps,
        "materials": materials,
        "parameters": parameters,
        "output_schema": output_schema,
    }
