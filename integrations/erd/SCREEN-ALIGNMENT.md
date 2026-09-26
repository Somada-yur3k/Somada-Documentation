# Screen-aligned ERD baseline

Updated 2026-09-27. This is a concrete logical design grounded in the current screens and code. It is not a deployed Supabase database or a claim that all documented DFD operations already work.

## Corrections from the former draft

- Old RESERVATION mixed a submitted request and room booking. SERVICE_REQUEST now owns the header and status; REQUEST_REVISION owns the immutable form snapshot; RESERVATION is the separate future confirmed booking.
- LABORATORY now means Physics/Circuits. LAB_ROOM holds room choices; Staff scope and inventory attach to LABORATORY. REGULAR_SCHEDULE models weekly assigned/lecture blocks instead of one dated class.
- Account profiles now preserve name/contact/department/status/notes and map to Supabase Auth without storing password hashes. SECTION, FACULTY_SECTION and CLASS_REP_ASSIGNMENT preserve the current account form's section, designated Faculty and existing class dependencies.
- Classrep Group/Student Only and Faculty activity type are distinct fields; neither replaces Schedule Type. APPROVAL has one selected reviewer, a pending/final decision and rejection remarks; obsolete route_order is removed.
- Manual Additional Items allow a nullable ITEM FK with required name/type/unit snapshots. Participants preserve unique NU IDs, names and authorized class membership.
- ITEM has laboratory-owned stock, condition, unit and timestamps for Staff inventory. A future ledger unifies stock; the two current demo stock sources are not falsely represented as already connected.
- Borrowing connects to a future confirmed reservation, preserves requested versus issued quantities and selected-student accountability, and supports due/closed dates and partial returns. Faculty has no clearance workflow.
- DFD extension tables for stock movements, disposal, returns, clearance, logs and Lab Assistant are retained and explicitly marked Future. Forecasts remain derived outputs; no Forecast table is invented.

## Routing and current behavior

### 1. Class Representative requests

Choose Physics/Circuits, Group or Student Only, On/Out Schedule, room/time, optional equipment/materials and final review. Group accepts one or more selected students; Student Only accepts exactly one. Participant section is the authorized class section, not free-form input.

### 2. Faculty requests

Choose Laboratory, then Laboratory Activity or Non-Laboratory Activity. Laboratory Activity uses assigned On-Schedule room/time and skips Schedule Type. Non-Laboratory Activity chooses On/Out Schedule. Both include Schedule & Room, Equipment & Materials, and Review; Faculty has no Group/Student Only or student selection.

### 3. One academic reviewer, or none

Classrep On-Schedule -> assigned Faculty. Classrep Out-of-Schedule -> explicitly selected assigned Faculty or Dean. Faculty On-Schedule -> no academic approval. Faculty Non-Laboratory Activity Out-of-Schedule -> Dean. The demo has no automatic Faculty availability detection or chained approvals.

### 4. What submission and Dean review actually do

The server validates the form, derives requester/reference/routing, saves a detached snapshot and sets Pending Faculty/Dean Approval or Awaiting Reservation. Dean can decide only its pending Out-of-Schedule requests; rejection needs remarks. Decision history and requester status work. Faculty review is unfinished.

### 5. Laboratory Staff scope

Physics Staff sees Physics inventory, sample borrowing slips and submitted Physics requests. Circuits Staff sees the equivalent Circuits data. Inventory add/edit/delete works with whole-number stock and condition. Scope is server-derived from the account; querying or editing another laboratory is rejected.

### 6. Future reservation and borrowing connection

SERVICE_REQUEST -> current REQUEST_REVISION -> optional APPROVAL -> RESERVATION -> BORROWING -> BORROWING_ITEM / BORROWING_MEMBER -> RETURN_ENTRY -> student CLEARANCE where needed. Request approval, room booking, item issue and return are distinct records/events. Room-only usage may have no borrowing slip.

### 7. Database work still required

No Supabase Auth, SQL tables, RLS, live rosters, reservation holds, stock ledger, issuance/return, clearance, usage logs or assistant history are deployed. Borrowing rows and room schedules are samples. Staff stock edits do not alter the static request catalogue. Retained DFD extension tables are explicitly marked Future.

### 8. Integrity for integration

Validate authorized class/participants, same-lab room/item/Staff ownership, one active Classrep per section, one current revision and one final academic decision. Use transactions for live room conflicts and inventory posting. Snapshots and revision history preserve past names, quantities, approval and accountability.

## Evidence from the main application

| Screen/process | Source in ../System | Observed behavior |
| --- | --- | --- |
| Headlab account forms | src/features/accounts/types.ts; account-form-data.ts | Names, optional middle name, email/contact/notes, Faculty assigned sections, Classrep NU ID/designated Faculty/existing class; UI records only. |
| Classrep six-step request | src/features/lab-dashboard/request-review.ts; request-participants.ts | Group or Student Only on both schedule variants; unique student IDs; assigned Faculty On-Schedule; explicit Faculty/Dean selection Out-of-Schedule. |
| Faculty activity request | src/features/lab-dashboard/faculty-request-model.ts | Laboratory Activity skips Schedule Type and uses On-Schedule. Non-Laboratory Activity adds On/Out choice; Out routes to Dean. No student selection. |
| Schedule and Room Availability | src/features/lab-dashboard/room-availability.ts | Laboratory type and room are separate; weekly assigned/lecture blocks, dated sample requests, one-time requests and time conflicts. |
| Equipment and Materials | src/features/lab-dashboard/request-review.ts; equipment-catalog.ts | Optional item list; catalogue stock/type/lab validation; Additional Items do not require a catalogue ID. |
| Demo request persistence and Dean | src/features/demo-requests/store.ts; types.ts | Server-derived requester/reference/route/status, immutable snapshots, one pending-to-final Dean decision and required rejection reason. No room reservation or notification is created. |
| Staff laboratory workspaces | src/features/staff/store.ts; types.ts; src/app/api/demo/staff/ | Separate Physics/Circuits inventory rows, integer stock and condition, isolated sample borrowing slips, laboratory-filtered submitted requests. Inventory is not yet connected to the request sample catalogue. |
| Role routes and authentication | src/features/demo-auth/types.ts; session.ts | Six fixed demo roles. Supabase Auth and database/RLS are not deployed. Profiles must use Auth identity rather than store passwords in app tables. |

## A4 rendering and maintenance

The complete ERD is one portrait A4 page, following UsecaseDiagram_GUIDE/erd-a4.pdf. All 30 tables, 208 fields, and 61 orthogonal relationship lines appear together. Each relationship has its FK-row R ID and two Crow's Foot endpoints. Crossings have white overpasses and do not imply a joined relationship. Every table and field is present; the diagram is not a selected-link overview or a multi-page booklet. The browser supports zoom and keyboard/hover relationship tracing. Exact enum values, composite uniqueness and workflow constraints remain in ERD-TABLES.md and the browser dictionary.

Canonical source: assets/erd/model.js. Run integrations/erd/build-connected.cjs with PLAYWRIGHT_MODULE set to Playwright to regenerate the one-page SVG, PNG and PDF. Run integrations/erd/check.cjs to verify all fields, connectors, markers, A4 page count and controls. Supabase and remote Google Docs are not changed.
