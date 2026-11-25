import { useEffect, useMemo, useRef, useState } from 'react'
import { Detail } from './components/Detail'
import { FilesTable } from './components/FilesTable'
import { STATUS_LABEL } from './lib/status'
import { SummaryGrid } from './components/SummaryGrid'
import { useIndex } from './lib/useIndex'
import type { Cell } from './lib/useIndex'
import { longMonth, shortMonth, thisMonth, window3 } from './lib/months'
import { reasonSummary } from './lib/parseCoverSheet'
import { distinct, download, load, merge, readWorkbook, save } from './lib/store'
import type { Submission } from './lib/types'

type Tab = 'summary' | 'files'

export default function App() {
  const [list, setList] = useState<Submission[]>(load)
  const latest = useMemo(() => list.map((s) => s.month).filter(Boolean).sort().at(-1) ?? thisMonth(), [list])
  const [month, setMonth] = useState<string>(latest)
  const [tab, setTab] = useState<Tab>('summary')
  const [open, setOpen] = useState<Cell | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const restoreInput = useRef<HTMLInputElement>(null)

  useEffect(() => save(list), [list])

  const contractors = useMemo(() => distinct(list, 'contractor'), [list])
  const projects = useMemo(() => distinct(list, 'project'), [list])
  const idx = useIndex(list)
  const months = window3(month)
  const inWindow = list.filter((s) => months.includes(s.month))
  const warnings = list.filter((s) => s.warnings.length).length

  const current = contractors.flatMap((c) => projects.filter((p) => idx.works(c, p)).map((p) => ({ c, p, s: idx.get(c, p, month) })))
  const counts = {
    accepted: current.filter((x) => x.s?.status === 'accepted').length,
    notAccepted: current.filter((x) => x.s?.status === 'not-accepted').length,
    pending: current.filter((x) => x.s?.status === 'pending').length,
    missing: current.filter((x) => !x.s).length,
  }

  async function importFiles(files: FileList | File[]) {
    const xlsx = [...files].filter((f) => /\.xlsx$/i.test(f.name))
    const skipped = files.length - xlsx.length
    if (!xlsx.length) { setNotice('Only .xlsx files can be imported.'); return }
    setBusy(true)
    const ok: Submission[] = []
    const failed: string[] = []
    for (const f of xlsx) {
      try { ok.push(await readWorkbook(f)) } catch { failed.push(f.name) }
    }
    const { list: next, replaced } = merge(list, ok)
    setList(next)
    const newest = ok.map((s) => s.month).filter(Boolean).sort().at(-1)
    if (newest) setMonth(newest)
    const flagged = ok.filter((s) => s.warnings.length).length
    setNotice([
      `Imported ${ok.length} file${ok.length === 1 ? '' : 's'}.`,
      replaced && `${replaced} replaced an earlier import for the same contractor, project and month.`,
      flagged && `${flagged} need checking on the Files tab.`,
      failed.length && `Could not read: ${failed.join(', ')}.`,
      skipped && `${skipped} non-.xlsx file${skipped === 1 ? '' : 's'} skipped.`,
    ].filter(Boolean).join(' '))
    if (flagged) setTab('files')
    setBusy(false)
  }

  function exportCsv() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    const head = ['Project', 'Contractor', ...months.flatMap((m) => [`${shortMonth(m)} status`, `${shortMonth(m)} reason`])]
    const rows = projects.flatMap((p) => contractors.filter((c) => idx.works(c, p)).map((c) => [
      p, c, ...months.flatMap((m) => {
        const s = idx.get(c, p, m)
        return [STATUS_LABEL[s?.status ?? 'none'], s ? reasonSummary(s) : '']
      }),
    ]))
    download(`appendix-q-summary-${month}.csv`, [head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n'), 'text/csv')
  }

  async function restore(f: File | undefined) {
    if (!f) return
    try {
      const data = JSON.parse(await f.text()) as Submission[]
      if (!Array.isArray(data) || data.some((s) => typeof s?.contractor !== 'string')) throw new Error()
      const { list: next } = merge(list, data.map((s) => ({ ...s, id: crypto.randomUUID() })))
      setList(next)
      setNotice(`Restored ${data.length} records from backup.`)
    } catch {
      setNotice('That file is not an Appendix Q backup.')
    }
  }

  const update = (id: string, patch: Partial<Submission>) =>
    setList((l) => l.map((s) => (s.id === id ? { ...s, ...patch, warnings: [] } : s)))

  return (
    <div
      className={`app${dragging ? ' dragging' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragging(false) }}
      onDrop={(e) => { e.preventDefault(); setDragging(false); importFiles(e.dataTransfer.files) }}
    >
      <header className="topbar">
        <div className="brand">
          <strong>Appendix Q Summary</strong>
          <span>Programme acceptance by contractor and project</span>
        </div>
        <button onClick={() => fileInput.current?.click()} disabled={busy}>{busy ? 'Reading…' : 'Import Appendix Q files'}</button>
        <input ref={fileInput} type="file" accept=".xlsx" multiple hidden onChange={(e) => { if (e.target.files) importFiles(e.target.files); e.target.value = '' }} />
      </header>

      <main className="container stack">
        {notice && <div className="notice" role="status">{notice}<button className="ghost" aria-label="Dismiss" onClick={() => setNotice('')}>✕</button></div>}

        {list.length === 0 ? (
          <div className="card empty">
            <h1>Drop this month's Appendix Q files here</h1>
            <p className="muted">
              Select all the .xlsx files at once (for example all 28). Each file's Cover Sheet is read for the contractor,
              project, month and acceptance outcome. Files are read in your browser and are not uploaded anywhere.
            </p>
            <button onClick={() => fileInput.current?.click()}>Choose files</button>
            <button className="ghost" onClick={() => restoreInput.current?.click()}>Restore a backup</button>
          </div>
        ) : (
          <>
            <div className="toolbar">
              <label className="month-picker">
                <span className="muted">Month</span>
                <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
              </label>
              <nav className="tabs" role="tablist">
                <button role="tab" aria-selected={tab === 'summary'} className={tab === 'summary' ? 'on' : ''} onClick={() => setTab('summary')}>Summary</button>
                <button role="tab" aria-selected={tab === 'files'} className={tab === 'files' ? 'on' : ''} onClick={() => setTab('files')}>
                  Files ({list.length}){warnings > 0 && <span className="badge" title="Files that need checking">{warnings}</span>}
                </button>
              </nav>
              <span className="spacer" />
              <button className="ghost" onClick={exportCsv}>Export CSV</button>
              <button className="ghost" onClick={() => { setTab('summary'); setTimeout(() => window.print(), 50) }}>Print</button>
            </div>

            {tab === 'summary' ? (
              <>
                <h1 className="print-title">Programme acceptance: {longMonth(month)}</h1>
                <div className="stats">
                  <div className="stat accepted"><strong>{counts.accepted}</strong> accepted</div>
                  <div className="stat not-accepted"><strong>{counts.notAccepted}</strong> not accepted</div>
                  <div className="stat pending"><strong>{counts.pending}</strong> no outcome</div>
                  <div className="stat none"><strong>{counts.missing}</strong> not yet received</div>
                </div>
                <p className="muted small">
                  Each cell shows {months.map(shortMonth).join(', ')} (latest in bold) and the reason for {shortMonth(month)}. Grey cells are
                  contractors with no Appendix Q on that project. Click a cell for the full reasons.
                </p>
                <SummaryGrid list={list} month={month} contractors={contractors} projects={projects} onOpen={setOpen} />

                {counts.notAccepted > 0 && (
                  <section className="card">
                    <h2>Not accepted in {longMonth(month)}</h2>
                    <ul className="reasons-list">
                      {current.filter((x) => x.s?.status === 'not-accepted').map((x) => (
                        <li key={x.c + x.p}><strong>{x.p} · {x.c}</strong>: {reasonSummary(x.s!) || 'No reason given'}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            ) : (
              <>
                <p className="muted small">
                  {inWindow.length
                    ? `Showing the ${inWindow.length} files for ${months.map(shortMonth).join(', ')} (${list.length} in total).`
                    : `No files for ${months.map(shortMonth).join(', ')}, so all ${list.length} are shown.`}{' '}
                  Fix anything flagged ⚠ here; edits update the summary straight away.
                </p>
                <FilesTable
                  list={inWindow.length ? inWindow : list}
                  onChange={update}
                  onRemove={(id) => setList((l) => l.filter((s) => s.id !== id))}
                />
              </>
            )}

            <footer className="footer muted small">
              <span>Data is kept in this browser only.</span>
              <button className="link-btn" onClick={() => download(`appendix-q-backup-${thisMonth()}.json`, JSON.stringify(list, null, 2), 'application/json')}>Download backup</button>
              <button className="link-btn" onClick={() => restoreInput.current?.click()}>Restore backup</button>
              <button className="link-btn danger" onClick={() => { if (confirm('Remove all imported data from this browser?')) setList([]) }}>Clear all</button>
            </footer>
          </>
        )}
        <input ref={restoreInput} type="file" accept="application/json" hidden onChange={(e) => { restore(e.target.files?.[0]); e.target.value = '' }} />
      </main>

      {open && <Detail cell={open} month={month} get={idx.get} onClose={() => setOpen(null)} />}
      {dragging && <div className="drop-overlay">Drop Appendix Q files to import</div>}
    </div>
  )
}
