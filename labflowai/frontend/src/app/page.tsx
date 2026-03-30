import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="py-20 text-center">
        <div className="inline-flex items-center gap-2 badge badge-blue mb-5 text-xs px-3 py-1 font-semibold uppercase tracking-wider">
          Demo · No login required
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 tracking-tight mb-5 leading-tight">
          SOPs in.{' '}
          <span className="text-brand-600">Structured workflows</span> out.
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          LabFlow AI turns unstructured protocol text into traceable, version-controlled
          experiment workflows — with AI-detected ambiguities flagged before you run anything.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="btn-primary text-base px-7 py-3 shadow-sm">
            View Demo Workflows →
          </Link>
          <Link href="/new" className="btn-secondary text-base px-7 py-3">
            Parse a Protocol
          </Link>
        </div>
        <p className="mt-4 text-xs text-gray-400">
          3 pre-loaded demo workflows · ELISA · RT-qPCR · Acid-Base Titration
        </p>
      </section>

      {/* ── Live demo preview ────────────────────────────────────────────── */}
      <section className="mb-20">
        <div className="card overflow-hidden">
          {/* Mock browser chrome */}
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="ml-3 flex-1 bg-white rounded text-xs text-gray-400 px-3 py-1 max-w-xs">
              localhost:3000/workflows/elisa-demo
            </div>
          </div>
          {/* Split panel preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {/* Left: raw SOP */}
            <div className="p-6 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Raw SOP Input</span>
              </div>
              <pre className="text-xs text-gray-500 font-mono leading-relaxed whitespace-pre-wrap line-clamp-12">
{`Human IL-6 ELISA — Sandwich Assay

Objective: Quantify IL-6 in cell culture
supernatants using a sandwich ELISA.

Materials:
- 96-well MaxiSorp plate
- Capture antibody anti-IL-6 MAB206 (4 µg/mL)
- Biotinylated detection antibody
- Streptavidin-HRP conjugate

Steps:
1. Coat plate with capture antibody in PBS.
   Seal and incubate overnight at 4°C.
2. Wash wells 3× with wash buffer.
3. Block with 300 µL blocking buffer, 1h RT.
...`}
              </pre>
            </div>
            {/* Right: structured output */}
            <div className="p-6 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                <span className="text-xs font-semibold text-brand-600 uppercase tracking-wide">AI-Extracted Structure</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="badge-blue text-xs">8 steps</span>
                  <span className="badge-green text-xs">7 materials</span>
                  <span className="badge-gray text-xs">5 output fields</span>
                  <span className="ml-auto text-xs font-semibold text-green-600">92% confidence</span>
                </div>
                {PREVIEW_STEPS.map((s, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <span className="font-medium text-gray-800">{s.title}</span>
                      {s.temp && (
                        <span className="ml-2 text-xs text-amber-600 font-medium">{s.temp}</span>
                      )}
                      {s.dur && (
                        <span className="ml-1 text-xs text-blue-600">{s.dur}</span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                  <strong>⚠ 2 ambiguities flagged</strong> — detection antibody dilution not specified.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature grid ─────────────────────────────────────────────────── */}
      <section className="mb-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
          Everything your team needs before pressing run
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center text-xl mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="mb-20">
        <div className="card p-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-8 text-center">How it works</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col items-center text-center w-32">
                  <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm mb-2 shadow-sm">
                    {i + 1}
                  </div>
                  <p className="text-xs font-medium text-gray-600 leading-snug">{s}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="text-brand-300 text-2xl hidden sm:block mb-5">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="mb-16 text-center">
        <div className="card p-10 bg-brand-50 border-brand-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">See it in action — no signup</h2>
          <p className="text-gray-500 mb-6 max-w-lg mx-auto">
            Three complete demo workflows are pre-loaded. Click through to explore AI-extracted
            steps, mapped outputs, run summaries, and the full audit trail.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard" className="btn-primary px-8 py-3">
              Open Demo Dashboard →
            </Link>
            <Link href="/new" className="btn-secondary px-8 py-3">
              Parse your own SOP
            </Link>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ───────────────────────────────────────────────────── */}
      <div className="mb-16 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
        <strong>Important:</strong> LabFlow AI is a workflow support tool, not an autonomous scientific
        decision-maker. All AI-extracted structure requires human review before use in experiments.
        This product is not validated for GxP, FDA, EMA, or any other regulatory framework.
      </div>
    </div>
  )
}

const PREVIEW_STEPS = [
  { title: 'Coat plate',              temp: '4°C overnight', dur: null },
  { title: 'Wash (3×)',               temp: null,            dur: null },
  { title: 'Block',                   temp: '22°C',          dur: '60 min' },
  { title: 'Add samples + standards', temp: '22°C',          dur: '120 min' },
  { title: 'Add detection antibody',  temp: '22°C',          dur: '60 min' },
]

const FEATURES = [
  {
    icon: '📄',
    title: 'Protocol Parsing',
    description:
      'Paste or upload any SOP, protocol draft, or free-text description. AI extracts steps, materials, parameters, and expected outputs into a structured schema.',
  },
  {
    icon: '⚠️',
    title: 'Ambiguity Detection',
    description:
      'Missing units, undefined concentrations, unspecified temperatures — automatically flagged with plain-English explanations before you run anything.',
  },
  {
    icon: '📊',
    title: 'Output Mapping',
    description:
      'Upload instrument CSV exports and automatically map columns to your workflow schema. Discrepancies, missing fields, and out-of-range values are highlighted for review.',
  },
  {
    icon: '🔍',
    title: 'Confidence Scoring',
    description:
      'Every AI parse includes a confidence score and detailed reasoning. Know exactly how certain the system is — and where human judgment is required.',
  },
  {
    icon: '📋',
    title: 'Audit Trail',
    description:
      'Immutable, timestamped log of every action — protocol parsed, run started, outputs mapped, summary generated. Human-in-the-loop by design.',
  },
  {
    icon: '🔄',
    title: 'Run Comparison',
    description:
      'Side-by-side planned vs. actual output summaries. Missing required data and flagged fields are surfaced immediately so nothing falls through the cracks.',
  },
]

const STEPS = [
  'Paste or upload protocol',
  'AI extracts structure',
  'Review ambiguities',
  'Upload CSV outputs',
  'Generate run summary',
]
