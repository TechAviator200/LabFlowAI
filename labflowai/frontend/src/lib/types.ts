// Core TypeScript types mirroring backend Pydantic schemas

export interface WorkflowStep {
  id: string
  step_number: number
  title: string
  description: string
  duration_minutes: number | null
  temperature_celsius: number | null
  notes: string | null
}

export interface Material {
  id: string
  name: string
  quantity: string | null
  unit: string | null
  catalog_number: string | null
  notes: string | null
}

export interface Parameter {
  id: string
  name: string
  value: string | null
  unit: string | null
  expected_range: string | null
}

export interface OutputSchemaField {
  id: string
  field_name: string
  field_type: string
  required: boolean
  description: string | null
}

export interface Workflow {
  id: string
  title: string
  objective: string | null
  status: 'draft' | 'active' | 'archived'
  source_text: string | null
  ambiguities: string[]
  confidence: number | null  // AI parse confidence 0–1
  version: number
  created_at: string
  updated_at: string
  steps: WorkflowStep[]
  materials: Material[]
  parameters: Parameter[]
  output_schema: OutputSchemaField[]
}

export interface WorkflowListItem {
  id: string
  title: string
  objective: string | null
  status: string
  created_at: string
  step_count: number
  run_count: number
}

export interface RunOutput {
  id: string
  field_name: string
  raw_value: string | null
  normalized_value: string | null
  unit: string | null
  flagged: boolean
  flag_reason: string | null
}

export interface RunSummary {
  planned: string[]
  executed: string[]
  missing: string[]
  review_required: string[]
  overall_status: 'complete' | 'partial' | 'review_required'
  narrative: string
}

export interface ExperimentRun {
  id: string
  workflow_id: string
  status: string
  operator_notes: string | null
  run_summary: RunSummary | null
  created_at: string
  outputs: RunOutput[]
}

export interface AuditEvent {
  id: string
  workflow_id: string | null
  run_id: string | null
  event_type: string
  actor: string
  detail: Record<string, unknown>
  created_at: string
}

export interface UploadedDocument {
  id: string
  workflow_id: string | null
  filename: string
  file_type: string
  storage_path: string
  extracted_text: string | null
  created_at: string
}
