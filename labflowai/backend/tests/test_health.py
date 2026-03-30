"""
Smoke tests — verify the app starts and core endpoints respond correctly.
Run from labflowai/backend/:  pytest tests/
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "demo_mode" in data
    assert "env" in data


def test_list_workflows_returns_list():
    response = client.get("/workflows")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_create_workflow_heuristic_parse():
    """Full parse round-trip using the heuristic parser (no LLM key needed)."""
    payload = {
        "text": (
            "Simple Protocol\n"
            "Objective: Test the heuristic parser.\n"
            "Materials:\n- PBS buffer 100 mL\n- Sample 1 mL\n"
            "Steps:\n"
            "1. Add 100 mL PBS to tube. Incubate 30 min at 37°C.\n"
            "2. Add sample and vortex.\n"
            "3. Centrifuge at 1500 rpm for 10 min.\n"
        )
    }
    response = client.post("/workflows", json=payload)
    assert response.status_code in (200, 201)
    data = response.json()
    assert "id" in data
    assert data["title"]
    assert isinstance(data["steps"], list)
    assert isinstance(data["ambiguities"], list)
    assert isinstance(data["confidence"], float)
    assert 0.0 <= data["confidence"] <= 1.0


def test_workflow_not_found_returns_404():
    response = client.get("/workflows/nonexistent-id-12345")
    assert response.status_code == 404


def test_audit_returns_list():
    response = client.get("/audit")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
