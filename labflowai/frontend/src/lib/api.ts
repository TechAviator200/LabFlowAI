import type {
  Workflow,
  WorkflowListItem,
  ExperimentRun,
  AuditEvent,
  UploadedDocument,
} from './types'

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${body}`)
  }
  return res.json()
}

// ── Workflows ─────────────────────────────────────────────────────────────────

export async function listWorkflows(): Promise<WorkflowListItem[]> {
  return req('/workflows')
}

export async function getWorkflow(id: string): Promise<Workflow> {
  return req(`/workflows/${id}`)
}

export async function createWorkflow(text: string, title?: string): Promise<Workflow> {
  return req('/workflows', {
    method: 'POST',
    body: JSON.stringify({ text, title }),
  })
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function uploadDocument(
  file: File,
  workflowId?: string
): Promise<UploadedDocument> {
  const form = new FormData()
  form.append('file', file)
  if (workflowId) form.append('workflow_id', workflowId)

  const res = await fetch(`${BASE}/documents/upload`, { method: 'POST', body: form })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${body}`)
  }
  return res.json()
}

// ── Runs ──────────────────────────────────────────────────────────────────────

export async function createRun(
  workflowId: string,
  operatorNotes?: string
): Promise<ExperimentRun> {
  return req('/runs', {
    method: 'POST',
    body: JSON.stringify({ workflow_id: workflowId, operator_notes: operatorNotes }),
  })
}

export async function getRun(id: string): Promise<ExperimentRun> {
  return req(`/runs/${id}`)
}

export async function uploadRunOutput(runId: string, file: File): Promise<ExperimentRun> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/runs/${runId}/upload-output`, { method: 'POST', body: form })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${body}`)
  }
  return res.json()
}

export async function summarizeRun(runId: string): Promise<ExperimentRun> {
  return req(`/runs/${runId}/summarize`, { method: 'POST', body: '{}' })
}

// ── Audit ─────────────────────────────────────────────────────────────────────

export async function listAuditEvents(
  workflowId?: string,
  runId?: string
): Promise<AuditEvent[]> {
  const params = new URLSearchParams()
  if (workflowId) params.set('workflow_id', workflowId)
  if (runId) params.set('run_id', runId)
  return req(`/audit?${params}`)
}

// ── Health ────────────────────────────────────────────────────────────────────

export async function healthCheck(): Promise<{ status: string; env: string; demo_mode: boolean }> {
  return req('/health')
}
