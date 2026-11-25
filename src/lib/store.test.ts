import { describe, expect, it } from 'vitest'
import { addMonths, window3 } from './months'
import { distinct, merge } from './store'
import type { Submission } from './types'

const sub = (p: Partial<Submission>): Submission => ({
  id: crypto.randomUUID(), fileName: 'f.xlsx', importedAt: '', contractor: 'A', project: 'P1', month: '2026-11',
  status: 'accepted', outcome: '', assuranceOutcome: '', nec4Reasons: [], reasonsGiven: '', keyPoints: [],
  submissionReference: '', submissionDate: '', reviewedBy: '', warnings: [], ...p,
})

describe('merge', () => {
  it('replaces a submission for the same contractor, project and month', () => {
    const a = sub({ status: 'not-accepted' })
    const b = sub({ contractor: 'a ', status: 'accepted' })
    const { list, replaced } = merge([a], [b, sub({ month: '2026-10' })])
    expect(replaced).toBe(1)
    expect(list).toHaveLength(2)
    expect(list.find((s) => s.month === '2026-11')!.status).toBe('accepted')
  })
  it('keeps incomplete rows rather than collapsing them', () => {
    expect(merge([sub({ contractor: '' })], [sub({ contractor: '' })]).list).toHaveLength(2)
  })
})

describe('helpers', () => {
  it('lists distinct names ignoring case', () => {
    expect(distinct([sub({ contractor: 'OTW' }), sub({ contractor: 'otw' }), sub({ contractor: 'B' })], 'contractor')).toEqual(['B', 'OTW'])
  })
  it('handles year boundaries', () => {
    expect(addMonths('2026-01', -2)).toBe('2025-11')
    expect(window3('2026-02')).toEqual(['2025-12', '2026-01', '2026-02'])
  })
})
