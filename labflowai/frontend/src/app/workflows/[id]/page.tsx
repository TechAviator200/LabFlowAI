'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getWorkflow, listAuditEvents, createRun, uploadRunOutput, summarizeRun, createWorkflow } from '@/lib/api'
import type { Workflow, AuditEvent, ExperimentRun } from '@/lib/types'
import { StepList } from '@/components/StepList'
import { MetadataWarnings } from '@/components/MetadataWarnings'
import { OutputPanel } from '@/components/OutputPanel'
import { RunSummaryPanel } from '@/components/RunSummaryPanel'
import { AuditTimeline } from '@/components/AuditTimeline'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfidencePanel } from '@/components/ConfidencePanel'
import { formatDate } from '@/lib/utils'

type Tab = 'structure' | 'analysis' | 'source' | 'outputs' | 'summary' | 'audit'

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [audit, setAudit] = useState<AuditEvent[]>([])
  const [run, setRun] = useState<ExperimentRun | null>(null)
  const [tab, setTab] = useState<Tab>('structure')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [runLoading, setRunLoading] = useState(false)
  const [reparseLoading, setReparseLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([getWorkflow(id), listAuditEvents(id)])
      .then(([wf, ev]) => {
        setWorkflow(wf)
        setAudit(ev)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleStartRun() {
    if (!workflow) return
    setRunLoading(true)
    try {
      const r = await createRun(workflow.id)
      setRun(r)
      setTab('outputs')
    } finally {
      setRunLoading(false)
    }
  }

  async function handleUploadCSV(file: File) {
    if (!run) return
    setRunLoading(true)
    try {
      const updated = await uploadRunOutput(run.id, file)
      setRun(updated)
    } finally {
      setRunLoading(false)
    }
  }

  async function handleSummarize() {
    if (!run) return
    setRunLoading(true)
    try {
      const updated = await summarizeRun(run.id)
      setRun(updated)
      const ev = await listAuditEvents(id)
      setAudit(ev)
      setTab('summary')
    } finally {
      setRunLoading(false)
    }
  }

  async function handleReparse() {
    if (!workflow?.source_text) return
    setReparseLoading(true)
    try {
      const newWf = await createWorkflow(workflow.source_text, workflow.title)
      router.push(`/workflows/${newWf.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setReparseLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mr-3" />
        Loading workflow…
      </div>
    )
  }
  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="card p-6 border-red-200 bg-red-50 text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      </div>
    )
  }
  if (!workflow) return null

  const needsReview = workflow.ambiguities.length > 0

  const tabs: { key: Tab; label: string; badge?: string }[] = [
    { key: 'structure', label: 'Extracted Structure' },
    { key: 'analysis',  label: 'AI Analysis',    badge: needsReview ? String(workflow.ambiguities.length) : undefined },
    { key: 'source',    label: 'Source Document' },
    { key: 'outputs',   label: 'Mapped Outputs'  },
    { key: 'summary',   label: 'Run Summary'     },
    { key: 'audit',     label: 'Audit Trail'     },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{workflow.title}</h1>
            <StatusBadge status={workflow.status} />
            <span className="badge badge-gray text-xs">v{workflow.version ?? 1}</span>
            {needsReview && (
              <span className="badge badge-yellow text-xs font-semibold">⚠ Requires Human Review</span>
            )}
          </div>
          {workflow.objective && (
            <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">{workflow.objective}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">Created {formatDate(workflow.created_at)}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
          {workflow.source_text && (
            <button
              onClick={handleReparse}
              disabled={reparseLoading}
              title="Re-run AI parsing on the original source text"
              className="btn-secondary text-xs"
            >
              {reparseLoading ? 'Parsing…' : '↻ Re-parse'}
            </button>
          )}
          {!run && (
            <button onClick={handleStartRun} disabled={runLoading} className="btn-primary">
              {runLoading ? 'Starting…' : '▶ Start Run'}
            </button>
          )}
          {run && !run.run_summary && (
            <button onClick={handleSummarize} disabled={runLoading} className="btn-primary">
              {runLoading ? 'Generating…' : '✦ Generate Summary'}
            </button>
          )}
        </div>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="flex gap-0.5 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === t.key
                ? 'border-brand-500 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.label}
            {t.badge && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Extracted Structure ────────────────────────────────────────── */}
      {tab === 'structure' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6 space-y-6">
            <Section title="Protocol Steps">
              {workflow.steps.length === 0 ? (
                <p className="text-sm text-gray-400">No steps extracted.</p>
              ) : (
                <StepList steps={workflow.steps} />
              )}
            </Section>
          </div>
          <div className="space-y-4">
            <div className="card p-5">
              <Section title="Materials">
                {workflow.materials.length === 0 ? (
                  <p className="text-sm text-gray-400">None extracted.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {workflow.materials.map((m) => (
                      <li key={m.id} className="text-gray-700">
                        <span className="font-medium">{m.name}</span>
                        {m.quantity && ` — ${m.quantity}${m.unit ? ' ' + m.unit : ''}`}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
            <div className="card p-5">
              <Section title="Parameters">
                {workflow.parameters.length === 0 ? (
                  <p className="text-sm text-gray-400">None extracted.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {workflow.parameters.map((p) => (
                      <li key={p.id} className="text-gray-700">
                        <span className="font-medium">{p.name}</span>
                        {p.value && `: ${p.value}${p.unit ? ' ' + p.unit : ''}`}
                        {p.expected_range && (
                          <span className="text-gray-400"> (range: {p.expected_range})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
            <div className="card p-5">
              <Section title="Expected Output Fields">
                {workflow.output_schema.length === 0 ? (
                  <p className="text-sm text-gray-400">None defined.</p>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    {workflow.output_schema.map((f) => (
                      <li key={f.id} className="text-gray-700 flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          {f.field_type}
                        </span>
                        <span className="font-medium">{f.field_name}</span>
                        {f.required && (
                          <span className="badge-red text-xs">required</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: AI Analysis ────────────────────────────────────────────────── */}
      {tab === 'analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConfidencePanel workflow={workflow} />

          <div className="card p-6 space-y-5">
            <Section title="What the AI extracted">
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  This workflow was parsed from{' '}
                  <strong>
                    {workflow.source_text
                      ? `${workflow.source_text.split(/\s+/).length} words`
                      : 'an unknown source'}
                  </strong>{' '}
                  of protocol text.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Steps extracted',        val: workflow.steps.length },
                    { label: 'Materials identified',   val: workflow.materials.length },
                    { label: 'Parameters captured',    val: workflow.parameters.length },
                    { label: 'Output fields defined',  val: workflow.output_schema.length },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="text-2xl font-bold text-brand-700">{s.val}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Section title="Human review checklist">
              <ul className="space-y-2 text-sm">
                {REVIEW_CHECKLIST.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600">
                    <span className="w-4 h-4 rounded border border-gray-300 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-gray-400">
                Tick each item manually before starting a run.
              </p>
            </Section>
          </div>
        </div>
      )}

      {/* ── Tab: Source Document ────────────────────────────────────────────── */}
      {tab === 'source' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: raw text */}
          <div className="card p-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Original Protocol Text
            </h3>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-4 max-h-[600px] overflow-y-auto leading-relaxed">
              {workflow.source_text || 'No source text stored.'}
            </pre>
          </div>
          {/* Right: extracted steps for comparison */}
          <div className="card p-6">
            <h3 className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-3">
              AI-Extracted Steps
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {workflow.steps.length === 0 ? (
                <p className="text-sm text-gray-400">No steps extracted.</p>
              ) : (
                workflow.steps.map((s) => (
                  <div key={s.id} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {s.step_number}
                    </span>
                    <div className="text-sm">
                      <div className="font-medium text-gray-800">{s.title}</div>
                      <div className="text-gray-500 mt-0.5">{s.description}</div>
                      <div className="flex gap-3 mt-1 text-xs">
                        {s.duration_minutes && (
                          <span className="text-blue-600">{s.duration_minutes} min</span>
                        )}
                        {s.temperature_celsius && (
                          <span className="text-amber-600">{s.temperature_celsius}°C</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Mapped Outputs ─────────────────────────────────────────────── */}
      {tab === 'outputs' && (
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Mapped Run Outputs</h3>
              {run && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Run ID: <span className="font-mono">{run.id.slice(0, 8)}…</span>
                </p>
              )}
            </div>
            {run && (
              <div className="flex items-center gap-3">
                <StatusBadge status={run.status} />
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUploadCSV(e.target.files[0])}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={runLoading}
                  className="btn-secondary text-xs"
                >
                  {runLoading ? 'Uploading…' : '↑ Upload CSV'}
                </button>
              </div>
            )}
          </div>
          {!run ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-sm mb-3">Start a run to upload and map CSV outputs.</p>
              <button onClick={handleStartRun} disabled={runLoading} className="btn-primary text-sm">
                {runLoading ? 'Starting…' : '▶ Start Run'}
              </button>
            </div>
          ) : (
            <OutputPanel outputs={run.outputs} />
          )}
        </div>
      )}

      {/* ── Tab: Run Summary ────────────────────────────────────────────────── */}
      {tab === 'summary' && (
        <div className="card p-6">
          {run?.run_summary ? (
            <RunSummaryPanel summary={run.run_summary} />
          ) : (
            <div className="text-center py-10 text-gray-400">
              <p className="text-sm mb-3">
                {run
                  ? 'Upload outputs and click "Generate Summary" to produce a run summary.'
                  : 'Start a run to access this section.'}
              </p>
              {!run && (
                <button onClick={handleStartRun} disabled={runLoading} className="btn-primary text-sm">
                  ▶ Start Run
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Audit Trail ────────────────────────────────────────────────── */}
      {tab === 'audit' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Audit Trail</h3>
            <span className="text-xs text-gray-400">{audit.length} events</span>
          </div>
          <AuditTimeline events={audit} />
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  )
}

const REVIEW_CHECKLIST = [
  'Verify all extracted steps match the original document',
  'Confirm all temperatures and durations are correct',
  'Check that all required materials are present and quantities are accurate',
  'Review any flagged ambiguities and resolve them before running',
  'Confirm the output schema matches expected instrument outputs',
]
