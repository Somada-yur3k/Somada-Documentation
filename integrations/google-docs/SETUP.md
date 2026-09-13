# Connect the new Google Doc copy

Target: https://docs.google.com/document/d/11Q2UAiRIxcR_Pc5mb4ieqBvsA-t9Stb759jTH2tizEM/edit

The older document is never targeted. The integration is prepared locally; it cannot write to Google until you deploy and authorize your own Apps Script project.

## One-time setup

1. Sign into the Google account that can edit the new document copy.
2. Open https://script.google.com and create a **New project** named **Laboratory Documentation Sync**.
3. Replace the default `Code.gs` with the complete contents of [Code.gs](Code.gs) in this folder, then save.
4. Select **setupSync**, then **Run**. Review and grant the Google permissions. The script needs document access and Drive access to create backups and prepare images/tables. It does not change document sharing.
5. Copy the **Sync key** from the execution log. Keep it private; do not commit it or paste it into chat. Running setupSync again returns the same key.
6. Choose **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Only myself**. Do not deploy with anonymous/public access.
7. Copy the deployed URL ending in `/exec`, and open it once in the same browser to complete any Google sign-in prompts. It should show the target connection page. If your organization prevents this deployment, the administrator must allow it; making the document publicly editable is not a substitute.
8. Open local **Docs.html** through your IDE's Live Server or another localhost HTTP server. Images cannot be collected from `file://` mode.
9. Click **Update Google Docs**, paste the deployment URL and sync key, and select the content to update. The default selection is the revised cover title and Project Overview.
10. Click **Update selected content**. Allow the result window to open. Google displays success or an error there. The local page only reports that the update was sent.

The endpoint is remembered in this browser. The key stays in the open page's memory and must be re-entered after a reload. Google authorization may occasionally need renewal.

## Text, tables, and diagrams

- Each checked section's **contents** are replaced using its existing heading as an anchor. Unchecked sections, cover authors, document headers/footers, and other tabs are preserved.
- Manual changes inside a checked section will be replaced. This is one-way sync, not automatic merging.
- Select **Data Flow Diagrams** to send the rendered Compact Level 1 and all five Compact Level 2 PNG figures. The embedded Level 1 is rasterized from its current SVG. Existing PNG figures use the exact bytes referenced by Docs.html.
- Other images travel as PNG bytes, including the use case, context diagram, Scrum figure, and ERD if their sections are selected. No public image hosting is needed.
- Missing images, empty sections, a wrong target ID, ambiguous headings, and oversized updates fail before replacing target content.
- All tables and images are prepared in a private temporary Google document before changing the target. A backup of the complete target document is created immediately before applying the selected sections.
- Google document edits are not a single transaction. If a Google error interrupts an update, the result page links to the backup so you can recover. Avoid simultaneous manual edits while syncing.
- The first document tab must contain the standard section headings. The title anchor accepts the old title or the current local title. Arbitrary Google title changes require updating the anchor first.

## Formatting and review

Body paragraphs are justified. Before replacement, the sync samples an existing normal body paragraph in the selected section and reuses its font family, font size, text color, indents, line spacing, and paragraph spacing. If that section has no suitable paragraph, it samples another body paragraph in the new Google Doc copy; if none exists, the fallback is Times New Roman 11 pt with 8 pt space after. It never reads or changes the original document.

Inline bold and italic formatting from the rendered local page is retained in paragraphs, headings, and table cells. The cover title is bold and retains the Google Doc's existing title font, size, and paragraph alignment. Existing main section headings are left untouched. Captions and figures remain centered; lists and new subheadings are left-aligned. Tables retain their compact layout rather than inheriting body justification.

Google Docs is a separate publishing layout from HTML: merged table cells and exact HTML styling are not copied. Image aspect ratios are retained and sized to the page. Review page breaks and refresh/rebuild the table of contents after syncing; hardcoded page numbers are not recalculated.

Synced tables are plain: no colored cell shading, black text, thin black borders, and compact Arial 9 pt type. Bold/italic labels and text remain supported. Base typography is applied once per table; only emphasized cells receive extra formatting calls. This reduces formatting work, but image uploads and Google processing still affect total sync time. The local HTML paper uses the same plain table treatment.

### Local A4 pages

`Docs.html` now displays separate 210 × 297 mm sheets, with 20 mm top/bottom and 18 mm left/right margins. The cover is unnumbered; the Table of Contents starts at page 1. The local TOC is filled from the actual generated pages. Zoom scales the sheets without changing their pagination; small screens can scroll horizontally.

The paper uses Times New Roman 11 pt justified body text, bold headings, and black-and-white Arial 9 pt tables. Long tables flow across sheets. Layout-only wrappers are flattened in the preview so a following section break cannot skip remaining table rows. The complete React source remains separate and is used for Google Docs sync, not the page fragments. No paper wording is rewritten by pagination.

For PDF output, use **Print / Export PDF**, A4, 100% scale, and turn off the browser's own headers and footers. The on-page footers already contain the page numbers. Wait for page preparation to finish before printing. This local presentation change does not require redeploying Apps Script.

The preview uses the checked-in Level 1 PNG; Google Docs sync continues capturing the live embedded SVG. Browser and Google Docs layout engines differ, so identical page breaks in Google Docs are not guaranteed. Google Docs' own TOC still needs refreshing after sync.

### Level 1 portrait print layout

Level 1 now uses one A4 portrait figure with all 74 independent arrows (46 external and 28 store flows). In the local paper, the section heading, Level 1 heading, image and caption fit together on one numbered A4 sheet. Arrow labels have no box/border, print at approximately 7.52 pt, and have clear white space underneath with connected strokes on both sides; process names remain at least 8 pt. The latest vertical-only revision separates coexisting actor-side vertical runs by at least 9 units (previously 5.5), and store-side runs by at least 8 units (previously 5.2), with at least 8 units between horizontal rows in each side corridor; fonts and arrowheads are unchanged. All routes retain strictly distinct X coordinates; nearby X positions are permitted only for distant, non-overlapping vertical spans. Short equivalent labels map to unchanged full flow names in the diagram editor's **Full flow names** reference. Only the seven user-approved flows were removed; no remaining flows are grouped, and all six external entities and ten data stores appear once.

Crossings without junctions are explicitly allowed for this layout. Independent lanes and ports never merge. The layout remains dense, so proof-print at A4 / 100% before final submission. Hover tracing and reversible editing are still available in the standalone editor. Saved browser edits and routing guides are excluded from print, embeds and exports; the authored diagram is used consistently for the local PNG and Google Docs capture.

Refresh `Docs.html`, then open **Level 1 — Overview** to review. To get full-width image fitting in Google Docs, redeploy the current `Code.gs` build `2026-09-11-image-sizing-1` before syncing **Data Flow Diagrams**. That selection also replaces the five Level 2 figures, so review all selected section content first. No live document update has been performed locally.

Run `node integrations/google-docs/check-level1.cjs` for flow balancing, port/route/label geometry, A4 type size, and editor/print/export tests. Add `--render` to regenerate `dfd-level1-draft.png` after a passing geometry audit. Run `check-pages.cjs` to verify the actual A4 sheet, retained tables/figures, and read-only Google Docs image capture. Both browser checks accept `PLAYWRIGHT_MODULE`.

Pagination uses locally vendored [Paged.js 0.4.3](https://github.com/pagedjs/pagedjs), with its MIT license in `assets/vendor/paged-LICENSE.md`. Paper styles are in `assets/doc-paper.css`, screen/print chrome in `assets/doc-pages.css`, and preview preparation in `assets/doc-pages.js`.

Browser regression checks: install/provide Playwright, then run `node integrations/google-docs/check-pages.cjs` (optionally set `PLAYWRIGHT_MODULE` to an installed module path). The check uses local content only; it does not send any Google Docs update.

### Apply the formatting update to an existing deployment

1. Replace the Apps Script editor's `Code.gs` with this folder's updated `Code.gs` and save.
2. Select **Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy**. Keep **Execute as: Me** and **Only myself**. Editing the existing deployment keeps the same `/exec` URL and sync key; no new key is needed.
3. Refresh local `Docs.html` to load the updated client (it sends formatting-aware version 2). An old server rejects this version instead of silently dropping formatting.
4. Use the same signed-in InPrivate window for both the `/exec` connection page and local Docs.html. Start with **Cover title + Project Overview**, then review the result before selecting other sections. Selected content will be replaced; a backup is created first.

The local documentation is the content source, including any unresolved old wording or diagram issues. Synchronization does not approve new AI features or correct model semantics automatically.

### Fix for “Document is closed; its contents cannot be updated”

Build `2026-09-10-lifecycle-1` keeps the temporary preparation document open until all element copies have been inserted and the target saved. It also reacquires the target body and section boundaries just before writing. Previously, the preparation document was closed before its copied service elements were consumed. Google documents cannot be edited after closing without reopening them; see [Document.saveAndClose](https://developers.google.com/apps-script/reference/document/document#saveAndClose()).

Replacement now materializes the incoming elements and inserts them before removing the original section contents. If insertion fails, that section's original content has not been deleted (partially inserted duplicates can remain). Earlier selected sections may already have changed, so the backup is still necessary. Preparation-file cleanup errors no longer turn a successful save into an interrupted result. Error pages include the failing step and all result pages show the build number.

If you already saw an interrupted update:

1. Keep the **Open the backup** link from that failed attempt. A later backup may contain the already-interrupted document, so do not discard the earlier backup.
2. Replace Apps Script `Code.gs`, save, and deploy a **New version** using the existing deployment. Open its `/exec` URL and confirm `Sync build: 2026-09-10-lifecycle-1` is shown.
3. Refresh `Docs.html`. Compare the affected section with the earlier backup; then retry just that section using the intended local content. Check the Google result page before selecting more sections. No automatic restore or live deployment is performed by these local changes.

## Verification status

Build `2026-09-11-image-sizing-1` also fixes image sizing: page dimensions/margins are points, while `InlineImage` dimensions are pixels. Image fitting now converts at 96/72 instead of treating points as pixels and imposing a 480 × 650 pixel cap. On the local A4 margin profile this allows approximately 657 px of usable width. Aspect ratio is preserved; 40 pt of vertical space is reserved for caption/spacing. This does not, by itself, solve overcrowded diagram labels. See [Body page units](https://developers.google.com/apps-script/reference/document/body#getPageWidth()) and [InlineImage sizing](https://developers.google.com/apps-script/reference/document/inline-image#setWidth(Integer)). Deploy a new Apps Script version to apply it; no live Google Doc has been changed by this local edit.

Local syntax and mock-document checks can run without Google credentials. A live end-to-end update still requires the authorized deployment above. First run the default title/overview update and inspect its result and backup before selecting larger sections.

Run `node integrations/google-docs/check-sync.cjs` for the formatting/content contract and `node integrations/google-docs/check-lifecycle.cjs` for closed-source handles, multiple sections, backup ordering, insertion failures, and cleanup. These are simulations, not a live Google Apps Script execution.

Official references: [Apps Script web apps](https://developers.google.com/apps-script/guides/web), [Document body operations](https://developers.google.com/apps-script/reference/document/body), [Drive backup copies](https://developers.google.com/apps-script/reference/drive/file#makeCopy(String)).

## Approved role and flow revision

Removed three Laboratory Dashboard presentation arrows, two staff Daily Task Entry arrows, and—under the latest user-approved role correction—two staff Usage Entry arrows (81 → 74). Dashboard screens remain a feature; they are intentionally omitted from DFD boundary presentation. Only Head Laboratory sends Schedule Update, Usage Entry and Daily Task Entry; staff do not manage laboratory logs, schedules or daily tasks. Head Laboratory is last in the Level 1 entity column. The matching Level 0 has 46 flows. Level 2 Process 5 exposes the same 17 retained boundary exchanges, including all ten store exchanges, and clearly labels Head-only daily tasks. Its source remains editable and its publication frame remains 1200 × 950. No other Level 1 flows were changed or removed.

Run `node integrations/google-docs/check-dfd-scope.cjs --render` for role scope, parent balancing and Level 0 geometry, and to regenerate the portrait Level 0 PNG. Run `node integrations/google-docs/check-level2.cjs --render` for all five Level 2 models, geometry, editor interactions and publication PNGs. P5's 17 parent flows are realized by 19 child exchanges because schedule and usage write at separate stages and clearance now reads borrower evidence from D5. Select Context Diagram and Data Flow Diagrams to sync these refreshed images. Review first; these checks do not update a live Google Doc.
