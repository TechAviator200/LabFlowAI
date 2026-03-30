export function MetadataWarnings({ ambiguities }: { ambiguities: string[] }) {
  if (!ambiguities.length) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3 border border-green-200">
        <span>✓</span>
        <span>No ambiguities detected. Always verify with a domain expert.</span>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h4 className="text-sm font-semibold text-amber-900 mb-2">
        ⚠ {ambiguities.length} ambiguit{ambiguities.length === 1 ? 'y' : 'ies'} detected
      </h4>
      <ul className="space-y-1.5">
        {ambiguities.map((a, i) => (
          <li key={i} className="text-sm text-amber-800 flex gap-2">
            <span className="text-amber-400 flex-shrink-0">•</span>
            <span>{a}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-amber-700">
        These items were flagged by automated analysis and require human review before use in production workflows.
      </p>
    </div>
  )
}
