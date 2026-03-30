import clsx from 'clsx'

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  draft:            { label: 'Draft',            cls: 'badge-gray'   },
  active:           { label: 'Active',           cls: 'badge-blue'   },
  archived:         { label: 'Archived',         cls: 'badge-gray'   },
  created:          { label: 'Created',          cls: 'badge-gray'   },
  outputs_uploaded: { label: 'Outputs Uploaded', cls: 'badge-blue'   },
  complete:         { label: 'Complete',         cls: 'badge-green'  },
  partial:          { label: 'Partial',          cls: 'badge-yellow' },
  review_required:  { label: 'Review Required',  cls: 'badge-red'    },
}

export function StatusBadge({ status }: { status: string }) {
  const { label, cls } = STATUS_MAP[status] ?? { label: status, cls: 'badge-gray' }
  return <span className={cls}>{label}</span>
}
