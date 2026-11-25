import { parseCoverSheet } from './parseCoverSheet'
import type { Grid } from './parseCoverSheet'
import type { Submission } from './types'

const KEY = 'appendix-q:submissions'

export function load(): Submission[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Submission[]) : []
  } catch {
    return []
  }
}

export function save(list: Submission[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // Storage unavailable; the data stays in memory for this visit.
  }
}

/** Case- and spacing-insensitive key so "OTW" and "otw " count as the same contractor. */
export const keyOf = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
export const pairKey = (s: Pick<Submission, 'contractor' | 'project' | 'month'>) =>
  `${keyOf(s.contractor)}|${keyOf(s.project)}|${s.month}`

export async function readWorkbook(file: File): Promise<Submission> {
  const { default: readExcelFile } = await import('read-excel-file/browser')
  const sheets = await readExcelFile(file)
  const cover = sheets.find((s) => /cover\s*sheet/i.test(s.sheet)) ?? sheets[1] ?? sheets[0]
  const parsed = parseCoverSheet(cover.data as Grid, file.name)
  if (!/cover\s*sheet/i.test(cover.sheet)) parsed.warnings.push(`No "Cover Sheet" tab; read "${cover.sheet}" instead`)
  return { ...parsed, id: crypto.randomUUID(), importedAt: new Date().toISOString() }
}

/**
 * Add new submissions, replacing any older one for the same contractor, project and month.
 * Returns the merged list and how many were replaced.
 */
export function merge(existing: Submission[], incoming: Submission[]): { list: Submission[]; replaced: number } {
  const byKey = new Map(existing.map((s) => [pairKey(s), s]))
  let replaced = 0
  const list = existing.slice()
  for (const s of incoming) {
    const k = pairKey(s)
    const old = s.contractor && s.project && s.month ? byKey.get(k) : undefined
    if (old) {
      list.splice(list.indexOf(old), 1)
      replaced++
    }
    list.push(s)
    byKey.set(k, s)
  }
  return { list, replaced }
}

/** Distinct names in first-seen spelling, sorted. */
export function distinct(list: Submission[], field: 'contractor' | 'project'): string[] {
  const m = new Map<string, string>()
  for (const s of list) if (s[field]) m.set(keyOf(s[field]), m.get(keyOf(s[field])) ?? s[field])
  return [...m.values()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

export function download(name: string, content: string, type: string): void {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}
