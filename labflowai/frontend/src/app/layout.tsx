import type { Metadata } from 'next'
import './globals.css'
import { Nav } from '@/components/Nav'

export const metadata: Metadata = {
  title: 'LabFlow AI — Experiment Workflow Copilot',
  description: 'Convert SOPs and protocol text into structured, traceable experiment workflows with AI-powered parsing and ambiguity detection.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50">
        <Nav />
        {/* Demo notice */}
        <div className="bg-brand-600 text-white text-xs text-center py-1.5 font-medium tracking-wide">
          Demo mode · No login required · Data resets on server restart
        </div>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400">
          LabFlow AI · Demo / Sandbox · Not validated for GxP or regulatory use · Always apply human review
        </footer>
      </body>
    </html>
  )
}
