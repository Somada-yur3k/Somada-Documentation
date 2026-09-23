# Logical ERD — design notes

Status: draft for consultation, not an approved or deployed physical schema.

Confirmed Reservation Type requirement: `RESERVATION.reservation_type` accepts `GROUP` or `STUDENT_ONLY` and is required for Class Representatives under both schedule variants. Faculty requests keep their existing workflow and may leave this field not applicable. Schedule classification remains in `REQUEST_REVISION.request_basis / usage_type`. `CLASS_GROUP` is the class/Faculty scope, not proof that the reservation is for a group. `REQUEST_MEMBER` retains existing selected members for Group; Student Only requires exactly one selected student from the assigned class; RESERVATION.requester_id retains the submitting representative account separately. Borrowing and clearance reuse these accountability links. A required single-student selector reuses STUDENT and REQUEST_MEMBER; no ordinary-student login or new entity is introduced. Rescheduling retains the saved type; unresolved legacy types require explicit classification. The dictionary states the role-dependent requirement because SQL nullability alone cannot express a cross-table role rule.

The draft contains 25 entities and 51 foreign-key relationships on one complete A4 portrait sheet. It follows the current laboratory documentation and ten canonical DFD stores. Inventory forecasts are dynamic read-only outputs, so no Forecast table or additional relationship is needed. AI approval and AI reservation submission remain excluded. No database product or physical SQL type has been selected here.

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

The current layout uses four staggered columns, with connected entities placed closer together and broad horizontal routing bands between tables. Shared primary keys fan out before their individual cardinality markers. White gaps at connector crossings indicate an overpass, never another relationship. Field names remain unshortened. At the full portrait print width, ordinary field labels are approximately 6.8 pt (smaller when embedded inside the paper's wider margins). This is the readability tradeoff of fitting every table on one A4 page. Inspect a physical print at 100% before submission; PDF/SVG remain zoomable without raster blur.

The routing grid uses 14-unit lanes. The geometry test rejects overlapping long route segments and long parallel runs closer than 12 SVG units (about 1.7 mm at full A4 diagram width). Short connections must still converge at their shared PK row; that intentional fan-out is not a separate entity or data-flow junction. R-numbers stay beside their FK fields, not in floating boxes across the line corridors.

Cardinality symbols use 18-unit-high bars/prongs and 10-unit-diameter optionality circles. FK rows are 25 units apart; same-PK fan-out markers are 24 units apart, leaving clear space between adjacent symbols. These layout changes do not change any relationship cardinality or FK target.

Logical types, nullability, unique keys, composite uniqueness, and additional constraints are in the expandable data dictionary on `ERD.html`. The diagram emphasizes keys and fields; it is not a substitute for those constraints.

## Store coverage

| DFD store | Proposed entities |
| --- | --- |
| D1 User Accounts | STUDENT, USER_ACCOUNT, CLASS_GROUP, GROUP_MEMBER |
| D2 Reservation Records | RESERVATION, REQUEST_REVISION, APPROVAL, REQUEST_ITEM, REQUEST_MEMBER |
| D3 Laboratory Schedules / Usage | TERM, LABORATORY, SCHEDULE_BLOCK, USAGE_LOG |
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
- Staff may issue, receive, maintain inventory, and record disposal only in their assigned laboratory. Head may work across both laboratories. Usage, schedule, daily-task and clearance maintenance remain Head-only.
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

Approval routing is confirmed: Class Representative on-schedule requests require Faculty only; out-of-schedule requests require Faculty then Dean. Faculty out-of-schedule requests require Dean only. Intermediate Faculty approval retains Pending and the hold; rejection stops the route. The draft still awaits consultation on the two-day cutoff, recurring reservation behavior, room-only completion, whether clearance settlement affects reservation completion, atomic stock holds, and knowledge-base ownership. ERD semantic validation itself remains pending in Analytics.

## Reporting and Q&A

Physics and Circuits usage logs are scoped views of USAGE_LOG, not duplicate tables. Actual responsible Faculty is recorded for professor/item reports. If a usage log references a borrowing slip, both must belong to the same request revision. Reports are derived queries; no REPORT entity is invented merely to store calculated top-professor rankings.

KNOWLEDGE_ARTICLE is deliberately independent until content ownership is agreed. CHAT_EXCHANGE records authenticated questions and answers for Class Representatives and Faculty. Authorized inventory, schedule, own-reservation and knowledge records are read at answer time. The current paper does not require persistent source citations, so there is no mandatory article FK or fabricated polymorphic source reference. AI remains informational and cannot submit or approve reservations.

## Files and verification

- `ERD.html`: viewer, dictionary, relationship register and downloads.
- `assets/erd/model.js`: canonical proposed entities, fields, constraints and sheet assignments.
- `assets/erd/render.js`: SVG tables, PK/FK routing and Crow's Foot symbols.
- `assets/erd/erd.pdf`: single-page portrait A4 export.
- `assets/erd/erd-complete.svg` / `erd-complete.png`: complete printable diagram.

Run `node integrations/erd/check.cjs --render` with Playwright available (or `PLAYWRIGHT_MODULE` pointing to its installation). It checks unique definitions, FK targets, coverage, row attachment, routing separation, text bounds, and page count, then regenerates exports. `integrations/erd/optimize.cjs` is a read-only placement experiment; final spacing and port choices are verified separately by the renderer test. These structural tests do not certify policy correctness.

The Documentation page embeds the complete portrait ERD and identifies it as a draft for consultation. Its existing sync workflow can send this figure when the ERD section is selected. No live Google Doc, production database, or remote deployment is changed automatically by this generator.

## Artwork cleanup

The reusable ERD SVG/PNG omits the enclosing page border, title, description, notation legend and relationship-register footer. Its viewBox tightly encloses the tables and connectors with a small safety margin. PK/FK fields, R-identifiers and all 102 endpoint cardinality markers remain unchanged. The website retains the data dictionary and relationship register outside the printed artwork; the PDF remains one A4 portrait page.
