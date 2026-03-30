'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const links = [
  { href: '/dashboard', label: 'Dashboard'     },
  { href: '/new',       label: 'New Workflow'  },
  { href: '/upload',    label: 'Upload Doc'    },
]

export function Nav() {
  const pathname = usePathname()
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <span className="text-white text-xs font-extrabold">LF</span>
          </div>
          <span className="text-gray-900 font-bold text-base tracking-tight">LabFlow AI</span>
          <span className="badge badge-blue hidden sm:inline-flex text-xs">Beta</span>
        </Link>
        <nav className="flex items-center gap-0.5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                pathname?.startsWith(l.href)
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
