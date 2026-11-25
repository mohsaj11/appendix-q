import { useEffect, useRef, useState } from 'react'
import { driveConfigured, pickFromDrive } from '../lib/googleDrive'
import { longMonth } from '../lib/months'
import type { Status, Submission } from '../lib/types'

export interface Staged { key: string; file: File; source: 'computer' | 'drive' }

export function UploadPage({ staged, setStaged, uploaded, uploading, onUpload, onChange, onRemove, onClear, onGenerate }: {
  staged: Staged[]
  setStaged: (s: Staged[]) => void
  uploaded: Submission[]
  uploading: boolean
  onUpload: () => void
  onChange: (id: string, patch: Partial<Submission>) => void
  onRemove: (id: string) => void
  onClear: () => void
  onGenerate: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [note, setNote] = useState('')
  const [dragging, setDragging] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const menu = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => { if (!menu.current?.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  const add = (files: File[], source: Staged['source']) => {
    const xlsx = files.filter((f) => /\.xlsx$/i.test(f.name))
    const have = new Set(staged.map((s) => s.file.name + s.file.size))
    const fresh = xlsx.filter((f) => !have.has(f.name + f.size)).map((file) => ({ key: crypto.randomUUID(), file, source }))
    setStaged([...staged, ...fresh])
    setNote(files.length > xlsx.length ? `${files.length - xlsx.length} file(s) skipped: only .xlsx workbooks can be added.` : '')
  }

  const fromDrive = async () => {
    setMenuOpen(false)
    if (!driveConfigured) {
      setNote('Google Drive needs a one-off setup before it can be used here. For now, download the files from Drive and add them from your computer.')
      return
    }
    try { add(await pickFromDrive(), 'drive') } catch (e) { setNote((e as Error).message) }
  }

  const flagged = uploaded.filter((s) => s.warnings.length)
  const months = [...new Set(uploaded.map((s) => s.month).filter(Boolean))].sort().reverse()

  return (
    <div className="upload-page">
      <section
        className={`card dropzone${dragging ? ' dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); add([...e.dataTransfer.files], 'computer') }}
      >
        <h1>Appendix Q files</h1>
        <p className="muted">Add this month's Appendix Q workbooks (.xlsx), then click Upload.</p>

        <div className="add-menu" ref={menu}>
          <button className="primary" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            Add files <span aria-hidden>▾</span>
          </button>
          {menuOpen && (
            <div className="menu" role="menu">
              <button role="menuitem" onClick={() => { setMenuOpen(false); input.current?.click() }}>
                <span className="menu-icon" aria-hidden>💻</span>
                <span><strong>From this computer</strong><small>Select as many files as you like</small></span>
              </button>
              <button role="menuitem" onClick={fromDrive}>
                <span className="menu-icon" aria-hidden>☁️</span>
                <span><strong>From Google Drive</strong><small>{driveConfigured ? 'Pick files from your Drive' : 'Needs setting up first'}</small></span>
              </button>
            </div>
          )}
          <input ref={input} type="file" accept=".xlsx" multiple hidden onChange={(e) => { add([...(e.target.files ?? [])], 'computer'); e.target.value = '' }} />
        </div>
        <p className="muted small">or drag and drop files here</p>
        {note && <p className="note">{note}</p>}

        {staged.length > 0 && (
          <>
            <ul className="file-list">
              {staged.map((s) => (
                <li key={s.key}>
                  <span aria-hidden>📄</span>
                  <span className="name">{s.file.name}</span>
                  <span className="muted small">{s.source === 'drive' ? 'Google Drive' : `${Math.max(1, Math.round(s.file.size / 1024))} KB`}</span>
                  <button className="icon" aria-label={`Remove ${s.file.name}`} onClick={() => setStaged(staged.filter((x) => x.key !== s.key))}>✕</button>
                </li>
              ))}
            </ul>
            <div className="row">
              <span className="muted">{staged.length} file{staged.length === 1 ? '' : 's'} ready to upload</span>
              <span className="spacer" />
              <button className="ghost" onClick={() => setStaged([])}>Clear</button>
              <button className="primary" onClick={onUpload} disabled={uploading}>{uploading ? 'Uploading…' : 'Upload'}</button>
            </div>
          </>
        )}
      </section>

      {uploaded.length > 0 && (
        <section className="card">
          <div className="row">
            <h2>Uploaded</h2>
            <span className="spacer" />
            <button className="link-btn danger" onClick={onClear}>Remove all</button>
          </div>
          <p className="muted small">
            {uploaded.length} Appendix Q{uploaded.length === 1 ? '' : 's'} covering {months.map(longMonth).join(', ') || 'no month yet'}.
            Earlier months are kept so the dashboard can show the last three months.
          </p>

          {flagged.length > 0 && (
            <div className="flagged">
              <h3>⚠ {flagged.length} file{flagged.length === 1 ? '' : 's'} need a quick check</h3>
              <p className="muted small">Some details could not be read from the Cover Sheet. Fill in what is missing, then click Done.</p>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>File</th><th>Problem</th><th>Project</th><th>Contractor</th><th>Month</th><th>Outcome</th><th /></tr></thead>
                  <tbody>
                    {flagged.map((s) => (
                      <tr key={s.id}>
                        <td className="file-cell">{s.fileName}</td>
                        <td className="warning">{s.warnings.join('; ')}</td>
                        <td><input aria-label="Project" value={s.project} onChange={(e) => onChange(s.id, { project: e.target.value })} /></td>
                        <td><input aria-label="Contractor" value={s.contractor} onChange={(e) => onChange(s.id, { contractor: e.target.value })} /></td>
                        <td><input aria-label="Month" type="month" value={s.month} onChange={(e) => onChange(s.id, { month: e.target.value })} /></td>
                        <td>
                          <select aria-label="Outcome" value={s.status} onChange={(e) => onChange(s.id, { status: e.target.value as Status })}>
                            <option value="pending">Not given</option>
                            <option value="accepted">Accepted</option>
                            <option value="not-accepted">Not accepted</option>
                          </select>
                        </td>
                        <td><button className="ghost" onClick={() => onChange(s.id, { warnings: [] })}>Done</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <details className="all-files">
            <summary>Show all uploaded files</summary>
            <ul className="file-list">
              {uploaded.slice().sort((a, b) => b.month.localeCompare(a.month) || a.fileName.localeCompare(b.fileName)).map((s) => (
                <li key={s.id}>
                  <span aria-hidden>📄</span>
                  <span className="name">{s.fileName}</span>
                  <span className="muted small">{[s.project, s.contractor, s.month && longMonth(s.month)].filter(Boolean).join(' · ')}</span>
                  <button className="icon" aria-label={`Remove ${s.fileName}`} onClick={() => onRemove(s.id)}>✕</button>
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}

      <div className="generate-bar">
        <button className="primary big" disabled={!uploaded.length || staged.length > 0} onClick={onGenerate}>Generate report</button>
        {staged.length > 0 && <p className="muted small">Upload the files you added first.</p>}
      </div>
    </div>
  )
}
