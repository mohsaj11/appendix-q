import { shortMonth, window3 } from '../lib/months'
import { reasonSummary } from '../lib/parseCoverSheet'
import { useIndex } from '../lib/useIndex'
import type { Cell } from '../lib/useIndex'
import type { Submission } from '../lib/types'
import { StatusPill } from './StatusPill'

export function SummaryGrid({ list, month, contractors, projects, onOpen }: {
  list: Submission[]
  month: string
  contractors: string[]
  projects: string[]
  onOpen: (cell: Cell) => void
}) {
  const idx = useIndex(list)
  const months = window3(month)

  return (
    <div className="grid-wrap">
      <table className="matrix">
        <thead>
          <tr>
            <th className="corner">Project ↓ / Contractor →</th>
            {contractors.map((c) => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p}>
              <th scope="row">{p}</th>
              {contractors.map((c) => {
                if (!idx.works(c, p)) return <td key={c} className="na" aria-label="Not working on this project" />
                const cur = idx.get(c, p, month)
                const reason = cur ? reasonSummary(cur) : ''
                return (
                  <td key={c}>
                    <button className={`cell ${cur?.status ?? 'none'}`} onClick={() => onOpen({ contractor: c, project: p })}>
                      <span className="pills">
                        {months.map((m) => (
                          <StatusPill key={m} status={idx.get(c, p, m)?.status ?? 'none'} month={shortMonth(m)} big={m === month} />
                        ))}
                      </span>
                      {reason && <span className="reason">{reason}</span>}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
