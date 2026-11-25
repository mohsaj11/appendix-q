import { useEffect, useMemo, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { DetailModal } from './components/DetailModal'
import { UploadPage } from './components/UploadPage'
import type { Staged } from './components/UploadPage'
import { shortMonth, thisMonth, window3 } from './lib/months'
import { reasonSummary } from './lib/parseCoverSheet'
import { STATUS_LABEL } from './lib/status'
import { distinct, download, load, merge, readWorkbook, save } from './lib/store'
import type { Submission } from './lib/types'
import { useIndex } from './lib/useIndex'
import type { Cell } from './lib/useIndex'

type Tab = 'upload' | 'dashboard'

export default function App() {
  const [list, setList] = useState<Submission[]>(load)
  const [staged, setStaged] = useState<Staged[]>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState<Tab>('upload')
  const [reportReady, setReportReady] = useState(false)
  const [month, setMonth] = useState(thisMonth())
  const [open, setOpen] = useState<Cell | null>(null)

  useEffect(() => save(list), [list])

  const contractors = useMemo(() => distinct(list, 'contractor'), [list])
  const projects = useMemo(() => distinct(list, 'project'), [list])
  const idx = useIndex(list)

  async function upload() {
    setUploading(true)
    const ok: Submission[] = []
    const failed: string[] = []
    for (const s of staged) {
      try { ok.push(await readWorkbook(s.file)) } catch { failed.push(s.file.name) }
    }
    const { list: next, replaced } = merge(list, ok)
    setList(next)
    setStaged([])
    setUploading(false)
    setMessage([
      `${ok.length} file${ok.length === 1 ? '' : 's'} uploaded.`,
      replaced ? `${replaced} replaced an earlier upload for the same project, contractor and month.` : '',
      failed.length ? `These could not be read as Appendix Q workbooks: ${failed.join(', ')}.` : '',
    ].filter(Boolean).join(' '))
  }

  function generate() {
    const latest = list.map((s) => s.month).filter(Boolean).sort().at(-1)
    setMonth(latest ?? thisMonth())
    setReportReady(true)
    setTab('dashboard')
    window.scrollTo(0, 0)
  }

  function exportCsv() {
    const months = window3(month).reverse()
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    const head = ['Project', 'Contractor', ...months.flatMap((m) => [shortMonth(m), `${shortMonth(m)} reasons`])]
    const rows = projects.flatMap((p) => contractors.filter((c) => idx.works(c, p)).map((c) => [
      p, c, ...months.flatMap((m) => {
        const s = idx.get(c, p, m)
        return [STATUS_LABEL[s?.status ?? 'none'], s ? reasonSummary(s) : '']
      }),
    ]))
    download(`appendix-q-dashboard-${month}.csv`, [head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n'), 'text/csv')
  }

  return (
    <div className="app">
      <header className="appbar">
        <strong>Appendix Q Report</strong>
        <nav className="tabstrip" role="tablist">
          <button role="tab" aria-selected={tab === 'upload'} className={tab === 'upload' ? 'on' : ''} onClick={() => setTab('upload')}>
            Upload files
          </button>
          {reportReady && (
            <button role="tab" aria-selected={tab === 'dashboard'} className={tab === 'dashboard' ? 'on' : ''} onClick={() => setTab('dashboard')}>
              Dashboard
            </button>
          )}
        </nav>
      </header>

      <main className="page">
        {tab === 'upload' ? (
          <>
            {message && <div className="notice" role="status">{message}<button className="icon" aria-label="Dismiss" onClick={() => setMessage('')}>✕</button></div>}
            <UploadPage
              staged={staged}
              setStaged={setStaged}
              uploaded={list}
              uploading={uploading}
              onUpload={upload}
              onChange={(id, patch) => setList((l) => l.map((s) => (s.id === id ? { ...s, ...patch } : s)))}
              onRemove={(id) => setList((l) => l.filter((s) => s.id !== id))}
              onClear={() => { if (confirm('Remove all uploaded Appendix Q files?')) { setList([]); setReportReady(false) } }}
              onGenerate={generate}
            />
          </>
        ) : (
          <Dashboard
            month={month}
            setMonth={setMonth}
            contractors={contractors}
            projects={projects}
            get={idx.get}
            works={idx.works}
            onOpen={setOpen}
            onExport={exportCsv}
          />
        )}
      </main>

      {open && <DetailModal cell={open} month={month} get={idx.get} onClose={() => setOpen(null)} />}
    </div>
  )
}
