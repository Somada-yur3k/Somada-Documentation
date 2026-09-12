# Level 1 — one A4 portrait sheet

The approved constraints are one portrait sheet, all 76 separate arrows, no repeated entities or stores, and line crossings allowed only without junctions or shared segments. This is an explicit exception to the DFD arrow skill's default prohibition on crossings; its other integrity rules remain in effect.

## Editable sources

- `dfd-level1-model.json`: unchanged canonical identities, endpoints and full labels for 48 external flows and 28 store flows.
- `dfd-level1-portrait.js`: deterministic SVG layout and short, equivalent print labels. The HTML reference table maps every arrow to its full name.
- `dfd-level1-source.html`: editor, optional `?grid=1` owner bands, and authored `?embed=1` / `?export=1` output.
- `dfd-level1-draft.png`: 3540 × 4440 raster export used by Docs.html pagination. Google Docs captures the equivalent live SVG at 1770 × 2220.

Canvas: 1770 × 2220. All six entities use 170 × 264; all five processes use 195 × 390; all ten stores use 250 × 96 with a 64-unit identifier compartment. Taller entity/store symbols give connection points more vertical space. No logical node is repeated. Every arrow retains one path, one source port, one destination port, one arrowhead and one noun label.

The local A4 paper has 20 mm top/bottom and 18 mm side margins. Level 1's image height is capped at 220 mm so its headings and caption fit on the same sheet. At the user's request, flow label size is reduced slightly from 29 to 27 SVG units (about 7%, now 7.52 pt on the local A4 sheet); process labels remain about 8.0 pt. Physical print quality should be checked at 100% scale.

The user also requested plain labels without boxes or borders, overriding the skill's default pill styling. Only each label's own connector stroke has a transparent gap under the text, leaving the white paper visible; there is no covering rectangle. Clearance extends 6 units beyond each text edge (previously 2). The gap follows label/route edits and is included in PNG and Google Docs exports. The latest vertical-only revision increases separation between coexisting vertical runs to at least 9 units on the actor side (previously 5.5), and 8 units on the store side (previously 5.2). Routes in distant, non-overlapping Y regions can occupy nearby but strictly different X coordinates; no coordinate, segment, bend or port is shared. The latest correction also reserves at least 8 units between horizontal rows, including the Class Representative bend near Faculty Credentials. The editor uses the 76-clear-rows-v2 storage key so older offsets cannot undo this spacing. A rendered-pixel test verifies white padding and visible connector strokes on both sides of all 76 labels.

## Routing and verification

Each process edge is partitioned into contiguous owner bands. Each flow has its own orthogonal three-segment path and distinct ports. The revised layout has 296 proper crossings. Nodes remain on one portrait canvas and no extra bends are introduced. There are no shared runs, shared bends/ports, labels over unrelated arrows, label/node overlaps, or connectors through unrelated nodes. Crossings are not connections; this is stated on the figure.

The reference dictionary preserves canonical labels. Abbreviations such as `res.`, `appr.`, `acct.`, `txn.`, `sched.`, `rec.`, `upd.` and `Admin.` save horizontal space; they do not combine flows. `Off-sched. req.` denotes the existing Out-of-Schedule Request.

Run from the repository root with Playwright available:

```
node integrations/google-docs/check-level1.cjs
node integrations/google-docs/check-level1.cjs --render
node integrations/google-docs/check-pages.cjs
node integrations/google-docs/check-sync.cjs
node integrations/google-docs/check-lifecycle.cjs
```

The geometry check balances all 48 boundary flows exactly against Level 0 and tests hover linkage, label dragging, internal-segment dragging with fixed endpoints, persistence, reset, and authored print/embed/export. The page test checks one intact Level 1 figure with heading/caption, the current 47 A4 sheets and their numbering, all 24 source tables and ten figures, and six read-only DFD sync images. It does not send a Google Docs update.

Browser print and Google Docs are different layout engines. Redeploy the image-sizing fix in `integrations/google-docs/Code.gs` to avoid the old 480-pixel width cap; then inspect Google Docs page setup and pagination after syncing. No claim of identical live Google Docs pagination is made without that review.

## Approved role and flow revision

Removed exactly three Laboratory Dashboard presentation arrows and two staff Daily Task Entry arrows (81 → 76). Dashboard screens remain a feature; they are intentionally omitted from DFD boundary presentation. Only Head Laboratory sends Daily Task Entry; staff still send Usage Entry. Head Laboratory is last in the Level 1 entity column. The matching Level 0 has 48 flows. Level 2 Process 5 exposes the same 19 retained boundary exchanges, including all ten store exchanges, and clearly labels Head-only daily tasks. Its source remains editable and its publication frame remains 1200 × 950. No other Level 1 flows were changed or removed.

Run `node integrations/google-docs/check-dfd-scope.cjs --render` for role scope, parent balancing and Level 0 geometry, and to regenerate the portrait Level 0 PNG. Run `node integrations/google-docs/check-level2.cjs --render` for all five Level 2 models, geometry, editor interactions and publication PNGs. P5's 19 parent flows are realized by 20 child exchanges because schedule and usage write the same parent store at separate stages. Select Context Diagram and Data Flow Diagrams to sync these refreshed images. Review first; these checks do not update a live Google Doc.
