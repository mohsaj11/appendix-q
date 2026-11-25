# Appendix Q Summary

A web app that collates the monthly Appendix Q (Programme Review, Assurance & Acceptance Scorecard)
workbooks into one summary: which contractor works on which project, and whether each programme was
accepted this month and in the two months before, with the reason.

## Using it

1. On the **Upload files** tab, click **Add files** (or drag files onto the page) and add as many
   Appendix Q `.xlsx` files as you like, then click **Upload**.
2. If a file's Cover Sheet is missing something (no outcome ticked, no date), it is listed under
   "need a quick check" so you can fill it in.
3. Click **Generate report**. A **Dashboard** tab opens with a grid of projects (rows) against contractors
   (columns). Boxes are left blank where a contractor has no Appendix Q for that project. Every other box
   has a colour-coded checklist for the reporting month and the two months before it.
4. Click a box to see the reasons for each month: the "reasons given" text, the NEC4 clause 31.3 grounds
   that were ticked, and the reviewer's numbered comments.
5. **Export CSV** and **Print** (A3 landscape) are on the dashboard.

Files are read in the browser and never uploaded to a server. Uploaded data is kept in the browser's local
storage, so last month's files are still there next month. Uploading a file for the same contractor,
project and month again replaces the older one.

## What is read from each workbook

Only the **Cover Sheet** tab, matched by its labels rather than fixed cells:

| Summary field | Cover Sheet source |
| --- | --- |
| Contractor | `Enterprise Partner Name:` (falls back to the title, e.g. "… Programme - OTW") |
| Project | `Package Name:` (falls back to the title) |
| Month | `Submission Date:`, then the acceptance/assurance check dates, then a month in the file name (e.g. `Nov-26`, `2026-11`) |
| Accepted / not accepted | `Outcome for Acceptance / Non-acceptance Checks`: the drop-down beside it, or a mark (X, ✓, Yes) beside one of the three options |
| Reason | Text after `Not Accepted - reasons given:`, ticked NEC4 clause 31.3 reasons, and the numbered key points under `Comments` |

The parser lives in `src/lib/parseCoverSheet.ts`; its tests use sample workbooks in `tests/fixtures`
(made-up names, built by `npm run fixtures`).

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build    # static site in dist/
```

Stack: React 19, TypeScript, Vite, [read-excel-file](https://www.npmjs.com/package/read-excel-file), Vitest.

The GitHub Actions workflow runs the tests and build on every push and pull request.

## Hosting on Railway

The repo includes a `Dockerfile` (builds the site, then serves it with Caddy on Railway's `$PORT`) and
`railway.json`, so Railway needs no extra settings:

1. In Railway, choose **New Project → Deploy from GitHub repo** and pick `appendix-q`.
2. Once the first deploy finishes, open the service's **Settings → Networking → Generate Domain** to get a public URL.

Every push to `main` redeploys automatically.
