-- LabFlow AI — Initial Schema
-- Run against your Supabase project via the SQL editor or supabase CLI.
-- Tables use UUID primary keys and created_at timestamps throughout.

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Workflows ────────────────────────────────────────────────────────────────
create table if not exists workflows (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  objective     text,
  status        text not null default 'draft',  -- draft | active | archived
  source_text   text,
  ambiguities   jsonb not null default '[]',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── Workflow Steps ───────────────────────────────────────────────────────────
create table if not exists workflow_steps (
  id                   uuid primary key default gen_random_uuid(),
  workflow_id          uuid not null references workflows(id) on delete cascade,
  step_number          int not null,
  title                text not null,
  description          text not null default '',
  duration_minutes     int,
  temperature_celsius  numeric(5,1),
  notes                text,
  created_at           timestamptz not null default now()
);
create index if not exists idx_steps_workflow on workflow_steps(workflow_id);

-- ─── Materials ────────────────────────────────────────────────────────────────
create table if not exists materials (
  id             uuid primary key default gen_random_uuid(),
  workflow_id    uuid not null references workflows(id) on delete cascade,
  name           text not null,
  quantity       text,
  unit           text,
  catalog_number text,
  notes          text,
  created_at     timestamptz not null default now()
);
create index if not exists idx_materials_workflow on materials(workflow_id);

-- ─── Parameters ───────────────────────────────────────────────────────────────
create table if not exists parameters (
  id             uuid primary key default gen_random_uuid(),
  workflow_id    uuid not null references workflows(id) on delete cascade,
  name           text not null,
  value          text,
  unit           text,
  expected_range text,
  created_at     timestamptz not null default now()
);
create index if not exists idx_parameters_workflow on parameters(workflow_id);

-- ─── Output Schemas ───────────────────────────────────────────────────────────
create table if not exists output_schemas (
  id           uuid primary key default gen_random_uuid(),
  workflow_id  uuid not null references workflows(id) on delete cascade,
  field_name   text not null,
  field_type   text not null default 'string', -- string | number | boolean | date
  required     boolean not null default false,
  description  text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_schemas_workflow on output_schemas(workflow_id);

-- ─── Uploaded Documents ───────────────────────────────────────────────────────
create table if not exists uploaded_documents (
  id             uuid primary key default gen_random_uuid(),
  workflow_id    uuid references workflows(id) on delete set null,
  filename       text not null,
  file_type      text not null,  -- txt | pdf | csv
  storage_path   text not null,
  extracted_text text,
  created_at     timestamptz not null default now()
);

-- ─── Experiment Runs ─────────────────────────────────────────────────────────
create table if not exists experiment_runs (
  id             uuid primary key default gen_random_uuid(),
  workflow_id    uuid not null references workflows(id) on delete cascade,
  status         text not null default 'created',  -- created | outputs_uploaded | complete | partial | review_required
  operator_notes text,
  run_summary    jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists idx_runs_workflow on experiment_runs(workflow_id);

-- ─── Run Outputs ──────────────────────────────────────────────────────────────
create table if not exists run_outputs (
  id                uuid primary key default gen_random_uuid(),
  run_id            uuid not null references experiment_runs(id) on delete cascade,
  field_name        text not null,
  raw_value         text,
  normalized_value  text,
  unit              text,
  flagged           boolean not null default false,
  flag_reason       text,
  created_at        timestamptz not null default now()
);
create index if not exists idx_outputs_run on run_outputs(run_id);

-- ─── Audit Events ─────────────────────────────────────────────────────────────
create table if not exists audit_events (
  id           uuid primary key default gen_random_uuid(),
  workflow_id  uuid references workflows(id) on delete set null,
  run_id       uuid references experiment_runs(id) on delete set null,
  event_type   text not null,
  actor        text not null default 'system',
  detail       jsonb not null default '{}',
  created_at   timestamptz not null default now()
);
create index if not exists idx_audit_workflow on audit_events(workflow_id);
create index if not exists idx_audit_run     on audit_events(run_id);
create index if not exists idx_audit_type    on audit_events(event_type);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_workflows_updated_at on workflows;
create trigger trg_workflows_updated_at
  before update on workflows
  for each row execute function set_updated_at();
