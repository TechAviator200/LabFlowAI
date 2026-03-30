import type { AuditEvent } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  'workflow.created':   { label: 'Workflow created',        color: 'bg-brand-500' },
  'workflow.updated':   { label: 'Workflow updated',        color: 'bg-blue-400'  },
  'document.uploaded':  { label: 'Document uploaded',       color: 'bg-purple-400'},
  'protocol.parsed':    { label: 'Protocol parsed by AI',   color: 'bg-indigo-400'},
  'run.created':        { label: 'Run started',             color: 'bg-gray-400'  },
  'outputs.mapped':     { label: 'Outputs mapped',          color: 'bg-teal-400'  },
  'summary.generated':  { label: 'Summary generated',       color: 'bg-green-400' },
  'demo.seeded':        { label: 'Demo data loaded',        color: 'bg-amber-400' },
}

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  if (!events.length) return <p className="text-sm text-gray-400">No audit events yet.</p>

  return (
    <ol className="relative border-l border-gray-200 ml-3 space-y-4">
      {events.map((ev) => {
        const meta = EVENT_LABELS[ev.event_type] ?? { label: ev.event_type, color: 'bg-gray-300' }
        return (
          <li key={ev.id} className="pl-6">
            <span
              className={`absolute -left-1.5 w-3 h-3 rounded-full border-2 border-white ${meta.color}`}
            />
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-900">{meta.label}</span>
              <span className="text-xs text-gray-400">{formatDateTime(ev.created_at)}</span>
              <span className="text-xs text-gray-400 italic">by {ev.actor}</span>
            </div>
            {Object.keys(ev.detail).length > 0 && (
              <pre className="text-xs text-gray-500 mt-0.5 font-mono whitespace-pre-wrap">
                {JSON.stringify(ev.detail, null, 2)}
              </pre>
            )}
          </li>
        )
      })}
    </ol>
  )
}
