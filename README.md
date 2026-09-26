# A Web-Based Physics and Circuits Laboratory Management System with AI Capabilities for NU Fairview

Documentation for the NU Fairview Physics and Circuits Laboratory project. Open `Docs.html` for the current paper and `index.html` for navigation.

Selected diagram pages in `Docs.html` have individual **Download A4 PDF** buttons: DFD Process 2.0, the second Activity Diagram (Figure 12 / Process 2.0), complete ERD A4, Swimlane, Figure 2 Use Case Diagram, and Deployment. Each download contains one complete A4 portrait diagram. The controls sit outside the paper and are excluded from print and the Google Docs sync source. PDFs are in `assets/downloads/diagrams/`, with review copies in `output/pdf/`. Regenerate and verify with `node integrations/system-diagrams/export-selected-diagrams.cjs`; `PLAYWRIGHT_MODULE` and `PDFJS_ROOT` can point to installed browser/PDF runtimes.

## Local workspace and deployment root

This repository now lives in `PBL1/Documentation/`. Its sibling `PBL1/System/` is reserved for a separate application repository and is not part of this repository. Run documentation scripts from `Documentation/`.

GitHub still contains `index.html`, `Docs.html`, `assets/` and `integrations/` at the repository root. Keep the existing Vercel project's Root Directory at the repository root (`.` / blank), not `Documentation`. Moving the local checkout does not change deployed URLs or require `../assets/` links.

Current AI-related scope: an authenticated informational Q&A chatbot for Class Representatives and Faculty, plus Head Lab Inventory Forecasting under Inventory Management. Forecasting uses existing stock and actual usage to recommend next-month consumable restocking or identify potential reusable-equipment shortages. Results are dynamic and advisory; insufficient history is reported explicitly. No automatic purchase, stock change, AI-written report summary or AI reservation action is introduced. A usage-based baseline must not be described as a validated trained AI model. See [forecasting scope and change report](integrations/inventory-forecast/UPDATE.md).

The confirmed Class Representative reservation design now requires **As a Group** or **As a Student Only** for both on-schedule non-laboratory and out-of-schedule requests. Schedule Type and Reservation Type remain separate. [Reservation-Form.html](Reservation-Form.html) previews the required form behavior with sample data; this documentation repository does not contain a live reservation backend. See [Changes Made](integrations/reservation-type/CHANGES.md) for the updated paper sections and diagrams. The existing Activity Editor Supabase project stores diagram drafts, not laboratory bookings.

Head Laboratory is the sole administrator of laboratory logs, schedules and daily tasks. Physics and Circuits Staff retain their inventory, issuance/return and disposal responsibilities. The use case and all DFD levels use this same role boundary.

CSS filenames, storage keys, and the internal diagram editor API retain their legacy names for compatibility; these are not the project name. The Apps Script legacy cover-title matcher is also retained to update existing Google Doc copies safely.

The paper now contains the screen-aligned connected ERD baseline and its complete one-page A4 appendix. This is a logical persistent-data design; Supabase deployment and database enforcement remain implementation work. The readable viewer and dictionary use the same canonical model.

## Navigation and publication checks

The primary menu links directly to Documentation, Use Case, DFD Levels 0–2 and the Google Doc copy. Traceable views are retired; old URLs redirect to the canonical compact pages. The Google Docs link only opens the document; the separate Update Google Docs action performs a sync.

Run `node integrations/google-docs/check-navigation.cjs` with Playwright available to check all eight menus, mobile return links, redirects and clean exports. The diagram and A4 checks in the same directory are read-only unless passed `--render` to regenerate local PNGs.

## System Alignment Analytics

Open `Analytics.html` from any primary menu. This is a design-audit page, not an application usage dashboard or an AI feature. It shows traceability for 20 main use cases, explicit structural checks, the six planned artifact categories, recorded backlog status, fixes, and unresolved consultation decisions. The connected ERD baseline is documented separately; audit percentages do not measure database completion or production readiness. Rebuild audit fingerprints after changes to the paper or ERD sources.

With Playwright and Edge available, run `node integrations/system-audit/build.cjs --write` to regenerate `assets/system-audit.json`, then `node integrations/system-audit/build.cjs --check` and `node integrations/system-audit/check.cjs`. Set `PLAYWRIGHT_MODULE` if Playwright is installed outside the workspace. The build renders DFD 0 for comparison and reads the documentation, use-case source and canonical DFD models. Percentages use the formulas listed on the page; they are not a panel grade. The page verifies source fingerprints and refuses to display stale percentages. Rebuild after source changes and include the generated JSON when publishing.

The current review adds seven Level 2 realizations of existing parent flows: D2 reads at 2.1 and 2.3; three laboratory-role return inputs at 4.4; D4 stock at 4.3; D5 borrower evidence at 5.3. The later Lab End-Term Report clarification removes D7 daily-task and D10 disposal reporting reads: With the subsequent inventory-forecast extension, Level 1 has 75 flows, Level 2 has 94 boundary realizations across 24 children, and Level 0 has 48 external flows. The clearance-to-report internal flow is also removed. No actor or main use case was removed.

Live Server is supported: fingerprint verification ignores only its recognized, marked auto-reload script immediately before the closing body tag. Authored HTML, other scripts and comments remain fingerprinted, so actual source edits still require an audit rebuild. CRLF/LF differences are normalized on both build and browser sides.

## Connected ERD baseline

ERD.html, ERD-A4.html and ERD-PRINT.html use the same screen-aligned model. The single portrait A4 diagram contains all 30 entities, 208 fields and 61 connecting relationships together. The browser dictionary preserves full definitions and workflow/implementation boundaries. SERVICE_REQUEST is distinct from the future confirmed RESERVATION; laboratory and room scope are separate. See assets/erd/DESIGN.md and integrations/erd/SCREEN-ALIGNMENT.md. No Supabase or remote Google Doc is changed.
