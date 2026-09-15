# System Diagrams — additive UML supplement

Open [System-Diagrams.html](../../System-Diagrams.html) or [the A4 landscape PDF](diagrams.pdf). The publication contains eight sheets: SWIM-01 (the complete whole-system Swimlane), ACT-01–ACT-05 (one Activity diagram per DFD Level 1 parent), SEQ-01 (whole-system Sequence), and DEP-01 (Deployment). `models.js` retains the detailed workflow evidence catalog; `overview.js` renders the whole-system views, `process-activities.js` renders the five parent activities, and `render.js` renders Deployment and the page shell.

## Source authority

- `Docs.html`: current overview, 19 backlog rows, 24 events, 20 full descriptions (Tables 3–22), current scope and pending ERD notice.
- `assets/figures-v2/usecase-diagram-source.html`: the current six actors and 20 main use cases.
- `assets/figures-v2/dfd-level1/dfd-level1-model.json`: five parents, ten canonical logical record groups, 74 flows.
- `assets/figures-v2/dfd-level2-compact/dfd-level2-model.json`: 21 child processes and their directional exchanges.
- `README.md` and the consultation findings in `assets/system-audit.json`: boundaries and unresolved decisions.
- [OMG UML 2.5.1](https://www.omg.org/spec/UML/2.5.1): notation, not a source of laboratory requirements.

Archived entity arrays, archived ERD figures, retired traceable DFDs and the paused workspace/Supabase draft are not approved architecture. The documentation site's React implementation and its hosting are not evidence of the proposed laboratory application's runtime or database.

## Activity → Sequence mapping

SWIM-01 and SEQ-01 cover the same whole-system operation selection. Authentication leads to five alternative branches corresponding to DFD processes 1.0–5.0; these are not five mandatory consecutive transactions. Initial/final nodes mean the start/end of an operation attempt, not logout or termination of the entire system. Human partitions denote one eligible acting role per invocation; the complete eligible role list appears above each page. Persistent-record partitions/lifelines represent existing DFD stores, not an additional human actor or physical schema.

ACT-01–ACT-05 expand those five branches on separate landscape pages. Each contains only its parent's canonical subprocesses, with the exact numbers and names loaded from the Level 2 model. Initial nodes, guarded decisions, merges, action nodes and activity finals show the control flow; these are not copies of DFD data-flow arrows. Validation failures are summarized in actions, outcomes and page notes where a dedicated exception branch would overcrowd the page. They never authorize saving invalid input.

| Sheet | Activity focus | Canonical children |
| --- | --- | --- |
| ACT-01 | Login versus Head-Laboratory account issuance | 1.1–1.3 |
| ACT-02 | Availability, reservation/change validation, routed approval and tracking | 2.1–2.4 |
| ACT-03 | Scoped inquiry → evidence → grounded answer/refusal → conversation history | 3.1–3.4 |
| ACT-04 | Catalogue, issuance, return and disposal as alternative operations | 4.1–4.5 |
| ACT-05 | Schedule, usage/tasks, clearance and end-term reporting as alternative operations | 5.1–5.5 |

Every process page links directly to its matching Level 2 diagram and back to the complete Swimlane. The Sequence remains one whole-system sheet; it has not been split into five sequences.

The following 17 rows are the supporting workflow evidence catalog, NOT separate printed pages. Their details are grouped into the five process branches; all full conditions remain authoritative in Tables 3–22. The Activity swimlane loads the canonical Level 2 JSON and shows all 21 exact subprocess names and numbers once. Names within a grouped action identify the covered subprocesses, not a claim that all listed operations execute on every invocation. The selected workflow determines the applicable actions and order.

| Evidence entry | Workflow | Full description tables | DFD child processes |
| --- | --- | --- | --- |
| 01 | Authenticate / establish access | 3 | 1.1, 1.2 |
| 02 | Issue Class Representative account | 15 | 1.3 |
| 03 | Scheduled Faculty activity | 4, 5, 6 | 2.1, 2.2 |
| 04 | Routed non-lab / out-of-schedule request | 4, 5, 7 | 2.1, 2.2, 2.3 |
| 05 | Approve / reject | 13 | 2.3, 2.4 |
| 06 | Cancel reservation | 8 | 2.2, 2.4 |
| 07 | Reschedule with revalidation | 9 | 2.1–2.4 |
| 08 | Own status / history | 10, 11 | 2.4 |
| 09 | Informational Q&A | 14 | 3.1–3.4 |
| 10 | Inventory management | 16 | 4.1 |
| 11 | Issue equipment / borrowing slip | 17 | 4.2, 4.3 |
| 12 | Return reconciliation | 18 | 4.4 |
| 13 | Raise / settle clearance | 19 | 5.3 |
| 14 | View own-group clearance | 12 | 5.3 |
| 15 | Disposal | 20 | 4.5 |
| 16 | Schedule / usage / daily tasks | 21 | 5.1, 5.2 |
| 17 | End-term report | 22 | 5.4, 5.5 |

The single-sheet overviews summarize operations, validations and outcomes rather than reproducing every individual query or exception. Record-group reads/writes are logical operations, not SQL, API contracts, tables or transaction-boundary guarantees. UI and application behavior are combined in the documented web-system lifeline; no undocumented controllers/services are invented. Solid filled-head calls, dashed open-head replies and execution bars distinguish requests and responses. The Sequence `opt` requires authentication; its `alt` operands identify the selected authorized operation. Email/recipient delivery uses an open asynchronous arrow, without assuming delivery acknowledgement. Settlement remains conditional, not automatically performed at clearance creation.

No fork/join is introduced: the sources do not require parallel execution. Login failure ends separately. Selected operations return either a result, pending status or correction/refusal; this shared exit does not imply that invalid input was saved. Internal DFD arrows are data dependencies, not evidence that unrelated operations must execute in one session.

## Important scope and evidence limits

- All six actors can log in. Only Head Laboratory issues representative accounts, controls clearance and maintains logs/schedules/daily tasks. Staff remain laboratory-scoped for inventory, issue/return and disposal.
- Faculty scheduled activities become Approved without an extra academic approval. Class Representatives cannot submit that activity type. Dean only participates in authentication and applicable approvals.
- Approval records/status/holds belong to D2; base schedules/usage belong to D3. Rejection and cancellation release holds. Rescheduling revalidates before replacing a hold.
- Q&A selects authorized D2/D3/D4/D8 evidence by intent, writes D9 conversation history, and never changes a reservation. Unsupported/action questions are declined; missing evidence is reported as unavailable. Failure/correction paths are summarized; recovery/logging policies beyond the full description are not invented.
- Equipment cannot be consumed. Broken/lost outcomes are linked to borrowing evidence; only Head Laboratory raises accountability. Clearance viewing is a separate Class Representative-initiated read-only workflow.
- Disposal includes only physically present, nonrepairable items/waste and does not deduct the same quantity twice. Table 20 supplies the inventory-adjustment detail; the DFD disposal child explicitly persists D10. No existing DFD flow was added to hide this distinction.
- Reporting includes usage, borrowed items, broken/lost/consumed totals, disposal, daily tasks and outstanding clearances. It is non-AI. The report is handed to administration outside the system.

## Deployment: supported logical architecture, not a fabricated technology stack

The paper identifies a web-based application, signed-in users on their devices, persistent records and emailed account credentials. A browser-hosted UI, application execution and persistence are therefore necessary logical placements. Laptop/desktop and mobile are possible client devices, not certified compatibility claims. Email delivery is documented, but its provider, execution host and transport are not. Separate host boxes do not assert separate physical machines.

There is **no approved application hosting provider, runtime, DBMS, physical ERD, authentication vendor, AI API provider, database protocol or email protocol** in the current requirements. Deployment labels therefore leave these unspecified. HTTPS is noted as a recommendation, not claimed as a recorded implementation decision. No Firebase, Supabase, MySQL, PostgreSQL, Vercel, AWS, external AI API, SMTP or WebSocket is silently assigned to the laboratory application.

The implementation-specific deployment diagram cannot be finalized until those choices are supplied. This supplement does not revise requirements or pretend that the application is already built.

Deployment illustrates three candidate client device types in separate UML nodes: desktop computer, laptop computer and smartphone. Each contains a browser execution environment and the web-interface artifact. These are device categories, not a fixed count of installed units or a one-device-per-role assignment; actual quantities remain TBD and compatibility requires testing. Application, persistence and email infrastructure have separate logical node shapes. Vector icons and blue/green/purple/amber fills distinguish the categories without replacing UML labels or implying particular vendors. All six illustrated nodes remain on one A4 landscape sheet.

## Pending decisions deliberately preserved

Exact Class Representative → Dean routing, the two-day advance cutoff, whole-term recurrence, room-only session completion, completion after clearance settlement, atomic quantity/hold rules and knowledge-base ownership still need consultation. No new policy is inferred from these diagrams.

## Print and verification

Use A4 Landscape, 100% scale, browser headers/footers off. The supplement supplies its own page numbers. Each of the eight pages has 10 mm margins and scalable vector content. The complete Swimlane is page 1; process Activities 1.0–5.0 occupy pages 2–6; Sequence is page 7; Deployment is page 8. No individual diagram is split across sheets. On phones, each sheet scrolls horizontally while the collection scrolls vertically.

Run `node integrations/system-diagrams/check.cjs --render` with Playwright and Edge available (`PLAYWRIGHT_MODULE` may point to an existing installation). This checks evidence-catalog coverage, all 21 canonical children in the complete Swimlane and their respective process pages, control-flow reachability from initial to final, matching DFD links, source preservation, text bounds and collisions, mobile overflow and the eight-page PDF count. It regenerates the PDF and eight preview PNGs. These checks do not replace review of summarized UML semantics. The original diagrams and Google Doc are never modified by this check.

The existing Analytics snapshot is refreshed for changed source fingerprints, including navigation and the full-label publication update. Its metrics and scope are not redesigned to claim UML semantic correctness. DFD Level 0–2 publication labels now display their complete canonical names; the models, flow counts, directions and role permissions are unchanged. Footer crossing/abbreviation notes are removed from printed diagrams. The single-sheet Level 1 remains dense: its fitted labels are approximately 5–6.3 pt within the existing A4 margins; inspect an actual-size print before submission. Full names take priority over the previous abbreviated-label font threshold.
