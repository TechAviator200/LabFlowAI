# LabFlow AI

**AI workflow extraction and validation layer for biotech R&D.**

Turn unstructured SOPs and protocol text into structured, version-controlled, audit-ready experiment workflows — with ambiguities flagged before you run anything.

> ⚠️ **Demo / Sandbox** — LabFlow AI is not validated for GxP, FDA, EMA, or any regulatory framework. All AI-generated outputs are drafts that require human review. See [Safety and Human Review](#safety-and-human-review).

[![CI](https://github.com/your-org/labflow-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/labflow-ai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## The Problem

Over **70% of researchers** have failed to reproduce another scientist's experiment. The root cause is almost never fraud — it's missing context: unspecified temperatures, ambiguous concentrations, undocumented deviations.

SOPs exist. They're PDFs, Word docs, lab notebooks. Unstructured. Non-queryable. Not machine-readable. Every experiment run involves a researcher manually interpreting the SOP, deciding what to record, building a spreadsheet — high-cost, error-prone, non-standardised.

**There is no structured data layer between protocol intent and experimental outcome.**

---

## What LabFlow AI Does

```
Raw SOP text  →  Structured Workflow  →  Experiment Run  →  Validated Output
    │                    │                      │                    │
  Paste or           AI extracts            Upload CSV          Mapped, flagged,
  upload             steps, materials,      output data         audit-logged
                     parameters,
                     ambiguities,
                     confidence score
```

| Capability | Description |
|---|---|
| **Protocol Parsing** | LLM extracts steps, materials, parameters, output schema from any free-text SOP |
| **Ambiguity Detection** | Rule-based + AI flagging of missing units, temperatures, concentrations |
| **Confidence Scoring** | Every parse includes a 0–100% self-reported confidence score |
| **Output Mapping** | Fuzzy-match CSV instrument exports against the workflow output schema |
| **Run Comparison** | Planned vs. actual outputs side-by-side with missing data highlighted |
| **Audit Trail** | Immutable, timestamped log of every action |
| **Human Review** | Every AI output is explicitly labelled as a draft requiring sign-off |

---

## Human-in-the-Loop Design

LabFlow AI is an **AI copilot, not an autonomous system**:

- Every AI-extracted workflow surfaces a **confidence score** and **ambiguity list**
- Every output is labelled **"AI-generated draft — requires human review"**
- The audit trail records every action — who did what, when, with what result
- Re-parsing is always available; source text is always preserved
- The system never overwrites data — runs are append-only, outputs are immutable

This is intentional. In a scientific context, blind automation is dangerous. LabFlow AI gives you AI leverage **with human accountability**.

---

## Quick Start (No credentials needed)

The app runs fully in-memory with three pre-loaded demo workflows (ELISA, RT-qPCR, Acid-Base Titration). No Supabase or LLM key required.

### Backend

```bash
cd labflowai/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # defaults work out of the box for demo
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/health   {"status": "ok", "demo_mode": true}
```

### Frontend

```bash
cd labflowai/frontend
npm install
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
# → http://localhost:3000
```

### Tests

```bash
cd labflowai/backend
pip install -r requirements-dev.txt
pytest tests/ -v
```

---

## Architecture

```
Browser (Next.js :3000)
       │  /api/* → rewritten to backend (URL hidden from browser)
       ▼
FastAPI (:8000)
  ├── POST /workflows       — parse + structure protocols
  ├── GET  /workflows       — list all workflows
  ├── POST /documents/upload — PDF/TXT text extraction
  ├── POST /runs            — create experiment run
  ├── POST /runs/{id}/upload-output — CSV → output schema mapping
  ├── POST /runs/{id}/summarize    — planned vs actual comparison
  ├── GET  /audit           — immutable event log
  └── GET  /health          — status + demo mode flag
       │
       ├── MockDB (in-memory, default)  OR  Supabase (PostgreSQL + Storage)
       └── Heuristic parser (default)  OR  LLM API (OpenAI / Azure / Anthropic)
```

**Backend services** (`labflowai/backend/app/`):

| Module | Responsibility |
|---|---|
| `main.py` | FastAPI app, CORS, lifespan, demo seeding |
| `mock_store.py` | In-memory DB — mirrors Supabase API, zero config |
| `config.py` | Pydantic Settings (12-factor env var management) |
| `database.py` | DB client factory — auto-selects mock or Supabase |
| `services/protocol_parser.py` | LLM parse + heuristic fallback |
| `services/workflow_structurer.py` | ParsedProtocol → normalised DB rows |
| `services/metadata_checker.py` | Rule-based ambiguity detection |
| `services/output_mapper.py` | CSV fuzzy column matching + flagging |
| `services/run_summary_generator.py` | Planned vs actual + LLM narrative |
| `services/audit_logger.py` | Append-only event logging |

---

## Structured Knowledge Model

When LabFlow AI parses a protocol, it produces a **structured entity graph** — not a blob of text, not a PDF. Every parsed workflow becomes a set of typed, relational records:

```
Workflow
  ├── id, title, objective, status, confidence, version
  ├── Steps[]      → step_number, title, description, duration_minutes, temperature_celsius
  ├── Materials[]  → name, quantity, unit, catalog_number
  ├── Parameters[] → name, value, unit, expected_range
  └── OutputSchema[] → field_name, field_type, required, description
```

Each Experiment Run then maps observed CSV data against the OutputSchema:

```
ExperimentRun
  ├── workflow_id (→ Workflow)
  ├── RunOutputs[] → field_name, raw_value, normalized_value, flagged, flag_reason
  └── RunSummary  → planned[], executed[], missing[], review_required[], narrative
```

This structure is **semantic-ready**: every field has a defined type, relationships are explicit, and the entity graph can be exported as JSON-LD or mapped to emerging lab science ontologies (FAIR data principles, ISA-Tab, Allotrope-compatible structures). It is not a compliance system, but it produces the structured data that compliance systems need.

**Example: JSON-LD representation of a workflow step**

```json
{
  "@context": "https://schema.org/",
  "@type": "HowToStep",
  "position": 1,
  "name": "Coat plate with capture antibody",
  "text": "Coat plate with capture antibody in PBS. Seal and incubate overnight at 4°C.",
  "duration": "PT12H",
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "temperature_celsius", "value": 4 }
  ]
}
```

The data model is graph-ready: a Workflow → Steps → Materials → Outputs chain that can be ingested by a knowledge graph, a LIMS, or an ELN without transformation.

---

## Deployment

### Frontend → Vercel

1. Import the repo into Vercel
2. Set root directory to `labflowai/frontend`
3. Set environment variable: `NEXT_PUBLIC_API_URL=https://your-render-api-url.onrender.com`
4. Deploy

### Backend → Render

1. Create a new Web Service pointing to this repo
2. Render reads `render.yaml` automatically for build/start commands
3. Set these environment variables in the Render dashboard:
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_SERVICE_KEY` — service-role key (keep server-side only)
   - `LLM_API_KEY` — OpenAI / Anthropic API key
   - `CORS_ORIGINS` — your Vercel frontend URL
4. Deploy

### Database → Supabase

1. Create a new Supabase project
2. Run `labflowai/backend/migrations/001_initial_schema.sql` in the SQL Editor
3. Create a storage bucket named `labflow-uploads`
4. Copy the project URL and service-role key into Render env vars

### Without any of the above

Leave all credentials blank. The app runs entirely in-memory with demo data. Perfect for local development and demos.

---

## Competitive Positioning

| Layer | LabFlow AI | ELN (Benchling, SciNote) | LIMS (LabWare) | Spreadsheets |
|---|---|---|---|---|
| Protocol structuring | ✅ | ❌ | ❌ | ❌ |
| Ambiguity detection | ✅ | ❌ | ❌ | ❌ |
| Confidence scoring | ✅ | ❌ | ❌ | ❌ |
| Output schema mapping | ✅ | Partial | Partial | ❌ |
| Audit trail | ✅ | ✅ | ✅ | ❌ |
| Zero-config demo | ✅ | ❌ | ❌ | N/A |
| Open source | ✅ | ❌ | ❌ | N/A |

LabFlow AI fills the gap **between SOP text and structured run data** — the layer that ELNs and LIMS don't touch.

---

## Safety and Human Review

### What this product does

- Extracts structure from unstructured protocol text using AI and heuristics
- Flags ambiguities and missing metadata for human review
- Maps experimental outputs against a defined schema
- Maintains an immutable audit trail

### What this product does NOT do

- Does not make autonomous scientific decisions
- Does not validate or certify experimental results
- Does not replace expert scientific judgment
- Is not compliant with GxP, 21 CFR Part 11, EU Annex 11, ISO 13485, or any regulatory framework
- Is not suitable for clinical, diagnostic, or patient-facing use

### All AI outputs are clearly labelled

Every AI-generated output in the UI carries:
- A confidence score (0–100%)
- An "AI-generated draft" label
- A "Requires human review" indicator
- A list of flagged ambiguities

Human sign-off is always explicit and visible.

---

## Go-Live Checklist

Before making this public:

- [x] `.gitignore` covers `.env`, `node_modules`, `.venv`, `.next`
- [x] No secrets in source code or `.env.example`
- [x] SECURITY.md present with key separation rules
- [x] CI runs lint, tests, and security scans on every push
- [x] Health endpoint returns `{"status": "ok"}`
- [x] Demo mode works with zero credentials
- [x] Tests pass offline (heuristic parser, mock DB)
- [ ] `git init` the repo and push to GitHub
- [ ] Replace placeholder GitHub org/repo in CI badge URL
- [ ] Set `CORS_ORIGINS` in production backend to your Vercel URL
- [ ] Set `NEXT_PUBLIC_API_URL` in Vercel to your Render URL
- [ ] Run `npm audit` and `pip-audit` and resolve any HIGH CVEs
- [ ] Add Supabase credentials for persistent storage (optional)
- [ ] Add LLM API key for AI-powered parsing (optional — heuristic parser works without it)

---

## Known Limitations

| Limitation | Notes |
|---|---|
| Heuristic parser accuracy | Without an LLM key, extraction is regex-based and capped at ~55% confidence. Complex SOPs may parse poorly. |
| No authentication | Demo mode has no user accounts. Not suitable for multi-user or production use without adding auth. |
| In-memory data loss | MockDB resets on server restart. Supabase required for persistence. |
| No file storage in mock mode | Document uploads work but files are not persisted without Supabase Storage. |
| English-only parsing | The LLM prompt and heuristic parser assume English-language protocols. |
| PDF extraction quality | PyPDF2 extracts plain text — scanned PDFs or image-heavy files will not parse well. |
| Not GxP compliant | The audit trail is immutable by design but has not been validated for regulatory use. |

---

## Repo Structure

```
LabFlowAI/
├── .github/workflows/ci.yml      # CI: lint, test, security scan
├── .gitignore
├── LICENSE
├── README.md                      # this file
├── SECURITY.md
├── render.yaml                    # Render deployment config (backend)
└── labflowai/
    ├── backend/
    │   ├── app/
    │   │   ├── main.py            # FastAPI entry point
    │   │   ├── config.py          # Pydantic Settings
    │   │   ├── database.py        # DB client factory
    │   │   ├── mock_store.py      # In-memory MockDB
    │   │   ├── schemas.py         # API contracts
    │   │   ├── routers/           # 4 route modules
    │   │   └── services/          # 6 service modules
    │   ├── migrations/            # SQL schema
    │   ├── seeds/                 # Demo data + sample SOPs
    │   ├── tests/                 # pytest test suite
    │   ├── .env.example
    │   └── requirements.txt
    └── frontend/
        ├── src/
        │   ├── app/               # Next.js App Router pages
        │   ├── components/        # Reusable UI components
        │   └── lib/               # API client + types
        ├── public/sample-sops/    # Static demo protocol files
        ├── vercel.json            # Vercel deployment config
        ├── .env.example
        └── package.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI + Python 3.11+ |
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Database | Supabase (PostgreSQL + JSONB + Storage) |
| LLM | OpenAI-compatible API (GPT-4o, Azure, Anthropic, local) |
| Demo mode | In-memory mock DB + heuristic parser — zero external dependencies |
| CI | GitHub Actions (lint, test, pip-audit, bandit, gitleaks) |
| Hosting | Vercel (frontend) + Render (backend) |

---

## Future Vision

**Near-term**
- ELN connectors: push structured workflows into Benchling, SciNote, Labguru
- Instrument integrations: direct import from plate readers, qPCR systems, HPLC
- Multi-user workspaces with approval workflows and role-based access

**Medium-term**
- Cross-run analytics: detect drift and anomalies across repeated runs
- Automated deviation flagging: real-time planned vs. actual comparison
- Compliance pathway: 21 CFR Part 11 alignment for electronic signatures

**Long-term**
- Autonomous protocol optimisation from run history
- Regulatory submission packages for IND/BLA/NDA filings
- Native FAIR data export and knowledge graph integration

---

## License

MIT — see [LICENSE](LICENSE) for details.
