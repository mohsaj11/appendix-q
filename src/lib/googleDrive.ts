/* Google Drive picker. Needs three values set at build time (see README):
 * VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_API_KEY and VITE_GOOGLE_APP_ID (the Cloud project number). */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window { gapi?: any; google?: any }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined
const APP_ID = import.meta.env.VITE_GOOGLE_APP_ID as string | undefined
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export const driveConfigured = Boolean(CLIENT_ID && API_KEY && APP_ID)

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Could not load ${src}`))
    document.head.appendChild(s)
  })
}

let token: string | null = null

async function getToken(): Promise<string> {
  if (token) return token
  await loadScript('https://accounts.google.com/gsi/client')
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      // Only files the user picks are readable with this scope.
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (r: any) => {
        if (r.error) return reject(new Error(r.error))
        token = r.access_token as string
        setTimeout(() => { token = null }, (Number(r.expires_in) - 60) * 1000)
        resolve(token)
      },
      error_callback: (e: any) => reject(new Error(e?.message ?? 'Google sign-in was closed')),
    })
    client.requestAccessToken()
  })
}

/** Open the Google Drive picker and download the chosen .xlsx files. Resolves to [] if cancelled. */
export async function pickFromDrive(): Promise<File[]> {
  if (!driveConfigured) throw new Error('Google Drive is not set up for this app yet')
  await loadScript('https://apis.google.com/js/api.js')
  await new Promise<void>((r) => window.gapi.load('picker', r))
  const accessToken = await getToken()
  const g = window.google
  const picked: { id: string; name: string }[] = await new Promise((resolve) => {
    const view = new g.picker.DocsView(g.picker.ViewId.DOCS).setMimeTypes(XLSX_MIME).setIncludeFolders(true)
    new g.picker.PickerBuilder()
      .addView(view)
      .enableFeature(g.picker.Feature.MULTISELECT_ENABLED)
      .setOAuthToken(accessToken)
      .setDeveloperKey(API_KEY)
      .setAppId(APP_ID)
      .setTitle('Choose Appendix Q files')
      .setCallback((d: any) => {
        if (d.action === g.picker.Action.PICKED) resolve(d.docs.map((x: any) => ({ id: x.id, name: x.name })))
        if (d.action === g.picker.Action.CANCEL) resolve([])
      })
      .build()
      .setVisible(true)
  })
  return Promise.all(picked.map(async ({ id, name }) => {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) throw new Error(`Could not download ${name} from Google Drive`)
    return new File([await res.blob()], name, { type: XLSX_MIME })
  }))
}
