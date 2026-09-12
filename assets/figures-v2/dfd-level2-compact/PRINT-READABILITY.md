# Level 2 publication figures

Level 1 and Level 2 arrowheads are now 12 × 12 internal units (previously 9 × 9), with the marker reference at the triangle tip so endpoints remain attached. Level 1 reserves incoming peer ports first with 14-unit head spacing; Level 2 peer ports keep at least 14 units. Both audits check head separation. Editor storage versions are Level 1 v4 and Level 2 v7, superseding older keys mentioned below.

All Level 1 and Level 2 stores use an open-right outline: top, left and bottom borders plus the identifier divider. The white fill has no rectangular stroke, so no right border remains. Store dimensions, labels and left-edge arrow endpoints are preserved. Both geometry audits assert this outline for every store before rendering publication PNGs.

The active source is `dfd-level2-model.json`, drawn by `dfd-level2-renderer.js` through `dfd-level2-compact.html?process=p1` (p1–p5). The former dedicated P5 script is no longer loaded.

Each parent has its own 1200 × 950 publication frame and 2400 × 1900 PNG. The internal coordinate space is 1878 × 1486.75, widened slightly to fit distinct ordered store lanes while preserving the publication aspect ratio. Boundary labels are 27 units, approximately 7.1 pt at the current A4 document width. Shapes are white with black borders; entity-specific arrow colors match Level 1. No label box covers other arrows: only the label's own stroke is interrupted.

All 74 current Level 1 flows are mapped by stable parent IDs. Repeated store reads/writes represent separate child stages, not additional parent features.

| Parent | Child boundary exchanges | Internal exchanges |
| --- | ---: | ---: |
| 1 | 10 | 2 |
| 2 | 23 | 3 |
| 3 | 9 | 3 |
| 4 | 23 | 4 |
| 5 | 18 | 3 |

Short print aliases have full canonical names in the interactive flow reference. Each figure has unique peers, uniform dimensions within each node class, separate ports and paths, and a vertically ordered process column. Logs, schedules and daily tasks remain Head Laboratory only; Q&A remains informational.

Entity right-edge ports and store left-edge ports now follow subprocess order from top to bottom, not shortest-route-first. For example, connections involving 4.1 sit above 4.3, then 4.4 and 4.5 on the same store. Incoming and outgoing flows participate in the same ordering; flows belonging to one subprocess preserve that process's approach-port order. This user override replaces the skill's distance-based entity-port ordering. Existing approved crossings remain without junctions, with no shared ports or overlapping runs. The editor storage version is updated so older saved routes do not override the new arrangement. The audit checks peer-port ordering on all five figures as well as balancing, attached endpoints, label clearance and editor behavior.

Run `node integrations/google-docs/check-level2.cjs --render` with Playwright available to audit all figures and regenerate the five PNGs. Run `check-pages.cjs` to verify intact A4 images and read-only sync capture. Browser edits are stored locally; print and embed/export use the audited authored layout.

Vertical routing lanes mirror across both axes. For a peer below its process port, the store side starts rightmost and steps left; the entity side starts leftmost and steps right. For a peer above its process port, both orders reverse. Upward and downward geometric runs use separate lane bands; arrow direction itself is unchanged. All lanes on each side are distinct with 20 internal units (25% wider than the previous 16-unit spacing) of separation, including disjoint spans. In P5, the D3, D7 and D2 inputs into 5.4 step left-to-right, while the 5.5 End-Term Report return sits left of the Head Laboratory report-request lane. The audit checks these examples, both geometric orientations and the existing top-to-bottom peer ports. Editor storage version 6 prevents older manual routes from overriding this layout.

Level 0 uses the same visual rules in `../dfd-level0/dfd-level0-portrait.js`: one process, six uniform entities, 46 independent horizontal arrows, 22-unit labels on a 1200 × 1500 portrait canvas, exported at 2400 × 3000. It derives boundary exchanges directly from Level 1. Run `check-dfd-scope.cjs --render` to audit and regenerate it.

Google Docs is a separate pagination engine: after syncing Context Diagram and Data Flow Diagrams, review the actual document's A4 page setup, image sizing and page breaks. No live sync is performed by these checks.
