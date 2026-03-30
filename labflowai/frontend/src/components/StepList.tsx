import type { WorkflowStep } from '@/lib/types'

export function StepList({ steps }: { steps: WorkflowStep[] }) {
  if (!steps.length) return <p className="text-sm text-gray-400">No steps extracted.</p>

  return (
    <ol className="space-y-3">
      {steps.map((step) => (
        <li key={step.id} className="flex gap-4">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center mt-0.5">
            {step.step_number}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{step.title}</p>
            <p className="text-sm text-gray-600 mt-0.5">{step.description}</p>
            <div className="flex gap-3 mt-1 text-xs text-gray-400">
              {step.duration_minutes != null && (
                <span>⏱ {step.duration_minutes} min</span>
              )}
              {step.temperature_celsius != null && (
                <span>🌡 {step.temperature_celsius}°C</span>
              )}
              {step.notes && <span className="text-amber-600">ℹ {step.notes}</span>}
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
