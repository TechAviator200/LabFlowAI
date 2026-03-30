"""
protocol_parser.py
Uses an OpenAI-compatible LLM to parse free-text protocol/SOP into
a structured ParsedProtocol object.
"""
from __future__ import annotations
import json
import logging
from openai import OpenAI
from app.config import settings
from app.schemas import ParsedProtocol

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """
You are a scientific protocol analyst. Extract structured information from the
provided laboratory protocol or SOP text.

Return ONLY valid JSON matching this schema — no markdown fences, no extra keys:
{
  "title": "string",
  "objective": "string",
  "materials": [
    {"name": "string", "quantity": "string|null", "unit": "string|null",
     "catalog_number": "string|null", "notes": "string|null"}
  ],
  "steps": [
    {"step_number": 1, "title": "string", "description": "string",
     "duration_minutes": number|null, "temperature_celsius": number|null,
     "notes": "string|null"}
  ],
  "parameters": [
    {"name": "string", "value": "string|null", "unit": "string|null",
     "expected_range": "string|null"}
  ],
  "expected_outputs": [
    {"field_name": "string", "field_type": "string",
     "required": true|false, "description": "string|null"}
  ],
  "ambiguities": ["list of short plain-English descriptions of missing or unclear info"],
  "confidence": 0.0
}

Rules:
- ambiguities: flag missing units, temperatures, incubation times, undefined reagent
  concentrations, or steps that could be interpreted multiple ways.
- confidence: your self-assessed parse quality between 0 and 1.
- Do not fabricate values. Use null if a value is absent.
- Keep descriptions concise and scientifically accurate.
"""


def parse_protocol(text: str) -> ParsedProtocol:
    """Call LLM and return a validated ParsedProtocol.

    Falls back to a rule-based heuristic parser when LLM_API_KEY is not set,
    so the app can run fully offline for demo purposes.
    """
    if not settings.llm_api_key:
        logger.warning(
            "LLM_API_KEY not set — using heuristic parser. "
            "Set LLM_API_KEY in backend/.env for AI-powered extraction."
        )
        return _heuristic_parse(text)

    client = _llm_client()

    response = client.chat.completions.create(
        model=settings.llm_model,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": f"Parse this protocol:\n\n{text}"},
        ],
        temperature=0.1,
        max_tokens=4096,
    )

    raw = response.choices[0].message.content or ""

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        logger.error("LLM returned invalid JSON: %s\nRaw: %s", e, raw[:500])
        # Return a minimal degraded result rather than crashing
        return ParsedProtocol(
            title="Parse failed",
            objective="The AI could not parse this document. Please review manually.",
            materials=[],
            steps=[],
            parameters=[],
            expected_outputs=[],
            ambiguities=["AI parse error — raw response could not be decoded as JSON."],
            confidence=0.0,
        )

    return ParsedProtocol(**data)


def _heuristic_parse(text: str) -> ParsedProtocol:
    """
    Rule-based fallback parser — works without an LLM.
    Extracts numbered steps, detects common reagent/material patterns,
    and flags obvious ambiguities.  Confidence is capped at 0.55 to
    signal this is not AI-quality output.
    """
    import re

    lines = [l.strip() for l in text.splitlines() if l.strip()]

    # Best-effort title: first non-empty line
    title = lines[0][:120] if lines else "Untitled Protocol"

    # Objective: second line if it looks like a sentence
    objective = ""
    if len(lines) > 1 and len(lines[1]) > 20:
        objective = lines[1][:300]

    # Numbered steps: "1.", "Step 1", "1)", etc.
    step_pattern = re.compile(
        r"^(?:step\s*)?(\d+)[.):\s]\s*(.+)", re.IGNORECASE
    )
    steps: list[dict] = []
    for line in lines:
        m = step_pattern.match(line)
        if m:
            num = int(m.group(1))
            desc = m.group(2).strip()
            # Extract duration from "X min" / "X hours"
            dur = None
            dm = re.search(r"(\d+)\s*(?:min|minutes?)", desc, re.IGNORECASE)
            if dm:
                dur = int(dm.group(1))
            hm = re.search(r"(\d+)\s*(?:h|hours?)", desc, re.IGNORECASE)
            if hm:
                dur = int(hm.group(1)) * 60
            # Extract temperature
            temp = None
            tm = re.search(r"(\d+)\s*°?C", desc)
            if tm:
                temp = float(tm.group(1))
            steps.append({
                "step_number": num,
                "title": desc[:60],
                "description": desc,
                "duration_minutes": dur,
                "temperature_celsius": temp,
                "notes": None,
            })

    # Materials: lines with quantities like "100 µL", "10 mM", "1 mg"
    mat_pattern = re.compile(r"(\d[\d.]*)\s*(µL|mL|L|mg|g|kg|mM|µM|nM|µg|ng|%|units?|plates?)\b", re.IGNORECASE)
    materials: list[dict] = []
    seen_mats: set[str] = set()
    for line in lines:
        if mat_pattern.search(line):
            name = re.sub(r"\d[\d.]*\s*\S+", "", line).strip().rstrip(".,;:").strip()[:80]
            if name and name not in seen_mats:
                seen_mats.add(name)
                m2 = mat_pattern.search(line)
                materials.append({
                    "name": name or line[:60],
                    "quantity": m2.group(1) if m2 else None,
                    "unit": m2.group(2) if m2 else None,
                    "catalog_number": None,
                    "notes": None,
                })

    # Parameters: lines with "=" or ":" that look like key:value pairs
    params: list[dict] = []

    # Ambiguities: flag common issues
    ambiguities: list[str] = []
    text_lower = text.lower()
    if not re.search(r"\d+\s*°?C", text):
        ambiguities.append("No temperature values detected — verify incubation conditions.")
    if not re.search(r"\d+\s*(?:min|minutes?|h|hours?)", text, re.IGNORECASE):
        ambiguities.append("No duration values detected — incubation/reaction times may be missing.")
    if re.search(r"\bconcentration\b", text_lower) and not re.search(r"\d+\s*(mM|µM|nM|mg/mL|µg/mL)", text):
        ambiguities.append("Concentrations referenced but units not clearly specified.")
    if not steps:
        ambiguities.append("No numbered steps detected — manual structure review required.")

    # Default outputs
    expected_outputs: list[dict] = [
        {"field_name": "result", "field_type": "string", "required": True, "description": "Primary assay result"},
        {"field_name": "sample_id", "field_type": "string", "required": True, "description": "Sample identifier"},
        {"field_name": "notes", "field_type": "string", "required": False, "description": "Operator notes"},
    ]

    confidence = 0.45 if not steps else 0.55

    logger.info("Heuristic parser: %d steps, %d materials, %d ambiguities", len(steps), len(materials), len(ambiguities))

    return ParsedProtocol(
        title=title,
        objective=objective or "See source text.",
        materials=materials[:20],
        steps=steps[:30],
        parameters=params,
        expected_outputs=expected_outputs,
        ambiguities=ambiguities,
        confidence=confidence,
    )


def _llm_client() -> OpenAI:
    return OpenAI(
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url,
    )
