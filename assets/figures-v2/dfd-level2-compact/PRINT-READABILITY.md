# Level 2 publication figures

The active source is `dfd-level2-model.json`, drawn by `dfd-level2-renderer.js` through `dfd-level2-compact.html?process=p1` (p1–p5). The former dedicated P5 script is no longer loaded.

Each parent has its own 1200 × 950 publication frame and 2400 × 1900 PNG. The internal coordinate space is 1770 × 1401.25. Boundary labels are 27 units, approximately 7.5 pt at the current A4 document width. Shapes are white with black borders; entity-specific arrow colors match Level 1. No label box covers other arrows: only the label's own stroke is interrupted.

All 74 current Level 1 flows are mapped by stable parent IDs. Repeated store reads/writes represent separate child stages, not additional parent features.

| Parent | Child boundary exchanges | Internal exchanges |
| --- | ---: | ---: |
| 1 | 10 | 2 |
| 2 | 23 | 3 |
| 3 | 9 | 3 |
| 4 | 23 | 4 |
| 5 | 18 | 3 |

Short print aliases have full canonical names in the interactive flow reference. Each figure has unique peers, uniform dimensions within each node class, separate ports and paths, and a vertically ordered process column. Logs, schedules and daily tasks remain Head Laboratory only; Q&A remains informational.

Run `node integrations/google-docs/check-level2.cjs --render` with Playwright available to audit all figures and regenerate the five PNGs. Run `check-pages.cjs` to verify intact A4 images and read-only sync capture. Browser edits are stored locally; print and embed/export use the audited authored layout.

Level 0 uses the same visual rules in `../dfd-level0/dfd-level0-portrait.js`: one process, six uniform entities, 46 independent horizontal arrows, 22-unit labels on a 1200 × 1500 portrait canvas, exported at 2400 × 3000. It derives boundary exchanges directly from Level 1. Run `check-dfd-scope.cjs --render` to audit and regenerate it.

Google Docs is a separate pagination engine: after syncing Context Diagram and Data Flow Diagrams, review the actual document's A4 page setup, image sizing and page breaks. No live sync is performed by these checks.
