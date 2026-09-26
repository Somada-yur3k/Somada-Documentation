# System Diagrams — additive UML supplement

Reservation Type update: Activity 2, SEQ-02 and the Class Representative Swimlane lane require Group / Student Only for both schedule variants. Activity alternatives converge through the requested OR join bar. Student Only is one selected class student; Group uses selected class members. The Class Rep is the submitting account, not automatically the borrower. Head Lab identifies the responsible borrower before clearance creation; the Class Rep only views student clearance status. The combined reservation sequence retains rescheduling and the existing Faculty/Dean approval route. See [Changes Made](../../integrations/reservation-type/CHANGES.md).

Open [System-Diagrams.html](../../System-Diagrams.html), [the complete A4 PDF](diagrams.pdf), or [the sequence-only PDF](sequences.pdf). The publication contains 12 sheets: SWIM-01, ACT-01–ACT-05, SEQ-01–SEQ-05 (one portrait sequence per major process), and DEP-01 (landscape). `models.js` retains the supporting evidence catalog; `sequence-models.js` holds the five interaction trees and `sequence-renderer.js` renders them.

## Source authority

- `Docs.html`: current overview, 20 backlog rows, 25 events, 20 full descriptions (Tables 3–22), current scope and pending ERD notice.
- `assets/figures-v2/usecase-diagram-source.html`: the current six actors and 20 main use cases.
- `assets/figures-v2/dfd-level1/dfd-level1-model.json`: five parents, ten canonical logical record groups, 75 flows.
- `assets/figures-v2/dfd-level2-compact/dfd-level2-model.json`: 24 child processes (the three forecasting children are intentionally deferred from Sequence diagrams) and their directional exchanges.
- `README.md` and the consultation findings in `assets/system-audit.json`: boundaries and unresolved decisions.
- [OMG UML 2.5.1](https://www.omg.org/spec/UML/2.5.1): notation, not a source of laboratory requirements.

Archived entity arrays, archived ERD figures, retired traceable DFDs and the paused workspace/Supabase draft are not approved architecture. The documentation site's React implementation and its hosting are not evidence of the proposed laboratory application's runtime or database.

## Activity → Sequence mapping

SWIM-01 summarizes the laboratory service lifecycle with six actor partitions, including Dean. [The sequence inventory](SEQUENCE-PLAN.md) maps five Sequence Diagrams directly to the five Activities and DFD parents. Guarded fragments summarize related interactions without claiming that every alternative runs in one transaction. All 20 documented use cases and 21 Level 2 children remain covered in the sequence metadata.

ACT-01–ACT-05 expand those five branches on separate portrait pages. Each contains only its parent's canonical subprocesses, with names loaded from the Level 2 model; subprocess IDs remain in source metadata but are not printed. Initial nodes, guarded decisions, merges, action names and activity finals show the control flow; these are not copies of DFD data-flow arrows. Detailed descriptions, role restrictions and validation evidence remain in the model, the website's non-printing notes and the full descriptions. Removing explanatory prose from the artwork does not authorize saving invalid input.

| Sheet | Activity focus | Canonical children |
| --- | --- | --- |
| ACT-01 | Login versus Head-Laboratory account issuance | 1.1–1.3 |
| ACT-02 | Availability, reservation/change validation, routed approval and tracking | 2.1–2.4 |
| ACT-03 | Scoped inquiry → evidence → grounded answer/refusal → conversation history | 3.1–3.4 |
| ACT-04 | Catalogue, issuance, return and disposal as alternative operations | 4.1–4.5 |
| ACT-05 | Schedule, usage/tasks, clearance and end-term reporting as alternative operations | 5.1–5.5 |

Every process page links to its matching Level 2 diagram and back to the complete Swimlane. The Sequence index contains exactly five entries in the same order as the Activity and DFD parent processes. Each sequence has Activity/DFD references and PNG/SVG/PDF downloads.

### Portrait process activities

ACT-01–ACT-05 use portrait layouts without responsibility partitions: uniform white rounded actions, black connectors, guarded decisions and initial/final nodes. Process 5 has a paired fork/join for independent read-only D2/D3 session evidence and D4/D5 inventory/item evidence; both branches join before computing the report. Alternative administration operations do not run in parallel. Only the whole-system Swimlane uses responsibility columns.

Read from the initial node downward, following the guard for the selected operation. Catalogue, issue, return and disposal remain alternatives, as do schedule, logs, clearance and reporting. A vertical row alignment does not imply an unshown arrow or mandatory sequence. The 21 canonical subprocess names and numbers are unchanged. Deployment retains its structure; the five sequence pages summarize those alternatives through guarded fragments.

### Whole-system UML swimlane

Optional Q&A convergence uses a horizontal OR join: the No bypass and completion of the Q&A action enter separate top-face ports, followed by one output to reservation preparation. Need Q&A remains a decision. The join does not require both asking and skipping Q&A.

Approval routing clarification: Own on-schedule Yes and Out-of-schedule No have independent labelled routes, independent arrowheads and separate top-face ports on a visible OR join. They do not share a line segment before that bar. Its output and Dean-approved Yes then enter separate ports on a lower OR join, preserving the short Faculty bypass and downward-only Dean route. This supersedes the earlier invisible approval connectors.

Dean-approved Yes now runs downward and across to the lower approval convergence before the preparation fork. It no longer rises into the Faculty approval routes. The shortened on-schedule bypass retains its own upper convergence; both continue without changing approval conditions.

Faculty routing update: the on-schedule Yes bypass converges above the lower Dean-rejection path rather than running down to the preparation fork. Faculty decision heights and action spacing leave visible connector shafts before arrowheads. Crossing bridges preserve distinct routes while leaving true convergence points connected. Approval conditions are unchanged.

Return reconciliation now uses a horizontal OR join instead of its diamond. Circuit and Physics enter separate top-face ports; a single bottom-face output continues to the unresolved-balance check. The selected laboratory alone may proceed; the diagram does not require returns from both laboratories.

Layout update: activity shapes use capsule ends. Dean routing uses a vertical rounded join bar with separated left-face inputs and a right-face output; preparation uses a horizontal rounded bar with four separated top-face inputs and a bottom output. The join region is more compact, parallel approach tracks remain spaced, and orthogonal connectors have rounded bends. Conditions and actor permissions are unchanged.

Latest preparation update: both requester and staff convergence diamonds are removed. Rep, Faculty, Circuit and Physics edges connect directly to the preparation join with explicit `{joinSpec = (Rep or Faculty) and (Circuit or Physics)}`. It requires one requester and staff from the selected laboratory, not both requesters or both laboratories.

The approval convergence uses two visible OR joins with independent input routes. Before Dean review, the user requested a visible JoinNode bar. It carries an explicit `{joinSpec = or}` condition: either incoming request can proceed, without waiting for both a Class Representative request and a Faculty request. The bar connects to Dean review, which connects to the Dean-approved decision. The preparation JoinNode uses `(Rep or Faculty) and (Circuit or Physics)` and waits for one requester and one assigned staff path. UML JoinNode specifications may override the default AND operator; see [UML specification, control-node semantics](https://docs.nomagic.com/download/attachments/136711173/UML%20specification.pdf?api=v2&modificationDate=1695226406576&version=1). Other decisions and merges are unchanged.

SWIM-01 is one A4 portrait UML overview with Class Representative, Faculty, Circuit Staff, Physics Staff, Head Lab and Dean partitions. Actions are rounded capsules; initial/final circles, guarded decisions, OR Joins and black fork/join bars use activity notation. After optional laboratory Q&A, Class Representative chooses Physics or Circuits, then Group or Student Only, then Schedule Type. The Group / Student Only alternatives converge at an OR Join, not an AND Join. Class selection, eligible students, slots and items precede review of the non-editable route and submission. A submission fork separates Pending / Current Reviewer display from reviewer processing, so approval does not have to finish before the request appears in the requester's status page. A Flow Final in this branch ends only the status view.

Class Representative on-schedule requests require assigned Faculty approval. An out-of-schedule request goes to available assigned Faculty OR directly to Dean when that Faculty is unavailable. These decisions read saved request details and assigned Faculty availability; they do not offer reviewer-selection buttons. The selected reviewer makes the final decision. Faculty chooses the laboratory and activity kind first. Laboratory Activity uses the assigned class schedule and skips the Schedule Type choice. Non-Laboratory Activity asks for On-Schedule or Out-of-Schedule. These alternative paths meet at an OR Join before common schedule/room, equipment/materials and review/submit actions. Assigned-class schedule and availability checks precede saving. Both valid Faculty on-schedule modes are Approved with no APPROVAL row; only Faculty out-of-schedule requests remain Pending for Dean. The existing request_basis / usage_type fields and On-Schedule / Out-of-Schedule DFD flows cover this distinction; no entity, FK or cardinality is changed. Dean review and decision are inside the Dean lane. Final approval has independent requester-status and selected-laboratory delivery branches. Staff checking does not wait for a requester to open the status page. The Selected Lab decisions retain the original laboratory choice instead of selecting another room or laboratory. Assigned-staff service, clearance where needed and automatic completed-reservation logs follow. Detailed alternatives remain in Activities 1-5.

Class Representatives view their own group records. Only Head Lab manages accounts, schedules, daily tasks and clearance. Faculty does not approve on behalf of Dean. In-scope Q&A is informational. Pending approval is a waiting state, not automatic rejection. The overview assumes a reviewer has clicked Approve or Reject. Preparation alternatives enter separate ports on a custom JoinNode; its join specification waits for one requester and one assigned staff path, not all four actors.

The publication contains only the title, six actor headers, UML nodes, short labels, guards and connectors. Website notes explain scope outside the printable sheet. Standalone swimlane-system.png and .svg are used by Docs.html Figure 15 and Google Docs image capture; swimlane-system.pdf is one printable A4 page. Activity images remain separate portrait diagrams.

Regression checks retain six actor partitions, Dean-owned review/decision, reachable final outcomes, explicit join specifications, contained labels and separated connectors. Publication checks now require 12 A4 pages (11 portrait and one landscape), plus five one-page sequence PDFs.

The following 17 rows are the supporting evidence catalog, not separate printed pages. The simplified Swimlane covers all five major process groups without reproducing all 21 subprocesses. Detailed process mapping remains in the separate Activity Diagrams.

| Evidence entry | Workflow | Full description tables | DFD child processes |
| --- | --- | --- | --- |
| 01 | Authenticate / establish access | 3 | 1.1, 1.2 |
| 02 | Issue Class Representative / Faculty account | 15 | 1.3 |
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
| 14 | View assigned-class student clearance | 12 | 5.3 |
| 15 | Disposal | 20 | 4.5 |
| 16 | Schedule / usage / daily tasks | 21 | 5.1, 5.2 |
| 17 | End-term report | 22 | 5.4, 5.5 |

Sequence record reads/writes are logical operations, not SQL, API contracts or atomicity guarantees. UI and application behavior share the documented Web System lifeline; no controllers, notification vendor or AI provider is invented. Actors use stick figures and never directly call the Database. Solid filled-head calls, dashed open-head replies and bounded execution bars distinguish requests/results. The renderer validates matching call stacks separately in every alternative operand. Self-calls are genuine internal work; create/destroy/recursive/duration messages are not forced. Login is separate; other interactions have an authenticated-role precondition. `alt` shows meaningful outcomes; `opt` covers conditional notification/export. Notifications are asynchronous signals, not replies to a non-caller. Settlement is a later explicit Head action, not automatically executed when clearance is raised.

The Swimlane fork permits independent requester preparation and assigned-staff preparation after approval; the join waits for both before service. Circuit and Physics assignment is exclusive and converges through a JoinNode with `joinSpec = or`, never a default AND join requiring both laboratories. This is a logical business-preparation model, not a database-concurrency claim. Process 5 separately uses a read-only evidence fork/join.

SEQ-05 mirrors that reporting fork/join with a `par` frame for completed-usage and inventory/item reads; both return before calculations, and its `opt` contains the separately requested export. SEQ-02 retains separate Faculty and Dean actor messages and validates the current persisted route for each decision.

## Important scope and evidence limits

- All six actors can log in. Only Head Laboratory issues Class Representative and Faculty accounts, controls clearance and maintains logs/schedules/daily tasks. Staff remain laboratory-scoped for inventory, issue/return and disposal. Dean retains a pre-assigned account; its provisioning authority awaits confirmation.
- Faculty scheduled activities become Approved without an extra academic approval. Class Representatives cannot submit that activity type. Dean only participates in authentication and applicable approvals.
- Approval records/status/holds belong to D2; base schedules/usage belong to D3. Rejection and cancellation release holds. Rescheduling revalidates before replacing a hold.
- Q&A selects authorized D2/D3/D4/D8 evidence by intent, writes D9 conversation history, and never changes a reservation. Unsupported/action questions are declined; missing evidence is reported as unavailable. Failure/correction paths are summarized; recovery/logging policies beyond the full description are not invented.
- Equipment cannot be consumed. Broken/lost outcomes are linked to borrowing evidence; only Head Laboratory raises accountability. Clearance viewing is a separate Class Representative-initiated read-only workflow.
- Disposal includes only physically present, nonrepairable items/waste and does not deduct the same quantity twice. Table 20 supplies the inventory-adjustment detail; the DFD disposal child explicitly persists D10. No existing DFD flow was added to hide this distinction.
- Reporting consists of Average Equipment Use, Top 5 Equipment & Consumables, Laboratory Frequency Usage, and supporting Recent Activity, separately for Physics and Circuits and filtered by term. Avg Use % = ROUND(Quantity Used / Total Available * 100, 2). Frequency uses distinct actual sessions, not hours or item rows: 4/9 and 5/9 produce 44.44% and 55.56%. Reporting reads D2/D3/D4/D5 only. Disposal, non-transaction daily tasks and outstanding clearances remain separate workflows, not report inputs or appendices. Calculations are non-AI.

## Deployment: supported logical architecture, not a fabricated technology stack

The paper identifies a web-based application, signed-in users on their devices, persistent records and emailed account credentials. A browser-hosted UI, application execution and persistence are therefore necessary logical placements. Laptop/desktop and mobile are possible client devices, not certified compatibility claims. Email delivery is documented, but its provider, execution host and transport are not. Separate host boxes do not assert separate physical machines.

There is **no approved application hosting provider, runtime, DBMS, physical ERD, authentication vendor, AI API provider, database protocol or email protocol** in the current requirements. Deployment labels therefore leave these unspecified. HTTPS is noted as a recommendation, not claimed as a recorded implementation decision. No Firebase, Supabase, MySQL, PostgreSQL, Vercel, AWS, external AI API, SMTP or WebSocket is silently assigned to the laboratory application.

The implementation-specific deployment diagram cannot be finalized until those choices are supplied. This supplement does not revise requirements or pretend that the application is already built.

Deployment illustrates three candidate client device types in separate UML nodes: desktop computer, laptop computer and smartphone. Each contains a browser execution environment and the web-interface artifact. These are device categories, not a fixed count of installed units or a one-device-per-role assignment; actual quantities remain TBD and compatibility requires testing. Application, persistence and email infrastructure have separate logical node shapes. Vector icons and blue/green/purple/amber fills distinguish the categories without replacing UML labels or implying particular vendors. All six illustrated nodes remain on one A4 landscape sheet.

## Pending decisions deliberately preserved

Approval routing is confirmed across Tables 7 and 13, the event table, backlog, DFD 2.3/2.4/4.2 descriptions, Activities 2 and 4, and the overall Swimlane. Class Representative on-schedule non-laboratory requests need assigned Faculty only. Out-of-schedule requests go to available assigned Faculty OR directly to Dean when that Faculty is unavailable and the exception is recorded. Faculty's own scheduled activities need no additional academic approval; Faculty out-of-schedule requests go directly to Dean. The selected reviewer's approval sets final Approved and retains the applicable hold; rejection sets Rejected, stops routing and releases the hold. Pending means the request is still awaiting that one reviewer's decision, not a Faculty-to-Dean escalation stage. Only final approval permits issuance. This resolves POL-01 only; Dean account provisioning remains pending.

Process 2.0 retains four Level 2 subprocesses. The six Class Representative form steps are shown in Activity 2: laboratory; Group / Student Only; Schedule Type; schedule / room availability and eligible students; equipment / materials; and review / submit. Step 3 explains the automatic route. Step 6 displays the actual non-editable reviewer and rechecks the route on submission. Only a valid final submission saves a request and holds; 2.4 returns Pending and Current Reviewer when approval is required. A reschedule retains its saved Reservation Type and keeps the original hold if validation fails. The 20 Level 1 Boundary Flows, 25 child boundary arrows and three internal flows are unchanged.

The two-day advance cutoff, whole-term recurrence, room-only session completion, completion after clearance settlement, atomic quantity/hold rules and knowledge-base ownership still need consultation. No new policy is inferred from these diagrams.

## Print and verification

Use CSS-defined page sizes, 100% scale, browser headers/footers off. Page 1 is the portrait Swimlane; pages 2–6 are portrait Activities; pages 7–11 are portrait Sequences; page 12 is landscape Deployment. Activity, Swimlane and Sequence pages exclude website notes/navigation. Every sequence is one full A4 sheet with adaptive label wrapping/spacing and at least 18 SVG-unit message text (about 8.4 pt at its A4 print width). On phones, individual sheets scroll horizontally while the page remains within the viewport.

Run `node integrations/system-diagrams/check.cjs --render` with Playwright and Edge available (`PLAYWRIGHT_MODULE` may point to an existing installation). It checks Activity/Swimlane coverage and geometry, plus sequence roles, all 20 use cases/21 children, chronological calls and matched replies on each alternative, activation bounds, monochrome styling, label collisions, navigation, A4 orientation/count and exports. It regenerates the complete PDF, sequence-only PDF, five sequence PNG/SVG/PDF sets, and existing Activity/Swimlane exports. `node integrations/system-diagrams/check-sequences.cjs` runs the model-only checks. The checks do not write Google Docs or the shared database.

The existing Analytics snapshot is refreshed for changed source fingerprints, including navigation and the full-label publication update. Its metrics and scope are not redesigned to claim UML semantic correctness. DFD Level 0–2 publication labels now display their complete canonical names; the models, flow counts, directions and role permissions are unchanged. Footer crossing/abbreviation notes are removed from printed diagrams. The single-sheet Level 1 remains dense: its fitted labels are approximately 5–6.3 pt within the existing A4 margins; inspect an actual-size print before submission. Full names take priority over the previous abbreviated-label font threshold.
