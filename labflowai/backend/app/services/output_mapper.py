"""
output_mapper.py
Maps columns from an uploaded CSV against the workflow's OutputSchema.
Returns a list of MappedOutput objects, flagging unrecognized or missing fields.
"""
from __future__ import annotations
import csv
import io
import uuid
import re

from app.schemas import MappedOutput


def map_csv_outputs(
    csv_text: str,
    output_schema: list[dict],
    run_id: str,
) -> list[dict]:
    """
    Parse CSV text, attempt column → schema field matching,
    and return run_output row dicts ready for DB insert.
    Uses stdlib csv — no pandas dependency.
    """
    try:
        reader = csv.DictReader(io.StringIO(csv_text))
        all_rows = list(reader)
        columns = list(reader.fieldnames or [])
    except Exception as e:
        return [
            {
                "id": str(uuid.uuid4()),
                "run_id": run_id,
                "field_name": "_parse_error",
                "raw_value": str(e),
                "normalized_value": None,
                "unit": None,
                "flagged": True,
                "flag_reason": f"CSV could not be parsed: {e}",
            }
        ]

    schema_fields = {s["field_name"].lower(): s for s in output_schema}
    csv_columns = {c.lower(): c for c in columns}

    def col_values(real_col: str, limit: int = 50) -> list[str]:
        return [r[real_col] for r in all_rows if r.get(real_col) not in (None, "")][:limit]

    rows = []

    for field_lower, schema_entry in schema_fields.items():
        matched_col = _fuzzy_match(field_lower, csv_columns)
        if matched_col is None:
            if schema_entry.get("required"):
                rows.append({
                    "id": str(uuid.uuid4()),
                    "run_id": run_id,
                    "field_name": schema_entry["field_name"],
                    "raw_value": None,
                    "normalized_value": None,
                    "unit": None,
                    "flagged": True,
                    "flag_reason": "Required field not found in uploaded CSV.",
                })
            continue

        real_col = csv_columns[matched_col]
        raw_str = "; ".join(col_values(real_col, 50))

        normalized, unit, flagged, flag_reason = _normalize_value(
            raw_str, schema_entry.get("field_type", "string")
        )

        rows.append({
            "id": str(uuid.uuid4()),
            "run_id": run_id,
            "field_name": schema_entry["field_name"],
            "raw_value": raw_str,
            "normalized_value": normalized,
            "unit": unit,
            "flagged": flagged,
            "flag_reason": flag_reason,
        })

    # Flag CSV columns that have no matching schema field
    for col_lower, real_col in csv_columns.items():
        if _fuzzy_match(col_lower, schema_fields) is None:
            rows.append({
                "id": str(uuid.uuid4()),
                "run_id": run_id,
                "field_name": real_col,
                "raw_value": "; ".join(col_values(real_col, 10)),
                "normalized_value": None,
                "unit": None,
                "flagged": True,
                "flag_reason": "Column in CSV has no matching output schema field — human review recommended.",
            })

    return rows


def _fuzzy_match(target: str, candidates: dict) -> str | None:
    """Simple token-overlap fuzzy match."""
    if target in candidates:
        return target
    target_tokens = set(re.split(r"[\s_\-]+", target))
    best, best_score = None, 0
    for key in candidates:
        tokens = set(re.split(r"[\s_\-]+", key))
        score = len(target_tokens & tokens) / max(len(target_tokens | tokens), 1)
        if score > 0.5 and score > best_score:
            best, best_score = key, score
    return best


def _normalize_value(
    raw: str, field_type: str
) -> tuple[str | None, str | None, bool, str | None]:
    """
    Attempt lightweight normalization and unit extraction.
    Returns (normalized_value, unit, flagged, flag_reason).
    """
    unit_match = re.search(r"([0-9.]+)\s*([a-zA-Zµ/%°]+)", raw)
    unit = unit_match.group(2) if unit_match else None
    normalized = raw.strip() if raw.strip() else None

    if field_type == "number":
        nums = re.findall(r"-?[0-9]+(?:\.[0-9]+)?", raw)
        if not nums:
            return normalized, unit, True, "Expected numeric value but none found."
        normalized = nums[0]

    return normalized, unit, False, None
