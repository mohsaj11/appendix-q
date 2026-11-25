import { reasonSummary } from '../lib/parseCoverSheet'
import type { Status, Submission } from '../lib/types'

export function FilesTable({ list, onChange, onRemove }: {
  list: Submission[]
  onChange: (id: string, patch: Partial<Submission>) => void
  onRemove: (id: string) => void
}) {
  if (!list.length) return <div className="card empty">No files imported for this view.</div>
  const sorted = list.slice().sort((a, b) => Number(b.warnings.length > 0) - Number(a.warnings.length > 0) || b.month.localeCompare(a.month) || a.project.localeCompare(b.project) || a.contractor.localeCompare(b.contractor))
  return (
    <div className="card table-wrap">
      <table className="files">
        <thead>
          <tr>
            <th>Month</th><th>Project</th><th>Contractor</th><th>Status</th><th>Reason</th><th>File</th><th />
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => (
            <tr key={s.id} className={s.warnings.length ? 'warn' : ''}>
              <td><input type="month" value={s.month} aria-label="Month" onChange={(e) => onChange(s.id, { month: e.target.value })} /></td>
              <td><input value={s.project} aria-label="Project" onChange={(e) => onChange(s.id, { project: e.target.value })} /></td>
              <td><input value={s.contractor} aria-label="Contractor" onChange={(e) => onChange(s.id, { contractor: e.target.value })} /></td>
              <td>
                <select value={s.status} aria-label="Status" onChange={(e) => onChange(s.id, { status: e.target.value as Status })}>
                  <option value="accepted">Accepted</option>
                  <option value="not-accepted">Not accepted</option>
                  <option value="pending">No outcome</option>
                </select>
              </td>
              <td className="reason-cell">{reasonSummary(s) || <span className="muted">–</span>}</td>
              <td className="file-cell">
                {s.fileName}
                {s.warnings.map((w) => <div key={w} className="warning">⚠ {w}</div>)}
              </td>
              <td><button className="ghost danger" aria-label={`Remove ${s.fileName}`} onClick={() => onRemove(s.id)}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
