import type { Status, Submission } from './types'

export type Cell = string | number | boolean | Date | null | undefined
export type Grid = Cell[][]

/** Normalise text for label matching: lower case, single spaces, plain dashes and quotes. */
export function norm(v: Cell): string {
  if (v === null || v === undefined) return ''
  return String(v)
    .toLowerCase()
    .replace(/[–—‒]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function text(v: Cell): string {
  if (v instanceof Date) return isoDate(v)
  return v === null || v === undefined ? '' : String(v).replace(/\s+/g, ' ').trim()
}

function isoDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

interface Hit { r: number; c: number }

function find(grid: Grid, label: string, from = 0): Hit | null {
  const l = norm(label)
  for (let r = from; r < grid.length; r++) {
    const row = grid[r] ?? []
    for (let c = 0; c < row.length; c++) if (norm(row[c]).startsWith(l)) return { r, c }
  }
  return null
}

const LABELS = [
  'package name', 'si onshore pmo project manager', 'enterprise partner name', 'contract number',
  'contract reference', 'submission reference', 'date for assurance', 'submission date',
  'date for acceptance', 'reviewed by', 'checked by', 'approved by',
]
const PLACEHOLDERS = ['select outcome', 'yes / no', 'yes/no']

function isLabel(v: Cell): boolean {
  const n = norm(v)
  return LABELS.some((l) => n.startsWith(l)) || PLACEHOLDERS.includes(n)
}

/** The value for a "Label: value" field: text after the colon, or the next filled cell to the right. */
function field(grid: Grid, label: string): Cell {
  const h = find(grid, label)
  if (!h) return null
  const cell = grid[h.r][h.c]
  const s = typeof cell === 'string' ? cell : ''
  const i = s.indexOf(':')
  if (i >= 0 && s.slice(i + 1).trim()) return s.slice(i + 1).trim()
  for (let c = h.c + 1; c < (grid[h.r]?.length ?? 0); c++) {
    const v = grid[h.r][c]
    if (text(v) === '') continue
    return isLabel(v) ? null : v
  }
  return null
}

/** True when a cell beside an option looks like someone ticked it. */
function isMark(v: Cell): boolean {
  if (v === true) return true
  const n = norm(v)
  if (!n || PLACEHOLDERS.includes(n)) return false
  return !['no', 'n', 'false', '0', '-', 'n/a', 'na'].includes(n)
}

function rowMarked(grid: Grid, h: Hit): boolean {
  const row = grid[h.r] ?? []
  for (let c = h.c + 1; c < row.length; c++) if (isMark(row[c])) return true
  return false
}

export const ACCEPTANCE_OPTIONS: { label: string; match: string; status: Status }[] = [
  { label: 'Accepted – No Comments', match: 'accepted - no comments', status: 'accepted' },
  { label: 'Accepted – Address Comments', match: 'accepted - address comments', status: 'accepted' },
  { label: 'Not Accepted', match: 'not accepted', status: 'not-accepted' },
]

export const ASSURANCE_OPTIONS = [
  { label: 'Assured and submitted for Integration – No Comments', match: 'assured and submitted for integration- no comments' },
  { label: 'Assured and submitted for Integration – Address Comments', match: 'assured and submitted for integration- address comments' },
  { label: 'Assured and not submitted for Integration – Address Comments', match: 'assured and not submitted for integration - address comments' },
]

export const NEC4_REASONS = [
  { label: "The Partner's plans which it shows are not practicable", match: "the partner's plan" },
  { label: 'It does not show the information which this contract requires', match: 'it does not show the information' },
  { label: "It does not represent the Partner's plans realistically", match: "it does not represent the partner's plans" },
  { label: 'It does not allow the Client and Others to start, carry out and complete their work (Z Clause)', match: 'it does not allow the client' },
  { label: 'It does not comply with the Scope', match: 'it does not comply with the scope' },
]

const squash = (s: string) => s.replace(/\s*-\s*/g, '-')

/**
 * Work out which option was chosen under a header like "Outcome for Acceptance ...".
 * Supports: the drop-down beside the header holding the option text, a mark (X, ✓, Yes) beside
 * an option row, and the template's unused options being deleted so only the chosen one remains.
 */
function chooseOptions<T extends { match: string }>(grid: Grid, header: string, options: T[], multi: boolean): T[] {
  const h = find(grid, header)
  if (!h) return []
  const picked = new Set<T>()

  const beside = (grid[h.r] ?? []).slice(h.c + 1).map(norm).filter(Boolean)
  for (const b of beside) for (const o of options) if (squash(b).startsWith(squash(o.match))) picked.add(o)
  if (picked.size && !multi) return [...picked]

  const rows: { o: T; hit: Hit }[] = []
  for (const o of options) {
    for (let r = h.r + 1; r < Math.min(grid.length, h.r + 12); r++) {
      const c = (grid[r] ?? []).findIndex((v) => squash(norm(v)).startsWith(squash(o.match)))
      if (c >= 0) { rows.push({ o, hit: { r, c } }); break }
    }
  }
  for (const { o, hit } of rows) if (rowMarked(grid, hit)) picked.add(o)
  if (!picked.size && rows.length === 1 && options.length > 1 && !multi) picked.add(rows[0].o)
  return [...picked]
}

function toMonth(v: Cell): string | null {
  if (v instanceof Date && !isNaN(v.getTime())) return isoDate(v).slice(0, 7)
  if (typeof v === 'number' && v > 30000 && v < 80000) {
    return isoDate(new Date(Date.UTC(1899, 11, 30) + v * 86400000)).slice(0, 7)
  }
  const s = text(v)
  if (!s) return null
  let m = s.match(/(\d{4})-(\d{1,2})(?:-\d{1,2})?/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}`
  m = s.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/) // UK style dd/mm/yyyy
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3]
    const mo = Number(m[2])
    if (mo >= 1 && mo <= 12) return `${y}-${String(mo).padStart(2, '0')}`
  }
  return monthFromName(s)
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/** Find a month like "Nov 2026", "November-26" or "2026-11" in free text such as a file name. */
export function monthFromName(s: string): string | null {
  const n = s.toLowerCase()
  let m = n.match(/(20\d{2})[-_ .]?(0[1-9]|1[0-2])(?!\d)/)
  if (m) return `${m[1]}-${m[2]}`
  m = n.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-_ .']*(20\d{2}|\d{2})(?!\d)/)
  if (m) {
    const y = m[2].length === 2 ? `20${m[2]}` : m[2]
    return `${y}-${String(MONTHS.indexOf(m[1]) + 1).padStart(2, '0')}`
  }
  return null
}

function keyPoints(grid: Grid): string[] {
  const h = find(grid, 'comments: (summarise') ?? find(grid, 'comments:')
  if (!h) return []
  const out: string[] = []
  for (let r = h.r + 1; r < grid.length; r++) {
    const row = grid[r] ?? []
    if (row.some((v) => norm(v).startsWith('reviewed by'))) break
    const parts = row.slice(h.c).map(text).filter(Boolean)
    if (!parts.length) continue
    // Drop the template's row number (1-5), or a leading "1." typed into the same cell.
    if (/^\d{1,2}\.?$/.test(parts[0])) parts.shift()
    else parts[0] = parts[0].replace(/^\d{1,2}[.)]\s+/, '')
    const t = parts.join(' ').trim()
    if (t) out.push(t)
  }
  return out
}

/** Read the fields the summary needs from a Cover Sheet grid. */
export function parseCoverSheet(grid: Grid, fileName: string): Omit<Submission, 'id' | 'importedAt'> {
  const warnings: string[] = []
  const title = text(grid.flat().find((v) => /programme/i.test(text(v)) && !/criteria/i.test(text(v))) ?? '')

  let contractor = text(field(grid, 'enterprise partner name'))
  if (!contractor) {
    const m = title.match(/-\s*([^-]+)$/)
    if (m) contractor = m[1].trim()
  }
  let project = text(field(grid, 'package name'))
  if (!project && title) project = title.replace(/\s*programme\b.*$/i, '').trim()
  if (!contractor) warnings.push('Contractor (Enterprise Partner Name) not found')
  if (!project) warnings.push('Project (Package Name) not found')

  const submissionDateCell = field(grid, 'submission date')
  const month =
    toMonth(submissionDateCell) ??
    toMonth(field(grid, 'date for acceptance checks')) ??
    toMonth(field(grid, 'date for assurance')) ??
    monthFromName(fileName)
  if (!month) warnings.push('Month not found (no Submission Date or month in the file name)')

  const acc = chooseOptions(grid, 'outcome for acceptance', ACCEPTANCE_OPTIONS, false)
  if (acc.length > 1) warnings.push('More than one acceptance outcome ticked')
  const outcome = acc[0]
  if (!outcome) warnings.push('No acceptance outcome selected')

  const assurance = chooseOptions(grid, 'outcome for review & assurance', ASSURANCE_OPTIONS, false)[0]
  const nec4 = chooseOptions(grid, 'reason(s) for not accepting', NEC4_REASONS, true).map((r) => r.label)

  let reasonsGiven = ''
  const rg = find(grid, 'not accepted - reasons given')
  if (rg) {
    const s = text(grid[rg.r][rg.c])
    reasonsGiven = s.slice(s.toLowerCase().indexOf('given:') + 6).trim()
    // Text typed beside the option rather than after the colon (ignoring a short tick such as "X" or "Yes").
    if (!reasonsGiven) reasonsGiven = (grid[rg.r] ?? []).slice(rg.c + 1).map(text).filter((t) => t.length > 3).join(' ')
  }

  return {
    fileName,
    contractor,
    project,
    month: month ?? '',
    status: outcome?.status ?? 'pending',
    outcome: outcome?.label ?? '',
    assuranceOutcome: assurance?.label ?? '',
    nec4Reasons: nec4,
    reasonsGiven,
    keyPoints: keyPoints(grid),
    submissionReference: text(field(grid, 'submission reference')),
    submissionDate: text(submissionDateCell),
    reviewedBy: text(field(grid, 'reviewed by')),
    warnings,
  }
}

/** One-line reason for the grid: why it was or wasn't accepted. */
export function reasonSummary(s: Pick<Submission, 'status' | 'outcome' | 'nec4Reasons' | 'reasonsGiven' | 'keyPoints'>): string {
  const parts: string[] = []
  if (s.status === 'not-accepted') {
    if (s.reasonsGiven) parts.push(s.reasonsGiven)
    parts.push(...s.nec4Reasons)
  } else if (s.outcome) {
    parts.push(s.outcome.replace(/^Accepted – /, ''))
  }
  parts.push(...s.keyPoints)
  return parts.join('; ')
}
