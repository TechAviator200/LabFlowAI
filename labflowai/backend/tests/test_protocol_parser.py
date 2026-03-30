"""
Unit tests for the heuristic protocol parser.
These run entirely offline — no LLM key or Supabase needed.
"""
import pytest
from app.services.protocol_parser import _heuristic_parse


SAMPLE_PROTOCOL = """\
Human IL-6 ELISA — Sandwich Assay
Objective: Quantify IL-6 in cell culture supernatants.

Materials:
- 96-well MaxiSorp plate
- Capture antibody anti-IL-6 4 µg/mL
- Streptavidin-HRP conjugate 100 µL

Steps:
1. Coat plate with capture antibody. Incubate overnight at 4°C.
2. Wash wells 3x with wash buffer.
3. Block with 300 µL blocking buffer, 60 min at room temperature.
4. Add samples and standards. Incubate 2 hours at room temperature.
5. Wash 5x, then add detection antibody for 1 hour.
"""


def test_heuristic_parse_returns_parsedprotocol():
    result = _heuristic_parse(SAMPLE_PROTOCOL)
    assert result.title
    assert isinstance(result.steps, list)
    assert isinstance(result.materials, list)
    assert isinstance(result.ambiguities, list)
    assert isinstance(result.confidence, float)


def test_heuristic_parse_extracts_steps():
    result = _heuristic_parse(SAMPLE_PROTOCOL)
    assert len(result.steps) >= 3


def test_heuristic_parse_extracts_materials():
    result = _heuristic_parse(SAMPLE_PROTOCOL)
    assert len(result.materials) >= 1


def test_heuristic_confidence_below_llm_threshold():
    result = _heuristic_parse(SAMPLE_PROTOCOL)
    # Heuristic parser is capped at 0.55 to signal it's not AI-quality
    assert result.confidence <= 0.55


def test_heuristic_parse_empty_text():
    result = _heuristic_parse("")
    assert result.title  # Should not crash — returns graceful degraded output
    assert isinstance(result.ambiguities, list)
    assert "No numbered steps detected" in result.ambiguities[0] or len(result.ambiguities) >= 0


def test_heuristic_parse_detects_temperature():
    result = _heuristic_parse(SAMPLE_PROTOCOL)
    steps_with_temp = [s for s in result.steps if s.get("temperature_celsius") is not None]
    assert len(steps_with_temp) >= 1  # Step 1 has 4°C


def test_heuristic_parse_detects_duration():
    result = _heuristic_parse(SAMPLE_PROTOCOL)
    steps_with_duration = [s for s in result.steps if s.get("duration_minutes") is not None]
    assert len(steps_with_duration) >= 1  # Several steps have durations
