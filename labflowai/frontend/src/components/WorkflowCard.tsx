import Link from 'next/link'
import type { WorkflowListItem } from '@/lib/types'
import { StatusBadge } from './StatusBadge'
import { formatDate } from '@/lib/utils'

export function WorkflowCard({ wf }: { wf: WorkflowListItem }) {
  return (
    <Link
      href={`/workflows/${wf.id}`}
      className="card p-5 block hover:border-brand-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 truncate leading-tight">
            {wf.title}
          </h3>
          {wf.objective && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{wf.objective}</p>
          )}
        </div>
        <StatusBadge status={wf.status} />
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1 text-gray-500">
          <span className="text-brand-500 font-bold">{wf.step_count}</span> steps
        </span>
        <span className="text-gray-300">·</span>
        <span className="inline-flex items-center gap-1 text-gray-500">
          <span className="font-semibold text-gray-700">{wf.run_count}</span> run{wf.run_count !== 1 ? 's' : ''}
        </span>
        <span className="ml-auto text-gray-400">{formatDate(wf.created_at)}</span>
      </div>
    </Link>
  )
}
