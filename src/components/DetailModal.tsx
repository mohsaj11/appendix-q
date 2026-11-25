import { useEffect } from 'react'
import { longMonth, window3 } from '../lib/months'
import { STATUS_ICON, STATUS_LABEL } from '../lib/status'
import type { Cell } from '../lib/useIndex'
import type { Submission } from '../lib/types'

/** Split free text such as "a; b" or numbered lines into separate reasons. */
function splitReasons(t: string): string[] {
  return t.split(/\s*(?:;|\n|\r)\s*/).map((x) => x.replace(/^\d+[.)]\s*/, '').trim()).filter(Boolean)
}

export function DetailModal({ cell, month, get, onClose }: {
  cell: Cell
  month: string
  get: (c: string, p: string, m: string) => Submission | undefined
  onClose: () => void
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={`${cell.project}, ${cell.contractor}`} onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <h2>{cell.project}</h2>
            <p className="muted">{cell.contractor}</p>
          </div>
          <button className="icon" onClick={onClose} aria-label="Close">✕</button>
        </header>
        <div className="modal-body">
          {window3(month).reverse().map((m) => {
            const s = get(cell.contractor, cell.project, m)
            const status = s?.status ?? 'none'
            const given = s ? splitReasons(s.reasonsGiven) : []
            return (
              <section key={m} className={`month-card ${status}`}>
                <h3>
                  <span className={`tick ${status}`} aria-hidden>{STATUS_ICON[status]}</span>
                  {longMonth(m)}: {status === 'accepted' && s?.outcome ? s.outcome : STATUS_LABEL[status]}
                </h3>
                {!s ? (
                  <p className="muted">No Appendix Q was uploaded for this month.</p>
                ) : (
                  <>
                    {status === 'not-accepted' && (
                      <>
                        <h4>Reasons for non-acceptance</h4>
                        {given.length || s.nec4Reasons.length ? (
                          <ol className="reasons">
                            {given.map((r, i) => <li key={`g${i}`}>{r}</li>)}
                            {s.nec4Reasons.map((r) => <li key={r}>{r} <span className="muted small">(NEC4 clause 31.3)</span></li>)}
                          </ol>
                        ) : <p className="muted">No reasons were written on the Cover Sheet.</p>}
                      </>
                    )}
                    {status === 'accepted' && (
                      <p>{s.outcome === 'Accepted – No Comments' ? 'Accepted with no comments.' : 'Accepted, with comments the contractor needs to address.'}</p>
                    )}
                    {status === 'pending' && <p className="muted">The Cover Sheet has no acceptance outcome selected.</p>}
                    {s.keyPoints.length > 0 && (
                      <>
                        <h4>Reviewer comments</h4>
                        <ol className="reasons">{s.keyPoints.map((r, i) => <li key={i}>{r}</li>)}</ol>
                      </>
                    )}
                    <p className="source muted small">
                      From {s.fileName}
                      {s.submissionDate && `, submitted ${s.submissionDate}`}
                      {s.reviewedBy && `, reviewed by ${s.reviewedBy}`}
                    </p>
                  </>
                )}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
