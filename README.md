# A Web-Based Physics and Circuits Laboratory Management System with AI Capabilities for NU Fairview

Documentation for the NU Fairview Physics and Circuits Laboratory project. Open `Docs.html` for the current paper and `index.html` for navigation.

Current AI scope: an authenticated, informational Q&A chatbot for Class Representatives and Faculty. It answers item availability, schedule availability, operating hours, and the requester's own reservation status from authorized records. Forecasting, AI-written report summaries, and AI-driven reservation actions are outside the current consultation scope.

The confirmed Class Representative reservation design now requires **As a Group** or **As a Student Only** for both on-schedule non-laboratory and out-of-schedule requests. Schedule Type and Reservation Type remain separate. [Reservation-Form.html](Reservation-Form.html) previews the required form behavior with sample data; this documentation repository does not contain a live reservation backend. See [Changes Made](integrations/reservation-type/CHANGES.md) for the updated paper sections and diagrams. The existing Activity Editor Supabase project stores diagram drafts, not laboratory bookings.

Head Laboratory is the sole administrator of laboratory logs, schedules and daily tasks. Physics and Circuits Staff retain their inventory, issuance/return and disposal responsibilities. The use case and all DFD levels use this same role boundary.

CSS filenames, storage keys, and the internal diagram editor API retain their legacy names for compatibility; these are not the project name. The Apps Script legacy cover-title matcher is also retained to update existing Google Doc copies safely.

There is no current approved ERD. The paper shows a pending-design notice instead of the old schema image or entity list. The original image and legacy data remain archived in the repository, but are not presented as current schema or included in Google Docs sync content.

## Navigation and publication checks

The primary menu links directly to Documentation, Use Case, DFD Levels 0–2 and the Google Doc copy. Traceable views are retired; old URLs redirect to the canonical compact pages. The Google Docs link only opens the document; the separate Update Google Docs action performs a sync.

Run `node integrations/google-docs/check-navigation.cjs` with Playwright available to check all eight menus, mobile return links, redirects and clean exports. The diagram and A4 checks in the same directory are read-only unless passed `--render` to regenerate local PNGs.

## System Alignment Analytics

Open `Analytics.html` from any primary menu. This is a design-audit page, not an application usage dashboard or an AI feature. It shows traceability for 20 main use cases, explicit structural checks, the six planned artifact categories, recorded backlog status, fixes, and unresolved consultation decisions. ERD is pending; no database-completion score or production-readiness claim is made.

With Playwright and Edge available, run `node integrations/system-audit/build.cjs --write` to regenerate `assets/system-audit.json`, then `node integrations/system-audit/build.cjs --check` and `node integrations/system-audit/check.cjs`. Set `PLAYWRIGHT_MODULE` if Playwright is installed outside the workspace. The build renders DFD 0 for comparison and reads the documentation, use-case source and canonical DFD models. Percentages use the formulas listed on the page; they are not a panel grade. The page verifies source fingerprints and refuses to display stale percentages. Rebuild after source changes and include the generated JSON when publishing.

The current review adds seven Level 2 realizations of existing parent flows: D2 reads at 2.1 and 2.3; three laboratory-role return inputs at 4.4; D4 stock at 4.3; D5 borrower evidence at 5.3. The later Lab End-Term Report clarification removes D7 daily-task and D10 disposal reporting reads: Level 1 now has 72 flows, Level 2 has 88 boundary realizations, and Level 0 remains at 46 external flows. The clearance-to-report internal flow is also removed. No actor or main use case was removed.

Live Server is supported: fingerprint verification ignores only its recognized, marked auto-reload script immediately before the closing body tag. Authored HTML, other scripts and comments remain fingerprinted, so actual source edits still require an audit rebuild. CRLF/LF differences are normalized on both build and browser sides.
