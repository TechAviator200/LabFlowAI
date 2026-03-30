"""
seed_demo.py
Loads sample workflows and experiment runs into the database for demo mode.
Run directly: python -m seeds.seed_demo
Or called automatically on startup when DEMO_MODE=true and DB is empty.
"""
from __future__ import annotations
import sys
import uuid
import json
from datetime import datetime, timezone
from pathlib import Path

SEEDS_DIR = Path(__file__).parent
SOPS_DIR = SEEDS_DIR / "sample_sops"
CSVS_DIR = SEEDS_DIR / "sample_csvs"


def run_seed(db) -> None:
    """Insert demo workflows, steps, materials, parameters, output schemas, and runs."""
    _seed_elisa(db)
    _seed_titration(db)
    _seed_pcr(db)
    print("Demo seed complete.")


def _seed_elisa(db) -> None:
    now = _now()
    wf_id = str(uuid.uuid4())

    wf = {
        "id": wf_id,
        "title": "Human IL-6 ELISA — Sandwich Assay",
        "objective": "Quantify IL-6 concentration in cell culture supernatants using a sandwich ELISA.",
        "status": "active",
        "source_text": (SOPS_DIR / "elisa_assay.txt").read_text(),
        "ambiguities": json.dumps([
            "Detection antibody dilution factor not specified.",
            "Streptavidin-HRP working dilution not stated.",
        ]),
        "confidence": 0.91,
        "version": 1,
        "created_at": now,
        "updated_at": now,
    }
    db.table("workflows").insert(wf).execute()

    steps = [
        ("Coat plate", "Dilute capture antibody to 4 µg/mL in PBS. Add 100 µL per well. Seal and incubate overnight at 4°C.", None, 4.0),
        ("Wash", "Remove coating solution. Wash wells 3× with wash buffer.", None, None),
        ("Block", "Add 300 µL blocking buffer per well. Incubate 1 hour at room temperature.", 60, 22.0),
        ("Add samples and standards", "Prepare 8-point standard curve (2000 pg/mL, 2-fold dilutions). Add 100 µL per well in duplicate. Incubate 2 hours.", 120, 22.0),
        ("Add detection antibody", "Add 100 µL biotinylated detection antibody per well. Incubate 1 hour.", 60, 22.0),
        ("Add Streptavidin-HRP", "Add 100 µL per well. Incubate 20 minutes protected from light.", 20, 22.0),
        ("TMB substrate", "Add 100 µL TMB per well. Incubate ~20 minutes until color develops.", 20, 22.0),
        ("Stop and read", "Add 50 µL stop solution per well. Read absorbance at 450 nm.", None, None),
    ]
    _insert_steps(db, wf_id, steps)

    materials = [
        {"name": "96-well MaxiSorp plate", "quantity": "1", "unit": "plate"},
        {"name": "Capture antibody anti-IL-6 MAB206", "quantity": "4", "unit": "µg/mL working"},
        {"name": "Biotinylated detection antibody", "quantity": None, "unit": None},
        {"name": "Streptavidin-HRP conjugate", "quantity": None, "unit": None},
        {"name": "TMB substrate", "quantity": "100", "unit": "µL/well"},
        {"name": "Stop solution 2N H2SO4", "quantity": "50", "unit": "µL/well"},
        {"name": "IL-6 recombinant standard", "quantity": "2000", "unit": "pg/mL (top standard)"},
    ]
    _insert_materials(db, wf_id, materials)

    _insert_schema(db, wf_id, [
        ("od_450", "number", True, "Raw absorbance at 450 nm"),
        ("od_corrected", "number", True, "Corrected OD (450 nm − 570 nm)"),
        ("concentration_pg_ml", "number", True, "Interpolated IL-6 concentration in pg/mL"),
        ("cv_percent", "number", False, "Coefficient of variation for duplicates"),
        ("sample_id", "string", True, "Sample identifier"),
    ])

    # Seed a completed run
    run_id = str(uuid.uuid4())
    db.table("experiment_runs").insert({
        "id": run_id,
        "workflow_id": wf_id,
        "status": "complete",
        "operator_notes": "Plate run 2025-03-10. SAMPLE_004 above curve — flagged for dilution re-run.",
        "run_summary": json.dumps({
            "planned": ["Step 1: Coat plate", "Step 2: Wash", "Step 3: Block",
                        "Step 4: Add samples and standards", "Step 5: Add detection antibody",
                        "Step 6: Add Streptavidin-HRP", "Step 7: TMB substrate", "Step 8: Stop and read"],
            "executed": ["od_450: 0.782–2.891", "od_corrected: 0.003–2.800",
                         "concentration_pg_ml: 31.25–2000 (standard curve)"],
            "missing": [],
            "review_required": ["SAMPLE_004 OD above standard curve — re-run at dilution recommended."],
            "overall_status": "review_required",
            "narrative": "8-step ELISA run completed. Standard curve and 4 samples processed. SAMPLE_004 signal exceeded the standard curve and must be diluted and re-run. All other samples produced clean duplicate pairs within CV acceptance criteria."
        }),
        "created_at": now,
    }).execute()

    _log(db, wf_id, run_id, "demo.seeded", {"source": "elisa_assay.txt"})


def _seed_titration(db) -> None:
    now = _now()
    wf_id = str(uuid.uuid4())

    wf = {
        "id": wf_id,
        "title": "Acetic Acid Titration — Vinegar Sample",
        "objective": "Determine the concentration of acetic acid in commercial vinegar using standardized NaOH.",
        "status": "active",
        "source_text": (SOPS_DIR / "titration_protocol.txt").read_text(),
        "ambiguities": json.dumps([
            "NaOH concentration labeled 'approximately 0.1 M' — exact value requires standardization record.",
        ]),
        "confidence": 0.88,
        "version": 1,
        "created_at": now,
        "updated_at": now,
    }
    db.table("workflows").insert(wf).execute()

    steps = [
        ("Burette preparation", "Rinse with water, condition with NaOH. Fill to 0.00 mL. Remove air bubbles.", None, 22.0),
        ("Sample preparation", "Pipette 10.00 mL vinegar into 250 mL flask. Add 40 mL water. Add 3 drops phenolphthalein.", None, 22.0),
        ("Titration", "Add NaOH dropwise while stirring. Slow to drop-by-drop near endpoint.", None, 22.0),
        ("Endpoint detection", "Stop at faint persistent pink (30 seconds). Record final burette reading.", None, 22.0),
        ("Calculation", "Calculate volume NaOH, moles, molarity, and weight percent acetic acid.", None, None),
        ("Repeat", "Perform at least 3 replicate titrations. Report mean and SD.", None, None),
    ]
    _insert_steps(db, wf_id, steps)

    materials = [
        {"name": "Commercial white vinegar", "quantity": "10.00", "unit": "mL per trial"},
        {"name": "Standardized NaOH solution", "quantity": "~0.1", "unit": "M"},
        {"name": "Phenolphthalein indicator", "quantity": "3", "unit": "drops"},
        {"name": "Distilled water", "quantity": "~40", "unit": "mL per trial"},
        {"name": "50 mL Class A burette", "quantity": "1", "unit": "unit"},
    ]
    _insert_materials(db, wf_id, materials)

    _insert_schema(db, wf_id, [
        ("volume_naoh_ml", "number", True, "Volume of NaOH used to reach endpoint (mL)"),
        ("molarity_acetic_acid_M", "number", True, "Calculated molarity of acetic acid"),
        ("weight_percent_acetic_acid", "number", True, "Weight percent of acetic acid"),
        ("cv_percent", "number", False, "CV% across triplicate trials"),
        ("trial", "string", True, "Trial number identifier"),
    ])

    run_id = str(uuid.uuid4())
    db.table("experiment_runs").insert({
        "id": run_id,
        "workflow_id": wf_id,
        "status": "complete",
        "operator_notes": "Three replicate trials completed. Results within acceptance criteria.",
        "run_summary": json.dumps({
            "planned": ["Step 1: Burette preparation", "Step 2: Sample preparation",
                        "Step 3: Titration", "Step 4: Endpoint detection",
                        "Step 5: Calculation", "Step 6: Repeat"],
            "executed": ["volume_naoh_ml: 18.30 ± 0.031", "molarity_acetic_acid_M: 0.1873 ± 0.0005",
                         "weight_percent_acetic_acid: 5.07 ± 0.01"],
            "missing": [],
            "review_required": [],
            "overall_status": "complete",
            "narrative": "Triplicate titrations completed successfully. Mean acetic acid concentration 5.07% w/v. CV 0.20%. Percent recovery 101.4% vs labeled concentration of 5.0%. All acceptance criteria met."
        }),
        "created_at": now,
    }).execute()

    _log(db, wf_id, run_id, "demo.seeded", {"source": "titration_protocol.txt"})


def _seed_pcr(db) -> None:
    """PCR workflow seeded as 'draft' with no run — shows ambiguity detection demo."""
    now = _now()
    wf_id = str(uuid.uuid4())

    wf = {
        "id": wf_id,
        "title": "RT-qPCR Gene Expression — SYBR Green",
        "objective": "Quantify relative mRNA expression using RT-qPCR with SYBR Green detection.",
        "status": "draft",
        "source_text": (SOPS_DIR / "pcr_protocol.txt").read_text(),
        "ambiguities": json.dumps([
            "Primer sequences not provided in this protocol — verify primer pair specificity before use.",
            "Reference gene (GAPDH vs ACTB) selection criteria not defined.",
            "cDNA dilution factor ('1:5') assumes specific RNA input — confirm for each sample batch.",
        ]),
        "confidence": 0.74,
        "version": 1,
        "created_at": now,
        "updated_at": now,
    }
    db.table("workflows").insert(wf).execute()

    steps = [
        ("RNA quality check", "Verify RNA quality: RIN > 7, A260/280 > 1.8 before cDNA synthesis.", None, None),
        ("cDNA synthesis", "Reverse transcribe 500 ng–1 µg total RNA. Dilute 1:5 before use.", None, None),
        ("Master mix preparation", "Combine SYBR Green 2x mix, primers, and water per reaction volumes.", None, 22.0),
        ("Plate setup", "Dispense 20 µL per well. Include NTC and reference gene wells.", None, None),
        ("Seal and load", "Apply optical adhesive film. Centrifuge briefly. Load instrument.", None, None),
        ("Thermal cycling", "Run 40-cycle program: 95°C 15s / 60°C 1 min. Include melt curve.", None, None),
        ("Data analysis", "Apply ΔΔCt method. Normalize to reference gene. Report fold-change.", None, None),
    ]
    _insert_steps(db, wf_id, steps)

    _insert_schema(db, wf_id, [
        ("ct_value", "number", True, "Cycle threshold value"),
        ("delta_ct", "number", True, "ΔCt (target − reference)"),
        ("delta_delta_ct", "number", False, "ΔΔCt relative to control"),
        ("fold_change", "number", False, "2^(-ΔΔCt) fold-change"),
        ("melt_peak_celsius", "number", False, "Melt curve peak temperature (°C)"),
        ("sample_id", "string", True, "Sample identifier"),
    ])

    _log(db, wf_id, None, "demo.seeded", {"source": "pcr_protocol.txt"})


# ── Helpers ────────────────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _insert_steps(db, wf_id: str, steps: list[tuple]) -> None:
    rows = [
        {
            "id": str(uuid.uuid4()),
            "workflow_id": wf_id,
            "step_number": i + 1,
            "title": t,
            "description": d,
            "duration_minutes": dur,
            "temperature_celsius": temp,
        }
        for i, (t, d, dur, temp) in enumerate(steps)
    ]
    if rows:
        db.table("workflow_steps").insert(rows).execute()


def _insert_materials(db, wf_id: str, mats: list[dict]) -> None:
    rows = [{"id": str(uuid.uuid4()), "workflow_id": wf_id, **m} for m in mats]
    if rows:
        db.table("materials").insert(rows).execute()


def _insert_schema(db, wf_id: str, fields: list[tuple]) -> None:
    rows = [
        {
            "id": str(uuid.uuid4()),
            "workflow_id": wf_id,
            "field_name": name,
            "field_type": ftype,
            "required": req,
            "description": desc,
        }
        for name, ftype, req, desc in fields
    ]
    if rows:
        db.table("output_schemas").insert(rows).execute()


def _log(db, wf_id: str | None, run_id: str | None, event: str, detail: dict) -> None:
    db.table("audit_events").insert({
        "id": str(uuid.uuid4()),
        "workflow_id": wf_id,
        "run_id": run_id,
        "event_type": event,
        "actor": "seed_script",
        "detail": json.dumps(detail),
        "created_at": _now(),
    }).execute()


if __name__ == "__main__":
    import os
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from app.database import get_db
    run_seed(get_db())
