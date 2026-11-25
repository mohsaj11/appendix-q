import { longMonth, shortMonth, window3 } from '../lib/months'
import { STATUS_ICON, STATUS_LABEL, STATUS_SHORT } from '../lib/status'
import type { CellStatus } from '../lib/status'
import type { Cell } from '../lib/useIndex'
import type { Submission } from '../lib/types'

export function Dashboard({ month, setMonth, contractors, projects, get, works, onOpen, onExport }: {
  month: string
  setMonth: (m: string) => void
  contractors: string[]
  projects: string[]
  get: (c: string, p: string, m: string) => Submission | undefined
  works: (c: string, p: string) => boolean
  onOpen: (cell: Cell) => void
  onExport: () => void
}) {
  const months = window3(month).reverse() // newest first

  return (
    <div className="dashboard">
      <div className="row dash-head">
        <div>
          <h1>Programme acceptance</h1>
          <p className="muted">{longMonth(month)} and the two months before. Click a box to see the reasons.</p>
        </div>
        <span className="spacer" />
        <label className="month-picker">
          <span className="muted small">Reporting month</span>
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        </label>
        <button className="ghost" onClick={onExport}>Export CSV</button>
        <button className="ghost" onClick={() => window.print()}>Print</button>
      </div>

      <ul className="legend" aria-label="Key">
        {(['accepted', 'not-accepted', 'pending', 'none'] as CellStatus[]).map((s) => (
          <li key={s}><span className={`tick ${s}`} aria-hidden>{STATUS_ICON[s]}</span>{STATUS_LABEL[s]}</li>
        ))}
        <li><span className="tick blank" aria-hidden />Contractor not on this project</li>
      </ul>

      <div className="grid-wrap">
        <table className="matrix">
          <thead>
            <tr>
              <th className="corner"><span>Project</span><span>Contractor</span></th>
              {contractors.map((c) => <th key={c} scope="col">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p}>
                <th scope="row">{p}</th>
                {contractors.map((c) => {
                  if (!works(c, p)) return <td key={c} className="blank" />
                  const latest = get(c, p, month)?.status ?? 'none'
                  return (
                    <td key={c}>
                      <button className={`box ${latest}`} onClick={() => onOpen({ contractor: c, project: p })} aria-label={`${p}, ${c}: details`}>
                        <ul className="checklist">
                          {months.map((m) => {
                            const s: CellStatus = get(c, p, m)?.status ?? 'none'
                            return (
                              <li key={m} className={`${s}${m === month ? ' current' : ''}`}>
                                <span className={`tick ${s}`} aria-hidden>{STATUS_ICON[s]}</span>
                                <span className="m">{shortMonth(m)}</span>
                                <span className="s">{STATUS_SHORT[s]}</span>
                              </li>
                            )
                          })}
                        </ul>
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
