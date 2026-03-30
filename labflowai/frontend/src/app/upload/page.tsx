'use client'
import { useState, useRef } from 'react'
import { uploadDocument } from '@/lib/api'
import type { UploadedDocument } from '@/lib/types'

const ALLOWED = ['.txt', '.pdf', '.csv', '.md']

export default function UploadPage() {
  const [workflowId, setWorkflowId] = useState('')
  const [result, setResult] = useState<UploadedDocument | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED.includes(ext)) {
      setError(`Unsupported file type "${ext}". Allowed: ${ALLOWED.join(', ')}`)
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const doc = await uploadDocument(file, workflowId || undefined)
      setResult(doc)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Document</h1>
      <p className="text-sm text-gray-500 mb-8">
        Upload a protocol, SOP, or instrument output file. Supported formats: TXT, PDF, CSV, MD.
        The raw file is stored separately from extracted records.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link to workflow ID <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={workflowId}
            onChange={(e) => setWorkflowId(e.target.value)}
            placeholder="Paste a workflow UUID to associate this file"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-brand-400 bg-brand-50' : 'border-gray-300 hover:border-brand-300 bg-white'
          }`}
        >
          <div className="text-3xl mb-3">📁</div>
          <p className="text-sm font-medium text-gray-700">
            Drop a file here or <span className="text-brand-600">click to browse</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">TXT, PDF, CSV, MD · max 20 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.pdf,.csv,.md"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        {loading && (
          <div className="text-sm text-gray-500 text-center">Uploading and extracting text…</div>
        )}

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        {result && (
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-green-700">✓ Upload successful</h3>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-gray-500">Filename</dt>
              <dd className="text-gray-900 font-medium">{result.filename}</dd>
              <dt className="text-gray-500">Type</dt>
              <dd className="text-gray-600">{result.file_type.toUpperCase()}</dd>
              <dt className="text-gray-500">Document ID</dt>
              <dd className="font-mono text-xs text-gray-500">{result.id}</dd>
              <dt className="text-gray-500">Storage path</dt>
              <dd className="font-mono text-xs text-gray-500 truncate">{result.storage_path}</dd>
            </dl>
            {result.extracted_text && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Extracted text preview</p>
                <pre className="text-xs text-gray-600 bg-gray-50 rounded p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {result.extracted_text.slice(0, 800)}{result.extracted_text.length > 800 ? '…' : ''}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
