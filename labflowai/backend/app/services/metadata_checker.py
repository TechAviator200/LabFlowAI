"""
metadata_checker.py
Rule-based pass over a structured workflow to surface specific
missing metadata issues that the LLM may not catch or may phrase inconsistently.
This is intentionally deterministic and does not call the LLM.
"""
from __future__ import annotations
import re


TEMP_KEYWORDS = re.compile(r"\b(incubat|heat|cool|freeze|thaw|centrifug)\b", re.IGNORECASE)
TIME_KEYWORDS = re.compile(r"\b(incubat|wait|hold|rest|react|mix|vortex)\b", re.IGNORECASE)
CONC_KEYWORDS = re.compile(r"\b(add|dilut|prepare|resuspend|dissolve)\b", re.IGNORECASE)


def check_metadata(structured: dict) -> list[str]:
    """
    Inspect structured workflow dict and return a list of plain-English
    ambiguity/warning strings. Returns [] if nothing is flagged.
    """
    issues: list[str] = []

    steps: list[dict] = structured.get("steps", [])
    materials: list[dict] = structured.get("materials", [])
    parameters: list[dict] = structured.get("parameters", [])

    for step in steps:
        label = "Step {}: '{}'".format(step.get("step_number", "?"), step.get("title", ""))
        desc = step.get("description", "")

        if TEMP_KEYWORDS.search(desc) and step.get("temperature_celsius") is None:
            issues.append(f"{label}: temperature not specified.")

        if TIME_KEYWORDS.search(desc) and step.get("duration_minutes") is None:
            issues.append(f"{label}: duration/incubation time not specified.")

        if CONC_KEYWORDS.search(desc) and _missing_concentration(desc):
            issues.append(f"{label}: reagent concentration appears unspecified.")

    for mat in materials:
        mat_name = mat.get("name", "?")
        if mat.get("quantity") is None:
            issues.append(f"Material '{mat_name}': quantity not specified.")
        if mat.get("unit") is None and mat.get("quantity") is not None:
            issues.append(f"Material '{mat_name}': unit missing for quantity '{mat['quantity']}'.")

    for param in parameters:
        param_name = param.get("name", "?")
        if param.get("value") is None and param.get("expected_range") is None:
            issues.append(f"Parameter '{param_name}': no value or range specified.")
        if param.get("unit") is None and param.get("value") is not None:
            issues.append(f"Parameter '{param_name}': value present but unit missing.")

    return issues


def _missing_concentration(text: str) -> bool:
    """Heuristic: if no concentration-like pattern (e.g. 1 mM, 10 µg/mL) is found."""
    conc_pattern = re.compile(
        r"\d+(\.\d+)?\s*(mM|µM|uM|nM|mg/mL|µg/mL|ug/mL|ng/mL|%|x|X|mol/L|g/L)",
        re.IGNORECASE,
    )
    return not conc_pattern.search(text)
