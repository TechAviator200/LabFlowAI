import type { RunOutput } from '@/lib/types'
import clsx from 'clsx'

export function OutputPanel({ outputs }: { outputs: RunOutput[] }) {
  if (!outputs.length) {
    return <p className="text-sm text-gray-400">No outputs mapped yet. Upload a CSV to get started.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 pr-4 font-medium text-gray-500">Field</th>
            <th className="text-left py-2 pr-4 font-medium text-gray-500">Value</th>
            <th className="text-left py-2 pr-4 font-medium text-gray-500">Unit</th>
            <th className="text-left py-2 font-medium text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {outputs.map((o) => (
            <tr key={o.id} className={clsx(o.flagged && 'bg-red-50')}>
              <td className="py-2 pr-4 font-mono text-xs text-gray-700">{o.field_name}</td>
              <td className="py-2 pr-4 text-gray-900 max-w-xs truncate" title={o.normalized_value ?? o.raw_value ?? ''}>
                {o.normalized_value ?? o.raw_value ?? <span className="text-gray-400">—</span>}
              </td>
              <td className="py-2 pr-4 text-gray-500">{o.unit ?? '—'}</td>
              <td className="py-2">
                {o.flagged ? (
                  <span className="badge-red" title={o.flag_reason ?? ''}>
                    ⚠ Review
                  </span>
                ) : (
                  <span className="badge-green">✓ OK</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
