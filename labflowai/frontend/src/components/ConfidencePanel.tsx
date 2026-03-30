import type { Workflow } from '@/lib/types'

interface Props {
  workflow: Workflow
}

function confidenceLabel(c: number): { label: string; color: string; bg: string; bar: string } {
  if (c >= 0.85) return { label: 'High',   color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  bar: 'bg-green-500' }
  if (c >= 0.65) return { label: 'Good',   color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',    bar: 'bg-blue-500' }
  if (c >= 0.45) return { label: 'Medium', color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',  bar: 'bg-amber-500' }
  return               { label: 'Low',    color: 'text-red-700',    bg: 'bg-red-50 border-red-200',      bar: 'bg-red-500'   }
}

export function ConfidencePanel({ workflow }: Props) {
  const hasConfidence = workflow.confidence != null
  const raw = workflow.confidence ?? 0
  const pct = Math.round(raw * 100)
  const tier = confidenceLabel(raw)

  const stepCount    = workflow.steps.length
  const matCount     = workflow.materials.length
  const paramCount   = workflow.parameters.length
  const outputCount  = workflow.output_schema.length
  const ambigCount   = workflow.ambiguities.length

  return (
    <div className={`rounded-xl border p-5 ${tier.bg} space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">AI Parse Analysis</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Self-assessed confidence from the language model
          </p>
        </div>
        <div className="text-right">
          {hasConfidence ? (
            <>
              <span className={`text-3xl font-extrabold ${tier.color}`}>{pct}%</span>
              <p className={`text-xs font-semibold ${tier.color} mt-0.5`}>{tier.label} confidence</p>
            </>
          ) : (
            <span className="text-sm text-gray-400 italic">Not scored</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {hasConfidence && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${tier.bar} h-2 rounded-full transition-all duration-700`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Extraction stats */}
      <div className="grid grid-cols-4 gap-3 text-center">
        {[
          { label: 'Steps',    val: stepCount   },
          { label: 'Materials', val: matCount   },
          { label: 'Params',   val: paramCount  },
          { label: 'Outputs',  val: outputCount },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-white/80 py-2.5 px-1 shadow-sm">
            <div className="text-lg font-bold text-gray-900">{s.val}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ambiguity summary */}
      {ambigCount === 0 ? (
        <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
          <span>✓</span>
          <span>No ambiguities detected — protocol appears complete.</span>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 text-sm text-amber-700 font-semibold mb-2">
            <span>⚠</span>
            <span>{ambigCount} issue{ambigCount !== 1 ? 's' : ''} flagged for human review</span>
          </div>
          <ul className="space-y-1.5">
            {workflow.ambiguities.map((a, i) => (
              <li key={i} className="flex gap-2 text-xs text-gray-700">
                <span className="text-amber-500 flex-shrink-0 mt-0.5">•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Guidance */}
      {raw < 0.65 && (
        <div className="rounded-lg bg-white border border-amber-200 p-3 text-xs text-amber-800">
          <strong>Review recommended:</strong> Confidence is below 65%. Check the extracted
          steps against the source document before starting a run.
        </div>
      )}
    </div>
  )
}
