"""
run_summary_generator.py
Generates a structured run summary comparing planned workflow vs actual outputs.
Uses a brief LLM narrative pass on top of deterministic comparison logic.
"""
from __future__ import annotations
import logging
from openai import OpenAI
from app.config import settings
from app.schemas import RunSummary

logger = logging.getLogger(__name__)


def generate_run_summary(
    workflow: dict,
    steps: list[dict],
    run_outputs: list[dict],
    operator_notes: str | None = None,
) -> RunSummary:
    """Compare planned steps/outputs against actuals and produce a RunSummary."""

    planned = [f"Step {s['step_number']}: {s['title']}" for s in steps]

    executed = [
        f"{o['field_name']}: {o['normalized_value'] or o['raw_value']}"
        for o in run_outputs
        if not o.get("flagged")
    ]

    missing = [
        f"{o['field_name']} — {o['flag_reason']}"
        for o in run_outputs
        if o.get("flagged") and "Required" in (o.get("flag_reason") or "")
    ]

    review_required = [
        f"{o['field_name']} — {o['flag_reason']}"
        for o in run_outputs
        if o.get("flagged") and "Required" not in (o.get("flag_reason") or "")
    ]

    if missing:
        overall_status = "partial"
    elif review_required:
        overall_status = "review_required"
    else:
        overall_status = "complete"

    narrative = _generate_narrative(
        workflow_title=workflow.get("title", "Unknown"),
        planned=planned,
        executed=executed,
        missing=missing,
        review_required=review_required,
        operator_notes=operator_notes,
        ambiguities=workflow.get("ambiguities", []),
    )

    return RunSummary(
        planned=planned,
        executed=executed,
        missing=missing,
        review_required=review_required,
        overall_status=overall_status,
        narrative=narrative,
    )


def _generate_narrative(
    workflow_title: str,
    planned: list[str],
    executed: list[str],
    missing: list[str],
    review_required: list[str],
    operator_notes: str | None,
    ambiguities: list[str],
) -> str:
    if not settings.llm_api_key:
        return _fallback_narrative(workflow_title, planned, executed, missing, review_required)

    prompt = f"""
Workflow: {workflow_title}

Planned steps: {len(planned)}
Executed outputs captured: {len(executed)}
Missing required outputs: {len(missing)}
Items requiring human review: {len(review_required)}

Missing fields: {"; ".join(missing) or "None"}
Review items: {"; ".join(review_required) or "None"}
Original protocol ambiguities: {"; ".join(ambiguities) or "None"}
Operator notes: {operator_notes or "None"}

Write a 3-5 sentence plain-English run summary for a scientist or lab ops person.
State what was planned, what was captured, flag anything missing or needing review.
Be factual. Do not fabricate conclusions. Flag uncertainty explicitly.
"""
    try:
        client = OpenAI(api_key=settings.llm_api_key, base_url=settings.llm_base_url)
        resp = client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {"role": "system", "content": "You are a concise scientific lab assistant."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=512,
        )
        return resp.choices[0].message.content or _fallback_narrative(
            workflow_title, planned, executed, missing, review_required
        )
    except Exception as e:
        logger.warning("LLM narrative generation failed: %s", e)
        return _fallback_narrative(workflow_title, planned, executed, missing, review_required)


def _fallback_narrative(
    title: str,
    planned: list[str],
    executed: list[str],
    missing: list[str],
    review_required: list[str],
) -> str:
    parts = [f"Run summary for workflow: {title}."]
    parts.append(f"{len(planned)} steps were planned; {len(executed)} output fields were captured.")
    if missing:
        parts.append(f"{len(missing)} required field(s) were not found in the uploaded data.")
    if review_required:
        parts.append(f"{len(review_required)} item(s) require human review.")
    if not missing and not review_required:
        parts.append("All expected outputs were captured. No issues flagged.")
    parts.append("This summary was generated automatically — please verify before use.")
    return " ".join(parts)
