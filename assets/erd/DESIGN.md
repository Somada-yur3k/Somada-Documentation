# Logical ERD — design notes

Status: draft for consultation, not an approved or deployed physical schema.

## Additional A4 portrait version

`ERD-A4.html` is a separate, container-free A4 layout using the same canonical model. The existing landscape artwork and Documentation figure remain available and are not overwritten. Its exports are `erd-a4-complete.svg`, `erd-a4-complete.png` and `erd-a4.pdf` in this directory.

The A4 renderer uses five staggered functional columns, 28-unit data rows and compact endpoint symbols. Tables are spread across the full portrait height, while dedicated horizontal and vertical lanes route connectors around every unrelated table and cardinality marker. Parent relationships use distinct perimeter ports instead of a shared PK stem. All 102 symbol/label bounding boxes retain a visible gap, exact connector merges are prohibited, and long parallel routes remain at least 6 SVG units apart. White crossing gaps are overpasses, not new relationships.

The A4 cardinality bars and crow's-foot prongs are no more than 10 units tall, optionality circles have a 4-unit radius, and white symbol backplates are 24 units tall. Parent endpoint ports use a 28-unit pitch and are distributed across both sides of high-degree tables when needed. Table content and relationship semantics are unchanged by the layout refactor.

Hover or keyboard focus highlights both endpoints, their tables and the full relationship path. Escape or pointer exit clears the highlight. The viewer has 100%, 150% and 200% zoom; printing always uses one 210 x 297 mm page regardless of screen zoom. PNG and PDF exports are static. The full 25-table schema necessarily has small text at A4 size; use the interactive viewer or landscape version for detailed inspection.

Run `node integrations/erd/check-a4.cjs --render` to validate and regenerate this variant. It checks schema coverage, exact PK/FK attachment, symbol/numeric agreement, endpoint separation, all 102 real hover targets, keyboard focus, zoom behavior and PDF dimensions.

Confirmed Reservation Type requirement: `RESERVATION.reservation_type` accepts `GROUP` or `STUDENT_ONLY` and is required for Class Representatives under both schedule variants. Faculty requests keep their existing workflow and may leave this field not applicable. Schedule classification remains in `REQUEST_REVISION.request_basis / usage_type`. `CLASS_GROUP` is the class/Faculty scope, not proof that the reservation is for a group. `REQUEST_MEMBER` retains existing selected members for Group; Student Only requires exactly one selected student from the assigned class; RESERVATION.requester_id retains the submitting representative account separately. Borrowing and clearance reuse these accountability links. A required single-student selector reuses STUDENT and REQUEST_MEMBER; no ordinary-student login or new entity is introduced. Rescheduling retains the saved type; unresolved legacy types require explicit classification. The dictionary states the role-dependent requirement because SQL nullability alone cannot express a cross-table role rule.

The draft contains 25 entities and 51 foreign-key relationships on one complete grouped landscape sheet. It follows the current laboratory documentation and eleven canonical DFD stores. Inventory forecasts are dynamic read-only outputs, so no Forecast table or additional relationship is needed. AI approval and AI reservation submission remain excluded. No database product or physical SQL type has been selected here.

## Inventory forecast data lineage

- D4: ITEM and inventory records provide item category, laboratory, stock/condition and reorder level.
- D5: BORROWING.issued_at and BORROWING_ITEM.qty_issued provide issue history; RETURN_ENTRY provides actual consumed, returned, broken/lost quantities and recorded_at.
- D2: BORROWING_ITEM.request_item_id → REQUEST_ITEM.item_id identifies the ITEM; the revision links preserve request scope. Cancelled/rejected or merely requested quantities are not consumption.
- Aggregate consumables from actual RETURN_ENTRY.qty_consumed once; do not add the matching inventory ledger decrement again.
- Reusable-equipment estimates need reliable overlapping issue/return intervals and serviceable stock. Total monthly borrow counts are not concurrent demand. Incomplete timing/stock evidence produces Insufficient history, not an invented shortage estimate.
- Output includes next-month period, current stock, estimate, advisory restock/shortage, explanation, historical coverage and generation timestamp. These are response fields, not new persisted columns. Head Lab reviews; generation never changes stock or creates a purchase.
- Minimum history, model choice and forecast error require empirical validation. Initial usage-based forecasting is a baseline, not evidence of a trained AI model.

## Reading the sheets

Every entity appears exactly once, with all its fields. There are no repeated reference cards or separate domain sheets in the current diagram. Relationship IDs R01–R51 appear beside the FK fields and in the website's relationship register. ERD is part of the shared website navigation alongside Use Case and DFD Levels 0–2.

Connectors begin on the parent PK row and terminate on the child FK row. Crow's Foot endpoints mean exactly one (`||`), zero or one (`O|`), or zero or many (`O<`). A nullable FK permits zero parents; a mandatory FK requires one. A unique FK permits at most one child; other FKs permit many. Minimum child counts are zero unless a lifecycle constraint below says otherwise. For example, a saved reservation needs one current revision, even though the generic FK connector alone cannot express that rule.

The current layout follows the supplied reference in thirteen pastel functional groups on a 2850 × 2080 landscape canvas. The PDF uses a custom 500 × 364.912 mm page, not A4. Each endpoint includes both a Crow's Foot symbol and a numeric cardinality (1, 0..1 or 0..*). Shared PKs fan out to separate endpoint markers. White crossing gaps are overpasses, not joined relationships. Use the vector SVG/PDF or full-resolution PNG to inspect all 51 relationships.

The routing grid uses 14-unit lanes. The geometry test rejects overlapping long route segments and long parallel runs closer than 12 SVG units. Short connections must still converge at their shared PK row; that intentional fan-out is not a separate entity or data-flow junction. R-numbers stay beside their FK fields, not in floating boxes across the line corridors.

Cardinality symbols use 18-unit-high bars/prongs and 10-unit-diameter optionality circles. FK rows are 25 units apart; same-PK fan-out markers are 24 units apart, leaving clear space between adjacent symbols. These layout changes do not change any relationship cardinality or FK target.

Logical types, nullability, unique keys, composite uniqueness, and additional constraints are in the expandable data dictionary on `ERD.html`. The diagram emphasizes keys and fields; it is not a substitute for those constraints.

## Store coverage

| DFD store | Proposed entities |
| --- | --- |
| D1 User Accounts | STUDENT, USER_ACCOUNT, CLASS_GROUP, GROUP_MEMBER |
| D2 Reservation Records | RESERVATION, REQUEST_REVISION, APPROVAL, REQUEST_ITEM, REQUEST_MEMBER |
| D3 Laboratory Schedule | TERM, LABORATORY, SCHEDULE_BLOCK |
| D11 Laboratory Usage Logs | USAGE_LOG |
| D4 Inventory Records | ITEM_CATEGORY, ITEM, STOCK_MOVEMENT |
| D5 Borrowing Slip Records | BORROWING, BORROWING_ITEM, BORROWING_MEMBER, RETURN_ENTRY |
| D6 Clearance Records | CLEARANCE |
| D7 Daily Task Records | DAILY_TASK |
| D8 Knowledge Base | KNOWLEDGE_ARTICLE |
| D9 Question / Answer Logs | CHAT_EXCHANGE |
| D10 Disposal Records | DISPOSAL |

A DFD store is a logical collection, not necessarily one database table. This mapping is evidence of coverage, not proof that all business rules have been approved.

## Access and cross-record constraints

- The six roles remain Class Representative, Faculty, Dean, Head Laboratory, Physics Laboratory Staff, and Circuits Laboratory Staff. A FK to USER_ACCOUNT does not itself enforce role authorization.
- Only a Class Representative account needs the optional STUDENT link. This does not create login accounts for every student. Only scoped Staff need a laboratory assignment. Faculty and representative links in CLASS_GROUP must target accounts with matching roles.
- The request owner must be the permitted Faculty or Class Representative for the class. Dean is approval-only. Head creates and manages Faculty and Class Representative accounts only (details and active/inactive status); neither role self-registers. Preserve role and linked history on updates; Faculty receives the representative credentials through the documented handoff.
- Selected students must belong to the request's class group. Request items must belong to its laboratory. Borrowing items and borrowing members must point to the same revision as their slip.
- Only a current approved revision can be issued. Approval belongs to a revision so an old decision cannot authorize changed timing. Faculty scheduled laboratory activity does not require a new academic approval row.
- Staff may issue, receive, maintain inventory, and record disposal only in their assigned laboratory. Head may work across both laboratories. Head administers usage logs, schedules, daily tasks and clearance. Usage logs are populated automatically from completed reservations and return outcomes, not manually re-encoded. USAGE_LOG.recorded_by identifies the authenticated user whose completion transaction triggered generation. Generation must be idempotent, with session frequency independent of item rows or partial returns.
- Clearance must reference a broken/lost return outcome and a student on the same borrowing slip. Allocated quantities cannot exceed that outcome. Class Representatives view accountability only for their authorized group.
- Pending approvals have a nullable decision timestamp; open clearances have nullable settlement account/time. Enforce consistent state/timestamp combinations. Optional remarks and accounts that have never logged in also permit null values.
- Every relevant end time must follow its start time. Quantities use the item's unit; requested/issued/disposed quantities must be positive, and classified return counts nonnegative. Equipment cannot be classified as consumed. Cumulative return outcomes cannot exceed issued quantities.
- Referenced historical records should not be physically deleted through ordinary inventory/account removal. Use inactive/retired states or restrict deletion while referenced. Retention and correction policies need confirmation before physical implementation.

## Proposed choices that need confirmation

1. **Revision history:** REQUEST_REVISION keeps request timing and items separate from the reservation header. Require a unique `(request_id, revision_no)` and exactly one current revision. Rescheduling must validate first and preserve prior approval evidence.
2. **Issue history:** This draft permits multiple borrowing slips per revision. Confirm whether the intended business rule instead allows exactly one slip.
3. **Partial returns:** RETURN_ENTRY permits multiple recorded outcomes over time, with cumulative quantity limits. Confirm this workflow with the laboratory head.
4. **Stock ledger:** STOCK_MOVEMENT records on-hand and owned-quantity deltas. Opening/manual adjustments have no transaction source; other movements identify one applicable borrowing item, return entry, or disposal. Enforce source/item consistency, source/type idempotency, and prohibit two source types on the same movement. Issue changes on-hand but not ownership; good return restores on-hand. Loss, consumption and disposal must not write off the same stock twice. Damaged stock must not become available for issue.

Available stock is derived from eligible stock, outstanding issues, and valid current holds; it is not an independently editable quantity. Atomic reservation holds and ledger posting are requirements to finalize, not implemented transactions in this documentation project.

Approval routing: Class Representative on-schedule requests require assigned Faculty only. Out-of-schedule requests go to available assigned Faculty OR directly to Dean when Faculty is unavailable. The selected reviewer makes the final decision; no subsequent Dean approval follows Faculty approval. Faculty out-of-schedule requests require Dean only; regular on-schedule Faculty activities require no approval row. Rejection releases the hold. Enforce one routed reviewer per revision; the retained route_order field is 1, not a multi-stage approval sequence. The draft still awaits consultation on the two-day cutoff, recurring reservation behavior, room-only completion, whether clearance settlement affects reservation completion, atomic stock holds, and knowledge-base ownership. ERD semantic validation itself remains pending in Analytics.

## Reporting and Q&A

Approval cardinality correction: APPROVAL.revision_id is a mandatory unique foreign key. Each approval belongs to exactly one request revision; each revision has zero or one approval. This enforces the selected Faculty-or-Dean reviewer rule and permits approval-free scheduled Faculty activities. The diagram and Markdown registers use 1 to 0..1 for R17. No table or field is removed.

Physics and Circuits usage logs are scoped views of USAGE_LOG, not duplicate tables. Actual responsible Faculty is recorded for professor/item reports. If a usage log references a borrowing slip, both must belong to the same request revision. Reports are derived queries; no REPORT entity is invented merely to store calculated top-professor rankings.

KNOWLEDGE_ARTICLE is deliberately independent until content ownership is agreed. CHAT_EXCHANGE records authenticated questions and answers for Class Representatives and Faculty, with access restricted to their own history. Answers read only current inventory (D4) and approved laboratory knowledge (D8); exchanges are stored in D9. Topics cover Physics/Circuits laboratory information, equipment information/current availability and operating hours. Schedule selection, reservation status and clearance remain in their respective pages, not chatbot lookups. The current paper does not require persistent source citations, so there is no mandatory article FK or fabricated polymorphic source reference. AI remains informational and cannot submit or approve reservations. No duplicate availability, per-laboratory knowledge or forecast-result table is needed.

## Files and verification

- `ERD.html`: viewer, dictionary, relationship register and downloads.
- `assets/erd/model.js`: canonical proposed entities, fields, constraints and sheet assignments.
- `assets/erd/render.js`: SVG tables, PK/FK routing and Crow's Foot symbols.
- `assets/erd/erd.pdf`: single-page custom landscape export.
- `assets/erd/erd-complete.svg` / `erd-complete.png`: complete printable diagram.

Run `node integrations/erd/check.cjs --render` with Playwright available (or `PLAYWRIGHT_MODULE` pointing to its installation). It checks unique definitions, FK targets, coverage, row attachment, routing separation, text bounds, and page count, then regenerates exports. `integrations/erd/optimize.cjs` is a read-only placement experiment; final spacing and port choices are verified separately by the renderer test. These structural tests do not certify policy correctness.

The Documentation page embeds the complete grouped landscape ERD and identifies it as a draft for consultation. Its existing sync workflow can send this figure when the ERD section is selected. No live Google Doc, production database, or remote deployment is changed automatically by this generator.

## Artwork cleanup

The reusable SVG/PNG includes the reference-style title, colored module panels, all 25 entities and all 102 cardinality endpoints. The website retains the dictionary and relationship register below the diagram.

D11 contains completed Physics and Circuits laboratory usage logs. Completion and return reconciliation generate the records automatically. End-term reports read only D11 completed usage logs. Reservation, borrowing and inventory summaries are not direct report inputs; required metric values must be available in the recorded usage information. Missing values are flagged rather than invented. D3 scheduling data is not a report source.
