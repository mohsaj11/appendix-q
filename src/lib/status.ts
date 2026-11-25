import type { Status } from './types'

export const STATUS_LABEL: Record<Status | 'none', string> = {
  accepted: 'Accepted',
  'not-accepted': 'Not accepted',
  pending: 'No outcome',
  none: 'No submission',
}
