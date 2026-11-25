import type { Status } from './types'

export type CellStatus = Status | 'none'

export const STATUS_LABEL: Record<CellStatus, string> = {
  accepted: 'Accepted',
  'not-accepted': 'Not accepted',
  pending: 'No outcome on file',
  none: 'No Appendix Q (no file)',
}

export const STATUS_ICON: Record<CellStatus, string> = {
  accepted: '✓',
  'not-accepted': '✗',
  pending: '?',
  none: '–',
}

/** Shorter labels for the dashboard boxes. */
export const STATUS_SHORT: Record<CellStatus, string> = {
  accepted: 'Accepted',
  'not-accepted': 'Not accepted',
  pending: 'No outcome',
  none: 'No file',
}
