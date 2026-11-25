import { useMemo } from 'react'
import { keyOf } from './store'
import type { Submission } from './types'

export interface Cell { contractor: string; project: string }

export function useIndex(list: Submission[]) {
  return useMemo(() => {
    const m = new Map<string, Submission>()
    for (const s of list) m.set(`${keyOf(s.contractor)}|${keyOf(s.project)}|${s.month}`, s)
    const pairs = new Set(list.map((s) => `${keyOf(s.contractor)}|${keyOf(s.project)}`))
    return {
      get: (c: string, p: string, month: string) => m.get(`${keyOf(c)}|${keyOf(p)}|${month}`),
      works: (c: string, p: string) => pairs.has(`${keyOf(c)}|${keyOf(p)}`),
    }
  }, [list])
}

