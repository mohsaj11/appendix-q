import { STATUS_LABEL as LABEL } from '../lib/status'
import type { Status } from '../lib/types'

const ICON: Record<Status | 'none', string> = { accepted: '✓', 'not-accepted': '✗', pending: '?', none: '–' }

export function StatusPill({ status, month, big }: { status: Status | 'none'; month?: string; big?: boolean }) {
  return (
    <span className={`pill ${status}${big ? ' big' : ''}`} title={LABEL[status]}>
      <span aria-hidden>{ICON[status]}</span>
      {month ? <span className="pill-month">{month}</span> : <span>{LABEL[status]}</span>}
      <span className="sr-only">{LABEL[status]}</span>
    </span>
  )
}
