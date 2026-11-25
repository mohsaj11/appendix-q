import { readSheet } from 'read-excel-file/node'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { monthFromName, parseCoverSheet, reasonSummary } from './parseCoverSheet'
import type { Grid } from './parseCoverSheet'

const fixture = async (name: string) =>
  parseCoverSheet((await readSheet(path.join(__dirname, '../../tests/fixtures', name), 'Cover Sheet')) as Grid, name)

describe('parseCoverSheet', () => {
  it('reads an outcome chosen from the drop-down', async () => {
    const s = await fixture('accepted-dropdown.xlsx')
    expect(s).toMatchObject({
      contractor: 'Contractor A',
      project: 'Project Alpha',
      month: '2026-11',
      status: 'accepted',
      outcome: 'Accepted – Address Comments',
      assuranceOutcome: 'Assured and submitted for Integration – Address Comments',
      submissionReference: 'SUB-001',
      keyPoints: ['Update the TRA register before next submission'],
      warnings: [],
    })
  })

  it('reads ticked options, NEC4 reasons and comments', async () => {
    const s = await fixture('not-accepted-marks.xlsx')
    expect(s.status).toBe('not-accepted')
    expect(s.month).toBe('2026-10')
    expect(s.reasonsGiven).toBe('Critical path is broken by open ends')
    expect(s.nec4Reasons).toEqual([
      'It does not show the information which this contract requires',
      'It does not comply with the Scope',
    ])
    expect(s.keyPoints).toEqual(['42 activities have no successor', 'Negative lag on 3 activities'])
    expect(s.reviewedBy).toBe('J. Planner')
    expect(reasonSummary(s)).toContain('Critical path is broken by open ends; It does not show')
  })

  it('falls back to the file name for the month and warns when there is no outcome', async () => {
    const s = await fixture('Appendix Q - Gamma - Sep 2026.xlsx')
    expect(s.month).toBe('2026-09')
    expect(s.status).toBe('pending')
    expect(s.warnings).toContain('No acceptance outcome selected')
  })
})

describe('monthFromName', () => {
  it.each([
    ['AppQ_2026-11_Alpha.xlsx', '2026-11'],
    ['Alpha November 2026.xlsx', '2026-11'],
    ['Alpha Oct-26.xlsx', '2026-10'],
    ['Alpha 202609.xlsx', '2026-09'],
    ['Alpha.xlsx', null],
  ])('%s -> %s', (name, month) => expect(monthFromName(name)).toBe(month))
})
