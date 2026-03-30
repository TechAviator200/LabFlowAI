import type { RunSummary } from '@/lib/types'
import { StatusBadge } from './StatusBadge'

export function RunSummaryPanel({ summary }: { summary: RunSummary }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Overall status:</span>
        <StatusBadge status={summary.overall_status} />
      </div>

      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed border border-gray-200">
        {summary.narrative}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Section
          title="Planned Steps"
          items={summary.planned}
          color="blue"
          emptyText="No steps recorded."
        />
        <Section
          title="Captured Outputs"
          items={summary.executed}
          color="green"
          emptyText="No outputs captured yet."
        />
        {summary.missing.length > 0 && (
          <Section
            title="Missing Required Data"
            items={summary.missing}
            color="red"
            emptyText=""
          />
        )}
        {summary.review_required.length > 0 && (
          <Section
            title="Requires Human Review"
            items={summary.review_required}
            color="yellow"
            emptyText=""
          />
        )}
      </div>
    </div>
  )
}

const colorMap = {
  blue:   'bg-blue-50 border-blue-200 text-blue-800',
  green:  'bg-green-50 border-green-200 text-green-800',
  red:    'bg-red-50 border-red-200 text-red-800',
  yellow: 'bg-amber-50 border-amber-200 text-amber-800',
}

function Section({
  title, items, color, emptyText,
}: {
  title: string
  items: string[]
  color: keyof typeof colorMap
  emptyText: string
}) {
  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <h5 className="text-xs font-semibold uppercase tracking-wide mb-2">{title}</h5>
      {items.length === 0 ? (
        <p className="text-sm opacity-70">{emptyText}</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="opacity-50 flex-shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
