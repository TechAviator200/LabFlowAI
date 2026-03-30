# LabFlow AI

**The experiment workflow copilot for biotech and scientific R&D teams.**

LabFlow AI converts unstructured SOPs, protocol drafts, and instrument exports into structured, traceable, reusable experiment records — with AI doing the extraction and humans staying in control.

> ⚠️ **DEMO / SANDBOX** — LabFlow AI is not validated for GxP, 21 CFR Part 11, EU Annex 11, or any regulatory framework. All AI-generated content requires qualified human review before use in any regulated environment.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Problem](#2-problem)
3. [Solution](#3-solution)
4. [Product Requirements](#4-product-requirements)
5. [System Architecture](#5-system-architecture)
6. [Core Components](#6-core-components)
7. [Data Model](#7-data-model)
8. [Demo Walkthrough](#8-demo-walkthrough)
9. [Tech Stack](#9-tech-stack)
10. [Deployment](#10-deployment)
11. [Configuration](#11-configuration)
12. [API Reference](#12-api-reference)
13. [Traceability and Human Review](#13-traceability-and-human-review)
14. [Future Improvements](#14-future-improvements)

---

## 1. Product Overview

LabFlow AI is an AI-powered workflow standardization platform for biotech, pharma, and academic research teams. It sits at the intersection of document intelligence and scientific process management — giving R&D teams a fast, structured path from raw protocol text to traceable experiment records.

**What it does:**
- Accepts unstructured protocol text, SOPs, or PDF uploads
- Extracts steps, materials, parameters, and expected outputs using LLM-based parsing
- Flags missing metadata, ambiguous instructions, and undefined values before experiments run
- Maps uploaded instrument CSV outputs against the structured workflow schema
- Generates a plain-English run summary comparing planned vs actual results

**Who it is for:**
- **Research scientists** who inherit inconsistent SOPs or write their own experiment notes
- **Lab operations managers** who need standardized records across teams and projects
- **QA/QC teams** building toward compliant documentation practices
- **CROs and core facilities** processing high volumes of repeated assay types
- **Biotech startups** that need structured data capture before they can afford an ELN

---

## 2. Problem

Scientific workflows are broken at the data layer.

Most labs run on a patchwork of Word documents, shared drives, emailed PDFs, handwritten notes, and instrument-specific export formats. A protocol written by one scientist is interpreted differently by the next. A reagent concentration listed as "10x" in one SOP means something different in another. Incubation times get omitted. Units get dropped. Steps get reordered by habit.

**The consequences are systemic:**

- **Reproducibility failures.** A 2016 Nature survey found that over 70% of researchers could not reproduce another scientist's results — and over 50% could not reproduce their own. Unstructured protocols are a leading root cause.
- **Wasted time.** Scientists spend an estimated 30–40% of their working time on data handling, reformatting, and manual record reconciliation — time that doesn't generate science.
- **Data quality gaps.** Instrument outputs land in CSV files that no one maps to a consistent schema. When it's time to analyze across runs, someone has to harmonize columns manually, introducing errors and delaying decisions.
- **Compliance exposure.** For teams moving toward regulated workflows (IND submissions, GLP, ISO), undocumented or inconsistently documented experiments become liabilities. Fixing them retroactively is expensive and often incomplete.
- **Knowledge loss.** When scientists leave, the institutional knowledge encoded in their idiosyncratic SOPs leaves with them. There is no structured record — only files.

The core issue is not that scientists are careless. It is that there is no lightweight, intelligent layer between raw protocol text and structured, searchable, reusable experiment data. LabFlow AI is that layer.

---

## 3. Solution

LabFlow AI applies a multi-stage AI pipeline to the moment a protocol is written or uploaded — transforming it from a document into a structured, validated workflow record in seconds.

**The transformation:**

```
Unstructured Text / SOP / PDF
        ↓
   LLM Protocol Parsing
        ↓
Rule-Based Metadata Checking
        ↓
   Structured Workflow Record
   (steps · materials · parameters · output schema)
        ↓
   CSV Output Mapping
        ↓
   Run Summary + Audit Trail
```

Every step is transparent. Extracted fields are shown alongside their source. Ambiguities are surfaced explicitly — not buried in a confidence score. Scientists see what the AI found, what it couldn't resolve, and what needs a human decision before the workflow is used.

This is not an autonomous system that makes scientific decisions. It is a structured extraction and validation layer that makes the scientist's own knowledge explicit, auditable, and reusable.

---

## 4. Product Requirements

### Target Users

| Persona | Pain Point | Primary Use Case |
|---|---|---|
| Research Scientist | Inherited SOPs are inconsistent or incomplete | Parse and standardize incoming protocols |
| Lab Operations Manager | No standard format across the team | Create reusable workflow templates |
| QA / QC Lead | Audit trails are fragmented across tools | Centralize experiment records with structured output |
| CRO / Core Facility Staff | High assay volume, repeated formats | Templated runs with automated output mapping |

### Core Use Cases

1. **Protocol standardization** — Upload or paste an SOP; receive a validated, structured workflow template with all ambiguities flagged.
2. **Experiment execution record** — Start a run against a workflow, upload instrument CSV output, and generate a structured run record.
3. **Gap detection** — Identify missing parameters, undefined units, and incomplete steps before running an experiment.
4. **Run comparison** — Compare planned steps against actual captured outputs; identify missing or anomalous data fields.
5. **Audit trail** — Maintain a timestamped event record for every workflow, document upload, and run action.

### Primary User Flow

```
1. User navigates to /new
2. Pastes or uploads protocol text (TXT, PDF, MD)
3. System parses protocol → extracts steps, materials, parameters, output schema
4. System flags ambiguities (missing units, temperatures, concentrations)
5. User reviews extracted structure on /workflows/[id]
6. User clicks "Start Run" → system creates an ExperimentRun record
7. User uploads instrument output CSV
8. System maps CSV columns to workflow OutputSchema → flags mismatches
9. User clicks "Generate Summary" → system produces a structured RunSummary
10. Summary shows: planned / executed / missing / review-required
11. Audit trail records every action with timestamps
```

### Key Features

- **AI protocol parsing** — LLM-based extraction of steps, materials, parameters, and expected outputs from free-form text
- **Ambiguity detection** — Dual-layer (LLM + rule-based) identification of missing metadata
- **Output schema definition** — Each workflow defines the data fields it expects to produce
- **CSV output mapping** — Fuzzy column matching against output schema, with flagging for unmatched fields
- **Run summary generation** — Deterministic comparison + optional LLM narrative for each run
- **Immutable audit trail** — Every significant action recorded with event type, actor, and detail payload
- **Demo mode** — Three preloaded workflows with sample runs, ready to explore without configuration
- **Provider-agnostic LLM** — Works with OpenAI, Azure OpenAI, Anthropic, or any OpenAI-compatible endpoint
- **File governance** — Raw uploaded files stored separately from normalized extracted records

### Success Metrics

| Metric | Target |
|---|---|
| Time to structured workflow from raw SOP | < 60 seconds |
| Ambiguity detection rate vs manual review | ≥ 80% recall |
| CSV field mapping accuracy | ≥ 85% auto-match on clean instrument exports |
| Reduction in manual reformatting time per run | 30–60 minutes saved |
| Audit trail completeness | 100% of workflow/run events captured |

---

## 5. System Architecture

LabFlow AI is a decoupled, API-first application. The frontend and backend are independently deployable and communicate exclusively over HTTP.

### Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│                    Next.js 14 Frontend                          │
│         (landing · dashboard · workflow detail · upload)        │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP / REST
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Python 3.11)                 │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  ┌────────┐  │
│  │  /workflows │  │  /documents  │  │   /runs   │  │ /audit │  │
│  └──────┬──────┘  └──────┬───────┘  └─────┬─────┘  └────────┘  │
│         │                │                │                     │
│  ┌──────▼──────────────────────────────────────────────────┐    │
│  │                    Service Layer                        │    │
│  │  document_ingestion · protocol_parser                   │    │
│  │  workflow_structurer · metadata_checker                 │    │
│  │  output_mapper · run_summary_generator · audit_logger   │    │
│  └──────┬───────────────────────────────────┬─────────────┘    │
│         │                                   │                   │
└─────────┼───────────────────────────────────┼───────────────────┘
          │                                   │
          ▼                                   ▼
┌──────────────────┐               ┌─────────────────────┐
│ Supabase Postgres│               │  Supabase Storage   │
│                  │               │                     │
│ workflows        │               │  labflow-uploads/   │
│ workflow_steps   │               │  (raw files)        │
│ materials        │               └─────────────────────┘
│ parameters       │
│ output_schemas   │               ┌─────────────────────┐
│ uploaded_docs    │               │  LLM Provider       │
│ experiment_runs  │               │  (OpenAI-compatible) │
│ run_outputs      │               │                     │
│ audit_events     │               │  protocol_parser    │
└──────────────────┘               │  run_summary_gen    │
                                   └─────────────────────┘
```

### Data Flow

1. **Upload / Paste** — User submits text or file via the frontend.
2. **Ingestion** — Backend validates file type, extracts text, uploads raw file to Supabase Storage.
3. **Parse** — Extracted text is sent to the LLM with a structured system prompt. Response is validated against the `ParsedProtocol` schema.
4. **Check** — Rule-based metadata checker scans the parsed output for missing units, temperatures, and concentrations.
5. **Structure** — Combined output is normalized into workflow, step, material, parameter, and output schema rows and written to Postgres.
6. **Run** — User starts a run. Uploads CSV. Output mapper fuzzy-matches CSV columns against the workflow's output schema.
7. **Summarize** — Deterministic comparison produces the run summary. Optional LLM pass adds a plain-English narrative.
8. **Audit** — Every action above writes an immutable event row to `audit_events`.

---

## 6. Core Components

### `document_ingestion.py`
Accepts file uploads (TXT, PDF, CSV, MD), enforces type and size limits (20 MB), extracts raw text using PyPDF2 for PDFs, and uploads the original file to Supabase Storage. Raw files and extracted text records are deliberately separated — the storage path is a pointer, not the data.

### `protocol_parser.py`
Sends extracted text to an OpenAI-compatible LLM with a tightly scoped system prompt. The prompt instructs the model to return structured JSON only — no markdown, no prose. Fields include: title, objective, materials (with quantities and units), steps (with duration and temperature), parameters, expected outputs, ambiguities, and a self-reported confidence score. The model is explicitly instructed to use `null` rather than fabricate missing values. Parse failures return a degraded result rather than crashing.

### `workflow_structurer.py`
Converts the validated `ParsedProtocol` object into normalized database row dictionaries for all five related tables. All UUIDs are pre-generated before the insert batch. This layer is purely deterministic — no LLM involvement.

### `metadata_checker.py`
A rule-based complement to the LLM ambiguity detection. Uses regex pattern matching to identify:
- Steps that reference incubation or temperature without a value
- Steps with reaction or wait language but no duration
- Materials with quantities but no units
- Parameters with values but no units
- Concentration language without a numeric concentration pattern

This layer catches failure modes that LLMs sometimes miss or phrase inconsistently across runs.

### `output_mapper.py`
Parses uploaded CSV files using pandas and attempts fuzzy column-name matching against the workflow's `OutputSchema`. Matching uses token-overlap similarity — a column named `od_corrected_450` will match a schema field named `od_corrected`. Required schema fields with no CSV match are flagged as missing. CSV columns with no schema match are flagged for human review. All mappings and flags are stored per-row in `run_outputs`.

### `run_summary_generator.py`
Produces a `RunSummary` object with four lists — planned, executed, missing, review_required — and an `overall_status` of `complete`, `partial`, or `review_required`. The status is computed deterministically. An optional LLM pass generates a 3–5 sentence plain-English narrative. If no API key is configured or the LLM call fails, a fallback narrative is generated from the structured lists. The summary never fabricates conclusions.

### `audit_logger.py`
Writes a timestamped, immutable event row to `audit_events` on every significant action. Failures are logged but never bubble up — audit must not block primary operations. Event types include: `workflow.created`, `protocol.parsed`, `document.uploaded`, `run.created`, `outputs.mapped`, `summary.generated`.

---

## 7. Data Model

### `Workflow`
The primary record. Contains the title, objective, parsed source text, status (`draft` / `active` / `archived`), and a JSON array of ambiguity strings. Parent to all step, material, parameter, and schema records.

### `WorkflowStep`
An ordered procedural step belonging to a workflow. Stores step number, title, description, optional duration in minutes, optional temperature in Celsius, and free-text notes. The combination of these fields is the structured form of what was previously a sentence in an SOP.

### `ExperimentRun`
A single execution instance of a workflow. Tracks status through its lifecycle: `created` → `outputs_uploaded` → `complete` / `partial` / `review_required`. Stores operator notes and the final `run_summary` JSON. One workflow can have many runs.

### `OutputSchema`
Defines the expected output data fields for a workflow — field name, type (`string` / `number` / `boolean` / `date`), whether it is required, and a description. This schema is what the output mapper checks incoming CSV columns against. It is the contract between the protocol (what should be measured) and the instrument output (what was measured).

### Supporting Tables

| Table | Purpose |
|---|---|
| `materials` | Reagents, equipment, consumables — with quantity, unit, catalog number |
| `parameters` | Key experimental variables with expected values and ranges |
| `run_outputs` | Mapped output values per run — raw, normalized, unit, and flag status |
| `uploaded_documents` | File metadata with storage path and extracted text |
| `audit_events` | Immutable timestamped event log for every workflow and run action |

---

## 8. Demo Walkthrough

### Prerequisites

- Python 3.11+ and Node.js 18+
- A Supabase project (free tier works)
- An OpenAI API key, or any OpenAI-compatible endpoint

### Step 1 — Database

Open your Supabase project → SQL Editor → paste and run:

```
backend/migrations/001_initial_schema.sql
```

This creates all 10 tables, indexes, and the `updated_at` trigger.

Create a private storage bucket named `labflow-uploads` in Supabase Storage.

### Step 2 — Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Set: SUPABASE_URL, SUPABASE_SERVICE_KEY, LLM_API_KEY, LLM_MODEL

uvicorn app.main:app --reload --port 8000
```

On first startup with `DEMO_MODE=true` and an empty database, three sample workflows are seeded automatically.

To seed manually at any time:

```bash
python -m seeds.seed_demo
```

### Step 3 — Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set: NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### What You'll See

**Dashboard (`/dashboard`)** — Three preloaded workflows: a completed ELISA run, a completed titration run, and a draft qPCR workflow with ambiguities flagged.

**Workflow Detail (`/workflows/[id]`)** — Five tabs:
- **Extracted Structure** — Steps, materials, parameters, and output schema fields extracted from the SOP
- **Source Document** — The original protocol text for comparison
- **Mapped Outputs** — CSV output fields mapped to the schema, with flag status per row
- **Run Summary** — Planned steps vs captured outputs, missing data, items requiring review, and a plain-English narrative
- **Audit Trail** — Timestamped event log for every action taken on this workflow

**Try It Yourself (`/new`)** — Paste any protocol text or load one of the three sample SOPs. Click "Parse Protocol" and watch the pipeline run. The result appears immediately in the workflow detail view.

**Upload (`/upload`)** — Upload the sample CSVs from `backend/seeds/sample_csvs/` against an existing run to see output mapping in action.

---

## 9. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend framework | Next.js 14 (App Router) | Server/client React, routing, API rewrites |
| UI library | React 18 | Component model |
| Styling | Tailwind CSS 3 | Utility-first CSS |
| Type safety | TypeScript 5 | End-to-end typed contracts |
| Backend framework | FastAPI (Python 3.11) | Async REST API, OpenAPI docs |
| Data validation | Pydantic v2 | Schema validation, settings management |
| Database | Supabase Postgres | Relational data, indexed queries |
| File storage | Supabase Storage | Raw uploaded file storage |
| AI / LLM | OpenAI-compatible API | Protocol parsing, run narrative generation |
| PDF parsing | PyPDF2 | Text extraction from PDF uploads |
| CSV processing | pandas | Column parsing and fuzzy output mapping |
| HTTP client | httpx | Async HTTP in the backend |
| Deployment — frontend | Vercel | Edge-optimized Next.js hosting |
| Deployment — backend | Render | Python web service hosting |

---

## 10. Deployment

### Render (Backend)

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your repo — set root directory to `backend/`
3. **Build command:** `pip install -r requirements.txt`
4. **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add all variables from `backend/.env.example` in the Render Environment tab
6. Set `APP_ENV=production` and `DEMO_MODE=false` for production

### Vercel (Frontend)

1. Import your repo on [Vercel](https://vercel.com)
2. Set root directory to `frontend/`
3. Framework preset: **Next.js** (auto-detected)
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` → your Render service URL (e.g. `https://labflow-api.onrender.com`)
5. Deploy — Vercel handles builds and CDN automatically

### Supabase

- Run `backend/migrations/001_initial_schema.sql` in the SQL editor
- Create a storage bucket named `labflow-uploads`, set to **private**
- The backend uses the service role key — never expose it to the frontend

### CORS

Set `CORS_ORIGINS` in your backend `.env` to your Vercel deployment URL:

```
CORS_ORIGINS=https://your-app.vercel.app
```

---

## 11. Configuration

### Backend `.env`

| Variable | Default | Description |
|---|---|---|
| `SUPABASE_URL` | — | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | — | Service role key (server-side only — never expose publicly) |
| `SUPABASE_STORAGE_BUCKET` | `labflow-uploads` | Storage bucket name |
| `LLM_PROVIDER` | `openai` | `openai` / `azure` / `anthropic` / `local` |
| `LLM_BASE_URL` | `https://api.openai.com/v1` | Override for Azure, proxy, or local LLMs |
| `LLM_API_KEY` | — | LLM provider API key |
| `LLM_MODEL` | `gpt-4o` | Model name passed to the LLM provider |
| `APP_ENV` | `development` | `development` or `production` |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated list of allowed frontend origins |
| `DEMO_MODE` | `true` | Auto-seed example workflows on first startup |

### Frontend `.env.local`

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend FastAPI base URL |

---

## 12. API Reference

Interactive docs available at runtime:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

| Method | Path | Description |
|---|---|---|
| `POST` | `/workflows` | Create workflow from protocol text |
| `GET` | `/workflows` | List all workflows with step/run counts |
| `GET` | `/workflows/{id}` | Full workflow detail — steps, materials, parameters, schema |
| `POST` | `/documents/upload` | Upload PDF, TXT, or CSV — returns extracted text |
| `POST` | `/runs` | Start an experiment run against a workflow |
| `POST` | `/runs/{id}/upload-output` | Upload CSV and map columns to output schema |
| `POST` | `/runs/{id}/summarize` | Generate run summary (planned vs actual) |
| `GET` | `/runs/{id}` | Fetch run with all mapped outputs |
| `GET` | `/audit` | Query audit events by workflow or run ID |
| `GET` | `/health` | Backend health check — returns env and demo mode status |

---

## 13. Traceability and Human Review

Every significant action in LabFlow AI is recorded in `audit_events` — an append-only table with a timestamp, event type, actor, and JSON detail payload. The trail covers:

- Workflow creation and protocol parse confidence
- Document uploads and file metadata
- Run creation and output mapping
- Summary generation and overall status

**This is an informational audit trail, not a compliance-grade electronic record.** For GxP, 21 CFR Part 11, or EU Annex 11 environments, you would need to layer on top: user authentication with non-repudiation, electronic signatures, a validated system, and a formally tested audit trail. LabFlow AI is designed as a foundation that a compliance engineer could build toward — not a finished compliance system.

**Human review is non-negotiable by design.** The system:
- Never auto-approves a workflow or a run
- Always surfaces ambiguities before a run can be started
- Flags every output field that could not be matched or normalized
- Includes a "requires human review" section in every run summary
- Stores LLM confidence scores in the database so they can be queried

Scientists should treat all AI-extracted content as a first draft — accurate starting points that still require domain verification.

---

## 14. Future Improvements

### Automation
- **Scheduled re-parsing** — automatically detect when an SOP has changed and re-extract the workflow diff
- **Instrument integrations** — native connectors for plate readers, qPCR machines, and HPLC systems to eliminate manual CSV export
- **Auto-run initiation** — trigger run records from instrument start events via webhook

### Integrations
- **ELN connectors** — Benchling, Labguru, SciNote — push structured workflows and run records directly into electronic lab notebooks
- **LIMS integrations** — LabWare, StarLIMS — sync sample metadata and run results bidirectionally
- **Cloud storage** — S3, Google Drive, SharePoint — ingest documents directly from where scientists already keep them
- **Slack / Teams** — notify scientists when ambiguities are flagged or a run summary is ready for review

### Collaboration
- **Multi-user workspaces** — team-scoped workflows with role-based access (viewer, editor, approver)
- **Review and approval flow** — structured sign-off steps before a workflow moves from draft to active
- **Comments and annotations** — inline discussion on individual steps and flagged fields
- **Template sharing** — publish and fork validated workflow templates across teams or organizations

### Versioning
- **Workflow versions** — immutable version history for every workflow edit, with diff views
- **SOP change tracking** — detect when an uploaded document has changed and highlight what was added, removed, or modified
- **Run lineage** — trace which version of a workflow each run was executed against
- **Rollback** — restore a prior workflow version without losing run history

### Intelligence
- **Cross-run analytics** — surface trends across runs: which steps have the highest flag rate, which output fields are most often missing
- **Protocol recommendations** — suggest improvements to ambiguous SOPs based on patterns across the workflow library
- **Anomaly detection** — flag run output values that fall outside historical ranges for the same workflow

---

## Repo Structure

```
labflowai/
├── backend/
│   ├── app/
│   │   ├── main.py                    FastAPI entry point + lifespan
│   │   ├── config.py                  Pydantic Settings (all env vars)
│   │   ├── database.py                Supabase client singleton
│   │   ├── schemas.py                 Typed API contracts (request + response)
│   │   ├── routers/
│   │   │   ├── workflows.py           Workflow CRUD + parse-and-structure
│   │   │   ├── documents.py           File upload endpoint
│   │   │   ├── runs.py                Experiment runs + CSV output mapping
│   │   │   └── audit.py              Audit event queries
│   │   └── services/
│   │       ├── document_ingestion.py  File validation, text extraction, storage upload
│   │       ├── protocol_parser.py     LLM-based protocol parsing → ParsedProtocol
│   │       ├── workflow_structurer.py ParsedProtocol → normalized DB row dicts
│   │       ├── metadata_checker.py    Rule-based ambiguity detection
│   │       ├── output_mapper.py       CSV → OutputSchema fuzzy mapping
│   │       ├── run_summary_generator.py Planned vs actual + LLM narrative
│   │       └── audit_logger.py        Immutable audit event writer
│   ├── migrations/
│   │   └── 001_initial_schema.sql     Full Supabase Postgres schema
│   ├── seeds/
│   │   ├── sample_sops/               ELISA assay · RT-qPCR · Acid-base titration
│   │   ├── sample_csvs/               ELISA results · Titration results
│   │   └── seed_demo.py               Demo workflow + run loader
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx               Landing page
    │   │   ├── dashboard/page.tsx     Workflow list
    │   │   ├── new/page.tsx           Create workflow from text
    │   │   ├── workflows/[id]/page.tsx Workflow detail (5-tab view)
    │   │   ├── upload/page.tsx        File uploader with drag-and-drop
    │   │   └── settings/page.tsx      Env config + live health check
    │   ├── components/
    │   │   ├── Nav.tsx                Global navigation
    │   │   ├── WorkflowCard.tsx       Dashboard workflow card
    │   │   ├── StepList.tsx           Numbered step renderer
    │   │   ├── MetadataWarnings.tsx   Ambiguity alert panel
    │   │   ├── OutputPanel.tsx        Mapped output table with flag status
    │   │   ├── RunSummaryPanel.tsx    Four-quadrant run summary
    │   │   ├── AuditTimeline.tsx      Timestamped event timeline
    │   │   └── StatusBadge.tsx        Status label component
    │   └── lib/
    │       ├── api.ts                 Typed API client
    │       ├── types.ts               TypeScript interfaces
    │       └── utils.ts               Date formatting helpers
    ├── public/sample-sops/            Sample protocols served for demo load
    └── .env.example
```

---

## License

MIT. See `LICENSE`.
