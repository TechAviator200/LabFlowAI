'use client'
import { useEffect, useState } from 'react'
import { healthCheck } from '@/lib/api'

export default function SettingsPage() {
  const [health, setHealth] = useState<{ status: string; env: string; demo_mode: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    healthCheck()
      .then(setHealth)
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
      <p className="text-sm text-gray-500 mb-8">
        Environment configuration and provider status.
      </p>

      <div className="space-y-6">
        {/* Backend status */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Backend Status</h2>
          <dl className="space-y-3 text-sm">
            <Row label="API URL" value={apiUrl} mono />
            {health ? (
              <>
                <Row label="Status" value={<span className="text-green-700 font-medium">✓ {health.status}</span>} />
                <Row label="Environment" value={health.env} />
                <Row label="Demo mode" value={health.demo_mode ? 'Enabled' : 'Disabled'} />
              </>
            ) : error ? (
              <Row label="Status" value={<span className="text-red-600">✗ Unreachable — {error}</span>} />
            ) : (
              <Row label="Status" value="Checking…" />
            )}
          </dl>
        </div>

        {/* Environment variables guide */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Environment Variables</h2>
          <div className="space-y-4 text-sm">
            <EnvGroup title="Frontend (.env.local)">
              <EnvVar name="NEXT_PUBLIC_API_URL" desc="Backend FastAPI URL" example="http://localhost:8000" />
            </EnvGroup>
            <EnvGroup title="Backend (.env)">
              <EnvVar name="SUPABASE_URL" desc="Your Supabase project URL" example="https://xxx.supabase.co" />
              <EnvVar name="SUPABASE_SERVICE_KEY" desc="Supabase service role key (server-side only)" example="eyJ…" />
              <EnvVar name="LLM_API_KEY" desc="OpenAI (or compatible) API key" example="sk-…" />
              <EnvVar name="LLM_MODEL" desc="Model to use for protocol parsing" example="gpt-4o" />
              <EnvVar name="LLM_BASE_URL" desc="Override for Azure, local, or proxy endpoints" example="https://api.openai.com/v1" />
              <EnvVar name="DEMO_MODE" desc="Seed example workflows on first startup" example="true" />
            </EnvGroup>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          <strong>Governance reminder:</strong> LabFlow AI is a workflow support tool for research
          and early-stage development use. It is not validated for GxP, 21 CFR Part 11,
          EU Annex 11, or any other regulatory framework. All AI-extracted content must be
          reviewed and approved by a qualified scientist before being used in any
          regulated environment.
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-gray-500 flex-shrink-0">{label}</dt>
      <dd className={mono ? 'font-mono text-xs text-gray-600 text-right' : 'text-gray-900 text-right'}>{value}</dd>
    </div>
  )
}

function EnvGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function EnvVar({ name, desc, example }: { name: string; desc: string; example: string }) {
  return (
    <div className="flex items-start gap-3">
      <code className="font-mono text-xs bg-gray-100 text-gray-700 rounded px-1.5 py-0.5 flex-shrink-0">{name}</code>
      <div>
        <span className="text-gray-600">{desc}</span>
        <span className="text-gray-400 ml-1">· e.g. <code className="font-mono text-xs">{example}</code></span>
      </div>
    </div>
  )
}
