'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkflow } from '@/lib/api'

const SAMPLE_PROTOCOLS = [
  { label: '🧫  ELISA Assay',         file: 'elisa_assay',        desc: 'Sandwich ELISA for IL-6 quantification' },
  { label: '🧬  RT-qPCR',             file: 'pcr_protocol',       desc: 'SYBR Green gene expression' },
  { label: '⚗️  Acid-Base Titration', file: 'titration_protocol', desc: 'Vinegar acetic acid determination' },
]

const PARSE_STAGES = [
  'Reading protocol text…',
  'Identifying materials and reagents…',
  'Extracting numbered steps…',
  'Detecting ambiguities…',
  'Generating output schema…',
  'Finalising structured workflow…',
]

export default function NewWorkflowPage() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [stageIdx, setStageIdx] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    setStageIdx(0)

    // Cycle through stage labels while waiting
    const interval = setInterval(() => {
      setStageIdx((i) => (i + 1) % PARSE_STAGES.length)
    }, 1800)

    try {
      const wf = await createWorkflow(text, title || undefined)
      clearInterval(interval)
      router.push(`/workflows/${wf.id}`)
    } catch (e: unknown) {
      clearInterval(interval)
      setError(e instanceof Error ? e.message : String(e))
      setLoading(false)
    }
  }

  async function loadSample(file: string) {
    setError(null)
    try {
      const res = await fetch(`/sample-sops/${file}.txt`)
      if (!res.ok) throw new Error('Not found')
      const t = await res.text()
      setText(t)
    } catch {
      setError('Could not load sample — paste your own text instead.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">New Workflow</h1>
        <p className="text-sm text-gray-500">
          Paste any SOP, protocol draft, or experiment description. The AI will extract
          steps, materials, parameters, and flag ambiguities before you run anything.
        </p>
      </div>

      {/* Sample loaders */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
          Load a sample protocol
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SAMPLE_PROTOCOLS.map((s) => (
            <button
              key={s.file}
              type="button"
              onClick={() => loadSample(s.file)}
              disabled={loading}
              className="text-left p-3 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors disabled:opacity-50"
            >
              <div className="text-sm font-medium text-gray-800">{s.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Workflow title{' '}
            <span className="text-gray-400 font-normal">(optional — extracted from text if blank)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            placeholder="e.g. Human IL-6 ELISA Assay v2"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Protocol text <span className="text-red-500">*</span>
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            disabled={loading}
            rows={18}
            placeholder="Paste your SOP, protocol, or experiment description here…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y disabled:opacity-50"
          />
          {text && (
            <p className="text-xs text-gray-400 mt-1">
              {text.split(/\s+/).filter(Boolean).length} words · {text.split('\n').length} lines
            </p>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-4">
            <strong>Parse failed:</strong> {error}
          </div>
        )}

        {loading ? (
          /* Animated parse progress */
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="text-sm font-medium text-brand-700">
                {PARSE_STAGES[stageIdx]}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-brand-500 h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${((stageIdx + 1) / PARSE_STAGES.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-3">
              AI is extracting structure — this typically takes 5–30 seconds.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!text.trim()}
              className="btn-primary px-6 py-2.5"
            >
              Parse Protocol →
            </button>
            <span className="text-xs text-gray-400">
              Powered by AI · human review always required
            </span>
          </div>
        )}
      </form>
    </div>
  )
}
