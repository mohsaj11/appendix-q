# Appendix Q Summary

A web app that collates the monthly Appendix Q (Programme Review, Assurance & Acceptance Scorecard)
workbooks into one summary: which contractor works on which project, and whether each programme was
accepted this month and in the two months before, with the reason.

## Using it

1. Click **Import Appendix Q files** (or drag files onto the page) and select all of the month's `.xlsx`
   files at once.
2. The **Summary** tab shows a grid of projects (rows) by contractors (columns). Hatched cells are
   pairs with no Appendix Q. Each cell has three pills for the selected month and the two before it
   (✓ accepted, ✗ not accepted, ? no outcome ticked, – no file), plus the reason for the latest month.
   Click a cell for the full detail of all three months.
3. The **Files** tab lists every imported file. Files the reader was unsure about are flagged ⚠ and
   listed first; correct the month, project, contractor or status there.
4. **Export CSV** downloads the grid, **Print** prints it (A3 landscape).

Files are read in the browser and never uploaded. Imported data is kept in the browser's local storage, so
each month's import adds to the history. Use **Download backup** / **Restore backup** to move it to
another computer. Importing a file for the same contractor, project and month again replaces the older one.

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

The GitHub Actions workflow tests every push and pull request, and deploys `main` to GitHub Pages once Pages
is enabled for the repository (Settings → Pages → Source: GitHub Actions).
