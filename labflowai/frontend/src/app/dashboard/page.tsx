'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listWorkflows } from '@/lib/api'
import type { WorkflowListItem } from '@/lib/types'
import { WorkflowCard } from '@/components/WorkflowCard'

export default function DashboardPage() {
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listWorkflows()
      .then(setWorkflows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            AI-extracted experiment workflows ready to run.
          </p>
        </div>
        <Link href="/new" className="btn-primary">
          + New Workflow
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24 text-gray-400">
          <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mr-3" />
          Loading workflows…
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-semibold mb-1">Could not connect to backend.</p>
          <p className="text-red-600">{error}</p>
          <p className="mt-2 text-xs text-red-500">
            Make sure the backend is running on port 8000.
            See README for setup instructions.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && workflows.length === 0 && (
        <div className="card p-16 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-2xl mx-auto mb-4">
            📋
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No workflows yet</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Parse your first SOP to create a structured workflow. The AI will extract steps,
            materials, parameters, and flag any ambiguities.
          </p>
          <Link href="/new" className="btn-primary">
            Parse your first protocol →
          </Link>
        </div>
      )}

      {/* Workflow grid */}
      {!loading && !error && workflows.length > 0 && (
        <>
          <p className="text-xs text-gray-400 mb-4">
            {workflows.length} workflow{workflows.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workflows.map((wf) => (
              <WorkflowCard key={wf.id} wf={wf} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
