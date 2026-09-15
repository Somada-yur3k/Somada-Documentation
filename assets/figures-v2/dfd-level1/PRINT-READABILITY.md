# Level 1 — one A4 portrait sheet

The approved constraints are one portrait sheet, all 74 separate arrows, no repeated entities or stores, and line crossings allowed only without junctions or shared segments. This is an explicit exception to the DFD arrow skill's default prohibition on crossings; its other integrity rules remain in effect.

## Editable sources

- `dfd-level1-model.json`: unchanged canonical identities, endpoints and full labels for 46 external flows and 28 store flows.
- `dfd-level1-portrait.js`: deterministic SVG layout with the complete canonical name on every arrow. The HTML reference retains the same names and endpoints.
- `dfd-level1-source.html`: editor, optional `?grid=1` owner bands, and authored `?embed=1` / `?export=1` output.
- `dfd-level1-draft.png`: 3540 × 4030 raster export used by Docs.html pagination. Google Docs captures the equivalent live SVG with a 1880 × 2140 viewBox.

Canvas: 1880 × 2140. All six entities use 170 × 264; all five processes use 195 × 390; all ten stores use 250 × 96 with a 64-unit identifier compartment. Taller entity/store symbols give connection points more vertical space. No logical node is repeated. Every arrow retains one path, one source port, one destination port, one arrowhead and one noun label.

The local A4 paper has 20 mm top/bottom and 18 mm side margins. Level 1's image height is capped at 220 mm so its headings and caption fit on the same sheet. Full flow names replace abbreviated print labels. The base font is 24 SVG units, fitted to the available label bay and row spacing without truncating text. On the existing single A4 sheet, labels are approximately 5–6.3 pt and process text about 7.6 pt; the dense reservation band uses the smaller sizes. This is a readability tradeoff, not a claim that the former 7.5 pt abbreviated-label minimum is retained. Physical print quality should be checked at 100% scale.

The user also requested plain labels without boxes or borders, overriding the skill's default pill styling. Only each label's own connector stroke has a transparent gap under the text, leaving the white paper visible; there is no covering rectangle. Clearance extends 6 units beyond each text edge (previously 2). The gap follows label/route edits and is included in PNG and Google Docs exports. The latest vertical-only revision increases separation between coexisting vertical runs to at least 9 units on the actor side (previously 5.5), and 8 units on the store side (previously 5.2). Routes in distant, non-overlapping Y regions can occupy nearby but strictly different X coordinates; no coordinate, segment, bend or port is shared. The latest correction also reserves at least 8 units between horizontal rows, including the Class Representative bend near Faculty Credentials. The editor uses the dfd-level1-full-labels-v5 storage key so older offsets cannot undo this spacing. A rendered-pixel test verifies white padding and visible connector strokes on both sides of all 74 labels.

## Routing and verification

Each process edge is partitioned into contiguous owner bands. Each flow has its own orthogonal three-segment path and distinct ports. The revised layout has 272 proper crossings. Nodes remain on one portrait canvas and no extra bends are introduced. There are no shared runs, shared bends/ports, labels over unrelated arrows, label/node overlaps, or connectors through unrelated nodes. Crossings are not connections. The printed crossing and abbreviation footer notes were removed at the user’s request.

Printed arrow names exactly match the canonical model, including On-Schedule Non-Laboratory Request, Class Representative Account Details and Reservation / Approval Record. No model flow was renamed, grouped or removed. Existing compact node titles are separate from the arrow-label change.

Run from the repository root with Playwright available:

```
node integrations/google-docs/check-level1.cjs
node integrations/google-docs/check-level1.cjs --render
node integrations/google-docs/check-pages.cjs
node integrations/google-docs/check-sync.cjs
node integrations/google-docs/check-lifecycle.cjs
```

The geometry check balances all 46 boundary flows exactly against Level 0 and tests hover linkage, label dragging, internal-segment dragging with fixed endpoints, persistence, reset, and authored print/embed/export. The page test checks one intact Level 1 figure with heading/caption, the current A4 sheets and their numbering, all current source tables and nine figures, and six read-only DFD sync images. It does not send a Google Docs update.

Browser print and Google Docs are different layout engines. Redeploy the image-sizing fix in `integrations/google-docs/Code.gs` to avoid the old 480-pixel width cap; then inspect Google Docs page setup and pagination after syncing. No claim of identical live Google Docs pagination is made without that review.

## Approved role and flow revision

Removed three Laboratory Dashboard presentation arrows, two staff Daily Task Entry arrows, and—under the latest user-approved role correction—two staff Usage Entry arrows (81 → 74). Dashboard screens remain a feature; they are intentionally omitted from DFD boundary presentation. Only Head Laboratory sends Schedule Update, Usage Entry and Daily Task Entry; staff do not manage laboratory logs, schedules or daily tasks. Head Laboratory is last in the Level 1 entity column. The matching Level 0 has 46 flows. Level 2 Process 5 exposes the same 17 retained boundary exchanges, including all ten store exchanges, and clearly labels Head-only daily tasks. Its source remains editable and its publication frame remains 1200 × 950. No other Level 1 flows were changed or removed.

Run `node integrations/google-docs/check-dfd-scope.cjs --render` for role scope, parent balancing and Level 0 geometry, and to regenerate the portrait Level 0 PNG. Run `node integrations/google-docs/check-level2.cjs --render` for all five Level 2 models, geometry, editor interactions and publication PNGs. P5's 17 parent flows are realized by 19 child exchanges because schedule and usage write at separate stages and clearance now reads borrower evidence from D5. Select Context Diagram and Data Flow Diagrams to sync these refreshed images. Review first; these checks do not update a live Google Doc.
