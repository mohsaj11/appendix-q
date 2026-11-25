import { longMonth, window3 } from '../lib/months'
import type { Submission } from '../lib/types'
import { StatusPill } from './StatusPill'
import type { Cell } from '../lib/useIndex'

export function Detail({ cell, month, get, onClose }: {
  cell: Cell
  month: string
  get: (c: string, p: string, m: string) => Submission | undefined
  onClose: () => void
}) {
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-label={`${cell.contractor} on ${cell.project}`} onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <h2>{cell.project}</h2>
            <p className="muted">{cell.contractor}</p>
          </div>
          <button className="ghost" onClick={onClose} aria-label="Close">✕</button>
        </header>
        {window3(month).reverse().map((m) => {
          const s = get(cell.contractor, cell.project, m)
          return (
            <section key={m} className="month-block">
              <h3>{longMonth(m)} <StatusPill status={s?.status ?? 'none'} /></h3>
              {!s ? (
                <p className="muted">No Appendix Q imported for this month.</p>
              ) : (
                <dl>
                  {s.outcome && <><dt>Outcome</dt><dd>{s.outcome}</dd></>}
                  {s.reasonsGiven && <><dt>Reasons given</dt><dd>{s.reasonsGiven}</dd></>}
                  {s.nec4Reasons.length > 0 && (
                    <><dt>NEC4 clause 31.3</dt><dd><ul>{s.nec4Reasons.map((r) => <li key={r}>{r}</li>)}</ul></dd></>
                  )}
                  {s.keyPoints.length > 0 && (
                    <><dt>Comments</dt><dd><ol>{s.keyPoints.map((r, i) => <li key={i}>{r}</li>)}</ol></dd></>
                  )}
                  {s.assuranceOutcome && <><dt>Review &amp; assurance</dt><dd>{s.assuranceOutcome}</dd></>}
                  <dt>Source</dt>
                  <dd className="muted">
                    {s.fileName}
                    {s.submissionReference && ` · ${s.submissionReference}`}
                    {s.submissionDate && ` · submitted ${s.submissionDate}`}
                    {s.reviewedBy && ` · reviewed by ${s.reviewedBy}`}
                  </dd>
                </dl>
              )}
            </section>
          )
        })}
      </aside>
    </div>
  )
}
