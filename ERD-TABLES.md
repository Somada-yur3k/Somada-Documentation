# Connected ERD data dictionary

Updated: 2026-09-27. Screen-aligned logical baseline; Supabase not deployed. 30 entities, 208 attributes, 61 internal PK-FK relationships.

## USER_ACCOUNT (D1)

Profile and role context for login, account management and staff scoping. account_id maps to Supabase auth.users.id at integration.

Implementation: **Demo / sample data**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | account_id | uuid | No | - |
| FK / UK | student_id | uuid | Yes | STUDENT.student_id |
| FK | staff_lab_id | uuid | Yes | LABORATORY.lab_id |
|  / UK | login_identifier | text | No | - |
|  / UK | email | text | No | - |
| - | first_name | text | No | - |
| - | middle_name | text | Yes | - |
| - | last_name | text | No | - |
| - | contact_number | text | Yes | - |
| - | department | text | Yes | - |
| - | role | enum (HEADLAB, FACULTY, CLASSREP, DEAN, PHYSICS_STAFF, CIRCUITS_STAFF) | No | - |
| - | status | enum (ACTIVE, INACTIVE) | No | - |
| - | notes | text | Yes | - |
| - | created_at | timestamptz | No | - |
| - | updated_at | timestamptz | No | - |

- Passwords belong to Supabase Auth; no password_hash or temporary password is stored in the profile.
- Only Class Representative accounts require student_id. Ordinary student participants do not need login accounts.
- Physics Staff requires the Physics lab; Circuits Staff requires the Circuits lab. Other roles have no staff lab.
- Headlab create/edit screens currently manage UI records, not actual Auth accounts.

## STUDENT (D1)

Participant identity; NU ID is independent of the submitting Class Representative account.

Implementation: **Demo / sample data**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | student_id | uuid | No | - |
|  / UK | student_number | text | No | - |
| - | full_name | text | No | - |
| - | program | text | Yes | - |

- student_number matches YYYY-NNNNNNN, e.g. 2024-1031816.
- The demo collects participant names and IDs; it does not resolve a real authorized roster.

## SECTION (D1)

Named class section used by Faculty assignments and the fixed participant section.

Implementation: **Demo / sample data**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | section_id | uuid | No | - |
|  / UK | section_code | text | No | - |
| - | program | text | Yes | - |
| - | active | boolean | No | - |



## FACULTY_SECTION (D1)

Many assigned sections per Faculty, scoped to a laboratory before a subject/class is created.

Implementation: **Demo / sample data**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | faculty_section_id | uuid | No | - |
| FK | faculty_id | uuid | No | USER_ACCOUNT.account_id |
| FK | section_id | uuid | No | SECTION.section_id |
| FK | lab_id | uuid | No | LABORATORY.lab_id |
| - | active | boolean | No | - |

- faculty_id must reference a FACULTY account.

Unique combinations: (faculty_id, section_id, lab_id).

## CLASS_GROUP (D1)

Subject/class assignment. This table does not mean the Group request type.

Implementation: **Demo / sample data**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | group_id | uuid | No | - |
| FK | term_id | uuid | No | TERM.term_id |
| FK | faculty_section_id | uuid | No | FACULTY_SECTION.faculty_section_id |
| - | subject_code | text | No | - |
| - | subject_name | text | No | - |
| - | active | boolean | No | - |

- Selected section, laboratory and assigned Faculty are derived from faculty_section_id.

Unique combinations: (term_id, faculty_section_id, subject_code).

## CLASS_REP_ASSIGNMENT (D1)

Headlab Classrep form: fixed section, designated Faculty, laboratory and existing subject/class.

Implementation: **Demo / sample data**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | rep_assignment_id | uuid | No | - |
| FK | account_id | uuid | No | USER_ACCOUNT.account_id |
| FK | section_id | uuid | No | SECTION.section_id |
| FK | group_id | uuid | No | CLASS_GROUP.group_id |
| - | active | boolean | No | - |
| - | assigned_at | timestamptz | No | - |

- account_id must reference a CLASSREP account.
- The selected CLASS_GROUP must resolve to this section; designated Faculty and laboratory come from its FACULTY_SECTION.
- Enforce one active Class Representative per section and one active assignment per Classrep. Apply conditional uniqueness only to active records.

## GROUP_MEMBER (D1)

Authorized roster for the assigned subject/class; required for real participant ownership checks.

Implementation: **Planned persistent workflow**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | group_member_id | uuid | No | - |
| FK | group_id | uuid | No | CLASS_GROUP.group_id |
| FK | student_id | uuid | No | STUDENT.student_id |
| - | active | boolean | No | - |



Unique combinations: (group_id, student_id).

## TERM (D3)

Term boundary for subject assignments and weekly schedules.

Implementation: **Planned persistent workflow**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | term_id | uuid | No | - |
|  / UK | term_code | text | No | - |
| - | starts_on | date | No | - |
| - | ends_on | date | No | - |

- starts_on <= ends_on.

## LABORATORY (D3)

Physics or Circuits laboratory scope; one laboratory can contain several rooms.

Implementation: **Demo / sample data**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | lab_id | uuid | No | - |
|  / UK | lab_code | text | No | - |
| - | lab_name | text | No | - |
| - | active | boolean | No | - |

- lab_code is PHYSICS or CIRCUITS. Staff data access uses this ID, not a room ID.

## LAB_ROOM (D3)

Room Number choices under a laboratory, e.g. Physics 201/202 and Circuits 301/302.

Implementation: **Demo / sample data**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | room_id | uuid | No | - |
| FK | lab_id | uuid | No | LABORATORY.lab_id |
| - | room_name | text | No | - |
| - | active | boolean | No | - |



Unique combinations: (lab_id, room_name).

## REGULAR_SCHEDULE (D3)

Recurring laboratory or lecture blocks rendered by Room Availability.

Implementation: **Demo / sample data**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | regular_schedule_id | uuid | No | - |
| FK | term_id | uuid | No | TERM.term_id |
| FK | room_id | uuid | No | LAB_ROOM.room_id |
| FK | group_id | uuid | Yes | CLASS_GROUP.group_id |
| - | block_type | enum (LABORATORY, LECTURE) | No | - |
| - | weekday | integer | No | - |
| - | start_time | time | No | - |
| - | end_time | time | No | - |
| - | valid_from | date | No | - |
| - | valid_until | date | No | - |

- weekday is 1-6 (Monday-Saturday) in the current form. start_time < end_time.
- Regular blocks repeat within their effective dates. Do not store recurring classes as one fixed dated request.
- The room laboratory must match the class laboratory when group_id is present.

## SERVICE_REQUEST (D2)

Submitted request header shown in Dean, requester status and laboratory Staff request queues.

Implementation: **Demo / sample data**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | request_id | uuid | No | - |
|  / UK | reference_no | text | No | - |
| FK | requester_id | uuid | No | USER_ACCOUNT.account_id |
| - | status | enum (PENDING_FACULTY_APPROVAL, PENDING_DEAN_APPROVAL, AWAITING_RESERVATION, APPROVED, REJECTED) | No | - |
| - | submitted_at | timestamptz | No | - |

- requester_id must reference CLASSREP or FACULTY. Identity, reference and initial status are derived on the server.
- Academic Approved means eligible for later laboratory processing, not an already reserved room.
- Header status reflects the current revision and its decision. No sample flag is required in the production model.

## REQUEST_REVISION (D2)

Detached request snapshot: laboratory, class, room/time, request/activity type and notes.

Implementation: **Demo / sample data**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | revision_id | uuid | No | - |
| FK | request_id | uuid | No | SERVICE_REQUEST.request_id |
| FK | lab_id | uuid | No | LABORATORY.lab_id |
| FK | group_id | uuid | No | CLASS_GROUP.group_id |
| FK | room_id | uuid | No | LAB_ROOM.room_id |
| FK | regular_schedule_id | uuid | Yes | REGULAR_SCHEDULE.regular_schedule_id |
| FK | created_by | uuid | No | USER_ACCOUNT.account_id |
| - | revision_no | integer | No | - |
| - | request_type | enum (GROUP, STUDENT_ONLY) | Yes | - |
| - | activity_type | enum (LABORATORY_ACTIVITY, NON_LABORATORY_ACTIVITY) | Yes | - |
| - | schedule_type | enum (ON_SCHEDULE, OUT_OF_SCHEDULE) | No | - |
| - | request_for | enum (ONE_TIME) | No | - |
| - | starts_at | timestamptz | No | - |
| - | ends_at | timestamptz | No | - |
| - | notes | text | Yes | - |
| - | is_current | boolean | No | - |
| - | created_at | timestamptz | No | - |

- A submitted request needs exactly one current revision; UNIQUE(request_id) WHERE is_current. The demo saves revision 1 and locks it against edits.
- Classrep: request_type is required; activity_type is null. Faculty: activity_type is required; request_type is null.
- Laboratory Activity is Faculty-only and must be On-Schedule. Non-Laboratory Activity permits either schedule type.
- Selected room, class and regular schedule must belong to lab_id. On-Schedule exactly follows the assigned block; Out-of-Schedule must be outside the assigned class time and vacant.
- Current demo office blocks are Monday-Saturday, 07:00-17:00, in 30-minute increments. Persist timestamps using Asia/Manila input conversion.
- Notes are at most 1,000 characters. Future reschedule must create a new revision and invalidate old approval; rescheduling is not implemented.

Unique combinations: (request_id, revision_no).

## APPROVAL (D2)

Exactly one selected Faculty or Dean reviewer where academic approval is required.

Implementation: **Demo / sample data**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | approval_id | uuid | No | - |
| FK / UK | revision_id | uuid | No | REQUEST_REVISION.revision_id |
| FK | approver_id | uuid | No | USER_ACCOUNT.account_id |
| - | reviewer_role | enum (FACULTY, DEAN) | No | - |
| - | decision | enum (PENDING, APPROVED, REJECTED) | No | - |
| - | remarks | text | Yes | - |
| - | created_at | timestamptz | No | - |
| - | decided_at | timestamptz | Yes | - |

- Classrep On-Schedule -> assigned Faculty. Classrep Out-of-Schedule -> selected assigned Faculty or Dean.
- Faculty On-Schedule, including Laboratory Activity -> no APPROVAL row. Faculty Non-Laboratory Activity Out-of-Schedule -> Dean.
- Current Classrep UI explicitly selects Faculty or Dean; automatic Faculty availability/escalation is not implemented.
- approver_id must resolve to an eligible account of reviewer_role. Dean sees only Out-of-Schedule requests routed to Dean.
- Decision can be made only once while Pending. Rejection requires nonblank remarks up to 1,000 characters; decided_at is null while Pending.
- Dean decisions work in the demo. Faculty review screen is still unfinished. No route_order or sequential Faculty-then-Dean chain.

## REQUEST_ITEM (D2)

Requested catalogue items or additional manual equipment/materials; quantities are not issued stock.

Implementation: **Demo / sample data**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | request_item_id | uuid | No | - |
| FK | revision_id | uuid | No | REQUEST_REVISION.revision_id |
| FK | item_id | uuid | Yes | ITEM.item_id |
| - | name_snapshot | text | No | - |
| - | kind_snapshot | enum (Equipment, Material) | No | - |
| - | unit_snapshot | text | No | - |
| - | qty_requested | integer | No | - |

- item_id may be null for Additional Items; name/type/quantity are still mandatory.
- Selected catalogue item must belong to the request laboratory. One catalogue item row per revision; manual rows have no forced item FK.
- qty_requested is 1-999; catalogue quantity cannot exceed sample stock in the current demo. Live stock and holds must be checked transactionally.
- Preserve item name/unit/type snapshots even if the catalogue item is later renamed or archived.

## REQUEST_MEMBER (D2)

Selected students for Classrep Group or Student Only, on both schedule variants.

Implementation: **Demo / sample data**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | request_member_id | uuid | No | - |
| FK | revision_id | uuid | No | REQUEST_REVISION.revision_id |
| FK | student_id | uuid | No | STUDENT.student_id |
| - | name_snapshot | text | No | - |
| - | student_no_snapshot | text | No | - |

- GROUP needs one or more unique students; STUDENT_ONLY needs exactly one. Faculty requests have no student rows.
- Resolve every student to an active GROUP_MEMBER of the selected class before persistent submission. The demo validates syntax/uniqueness, not an actual roster.

Unique combinations: (revision_id, student_id).

## RESERVATION (D2)

Confirmed dated room booking, created only by later laboratory processing after any required academic approval.

Implementation: **Planned persistent workflow**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | reservation_id | uuid | No | - |
| FK / UK | revision_id | uuid | No | REQUEST_REVISION.revision_id |
| FK | processed_by | uuid | No | USER_ACCOUNT.account_id |
| - | status | enum (RESERVED, CANCELLED, COMPLETED) | No | - |
| - | reserved_at | timestamptz | No | - |

- No reservation is created by the current Submit or Dean Approve actions.
- Room/time is inherited from the immutable revision. Recheck regular classes and conflicting live bookings atomically before confirming.
- processor must be Staff of the revision laboratory or Headlab. Holds/cancellation policies remain future implementation; do not claim the demo saves holds.

## ITEM_CATEGORY (D4)

Category tags for equipment/material search and inventory management.

Implementation: **Demo / sample data**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | category_id | uuid | No | - |
|  / UK | category_name | text | No | - |



## ITEM (D4)

Inventory row owned by one laboratory; shared equipment types still have distinct stock per lab.

Implementation: **Demo / sample data**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | item_id | uuid | No | - |
| FK | lab_id | uuid | No | LABORATORY.lab_id |
| FK | category_id | uuid | No | ITEM_CATEGORY.category_id |
| - | item_name | text | No | - |
| - | item_type | enum (Equipment, Material) | No | - |
| - | unit | text | No | - |
| - | stock_quantity | integer | No | - |
| - | condition_status | enum (Usable, Maintenance) | No | - |
| - | reorder_level | integer | No | - |
| - | active | boolean | No | - |
| - | updated_at | timestamptz | No | - |

- stock_quantity is a whole number from 0 to 9,999 for the Staff form; reorder_level defaults to the current low-stock threshold 5.
- Staff can mutate only their own lab_id. Case-insensitive item name uniqueness applies within a lab.
- Use archival rather than deleting referenced production items; demo deletion is temporary.
- The Staff demo inventory and request sample catalogue are currently separate. Supabase integration must use this single ITEM source and synchronize stock with the movement ledger.

Unique combinations: (lab_id, item_name).

## STOCK_MOVEMENT (D4)

Auditable stock ledger for receipts, adjustments, issues, returns, consumption and disposal.

Implementation: **Planned persistent workflow**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | movement_id | uuid | No | - |
| FK | item_id | uuid | No | ITEM.item_id |
| FK | recorded_by | uuid | No | USER_ACCOUNT.account_id |
| FK | borrowing_item_id | uuid | Yes | BORROWING_ITEM.borrowing_item_id |
| FK | return_entry_id | uuid | Yes | RETURN_ENTRY.return_entry_id |
| FK | disposal_id | uuid | Yes | DISPOSAL.disposal_id |
| - | on_hand_delta | integer | No | - |
| - | owned_delta | integer | No | - |
| - | movement_type | enum | No | - |
| - | recorded_at | timestamptz | No | - |

- Update ITEM stock and the source transaction in the same database transaction. Ledger posting is not yet implemented.
- Each source event must be idempotent; do not deduct stock both from a request and a borrowing event.

## DISPOSAL (D10)

Documented physical waste disposal; lost items are not physical waste.

Implementation: **Planned persistent workflow**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | disposal_id | uuid | No | - |
| FK | item_id | uuid | No | ITEM.item_id |
| FK | recorded_by | uuid | No | USER_ACCOUNT.account_id |
| FK | return_entry_id | uuid | Yes | RETURN_ENTRY.return_entry_id |
| - | quantity | integer | No | - |
| - | waste_class | text | No | - |
| - | reason | text | No | - |
| - | disposed_at | timestamptz | No | - |
| - | status | enum | No | - |

- Disposal quantity must be positive and supported by physical stock or a damaged return.

## BORROWING (D5)

Borrowing slip header for the Staff record screen; issuance is a future transaction.

Implementation: **Demo / sample data**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | borrowing_id | uuid | No | - |
| FK | reservation_id | uuid | No | RESERVATION.reservation_id |
| FK | borrower_account_id | uuid | No | USER_ACCOUNT.account_id |
| FK | issued_by | uuid | No | USER_ACCOUNT.account_id |
|  / UK | slip_no | text | No | - |
| - | issued_at | timestamptz | No | - |
| - | due_at | timestamptz | No | - |
| - | status | enum (BORROWED, RETURNED) | No | - |
| - | closed_at | timestamptz | Yes | - |

- Current Staff borrowing slips are isolated sample records, not created from demo requests. The target FK joins a slip to a confirmed reservation.
- Issuer must be Staff of the reservation laboratory or Headlab; no cross-laboratory issue.
- Borrower account preserves the submitting Classrep/Faculty identity; selected accountable students remain in BORROWING_MEMBER.

## BORROWING_ITEM (D5)

Actual issued quantities, separate from requested quantities.

Implementation: **Planned persistent workflow**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | borrowing_item_id | uuid | No | - |
| FK | borrowing_id | uuid | No | BORROWING.borrowing_id |
| FK | request_item_id | uuid | No | REQUEST_ITEM.request_item_id |
| FK | item_id | uuid | No | ITEM.item_id |
| - | qty_issued | integer | No | - |

- All request items must belong to the borrowing reservation revision and laboratory. Manual additional items must be resolved to a stock ITEM before issuance.
- Cumulative issued quantity cannot exceed authorized/requested quantity without an approved revision.

Unique combinations: (borrowing_id, request_item_id, item_id).

## BORROWING_MEMBER (D5)

Accountable selected students, never all students in a section automatically.

Implementation: **Planned persistent workflow**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | borrow_member_id | uuid | No | - |
| FK | borrowing_id | uuid | No | BORROWING.borrowing_id |
| FK | request_member_id | uuid | No | REQUEST_MEMBER.request_member_id |

- Member must belong to the same request revision as the borrowing reservation. Classrep slips preserve selected participants; Faculty requests have no participant rows.

Unique combinations: (borrowing_id, request_member_id).

## RETURN_ENTRY (D5)

Partial-return history and outcome quantities for each issued item.

Implementation: **Planned persistent workflow**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | return_entry_id | uuid | No | - |
| FK | borrowing_item_id | uuid | No | BORROWING_ITEM.borrowing_item_id |
| FK | received_by | uuid | No | USER_ACCOUNT.account_id |
| - | qty_good | integer | No | - |
| - | qty_broken | integer | No | - |
| - | qty_lost | integer | No | - |
| - | qty_consumed | integer | No | - |
| - | recorded_at | timestamptz | No | - |

- Quantities are nonnegative and total reconciled quantity cannot exceed issued quantity. At least one outcome quantity is positive.
- Good returns restore reusable availability; loss/consumption are not physical good returns. Apply stock effects once.

## CLEARANCE (D6)

Student liabilities from a documented return and accountable selected participant.

Implementation: **Planned persistent workflow**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | clearance_id | uuid | No | - |
| FK | return_entry_id | uuid | No | RETURN_ENTRY.return_entry_id |
| FK | borrow_member_id | uuid | No | BORROWING_MEMBER.borrow_member_id |
| FK | raised_by | uuid | No | USER_ACCOUNT.account_id |
| FK | settled_by | uuid | Yes | USER_ACCOUNT.account_id |
| - | quantity | integer | No | - |
| - | reason | text | No | - |
| - | status | enum | No | - |
| - | raised_at | timestamptz | No | - |
| - | settled_at | timestamptz | Yes | - |

- Clearance remains a Classrep/student workflow. Faculty has no clearance page or implied student participants.
- Student accountability and return must come from the same borrowing transaction; allocate liability explicitly without charging every section member or counting a loss twice.

## USAGE_LOG (D11)

Actual laboratory use after a reservation; distinct from planned time.

Implementation: **Planned persistent workflow**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | usage_id | uuid | No | - |
| FK | reservation_id | uuid | No | RESERVATION.reservation_id |
| FK | borrowing_id | uuid | Yes | BORROWING.borrowing_id |
| FK | recorded_by | uuid | No | USER_ACCOUNT.account_id |
| - | actual_start | timestamptz | No | - |
| - | actual_end | timestamptz | No | - |
| - | remarks | text | Yes | - |

- Room-only use can have no borrowing slip. Faculty identity comes from the reservation class assignment.

## DAILY_TASK (D7)

Laboratory Staff work log retained for the broader documented system.

Implementation: **Planned persistent workflow**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | task_id | uuid | No | - |
| FK | lab_id | uuid | No | LABORATORY.lab_id |
| FK | recorded_by | uuid | No | USER_ACCOUNT.account_id |
| - | task_date | date | No | - |
| - | activity | text | No | - |
| - | status | enum | No | - |
| - | work_availability | text | No | - |
| - | overtime_hours | numeric | No | - |
| - | remarks | text | Yes | - |



## KNOWLEDGE_ARTICLE (D8)

Curated information for the future Lab Assistant; not an approval engine.

Implementation: **Planned persistent workflow**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | article_id | uuid | No | - |
| - | topic | text | No | - |
| - | content | text | No | - |
| - | category | text | No | - |
| - | updated_at | timestamptz | No | - |



## CHAT_EXCHANGE (D9)

Future authenticated Lab Assistant question/answer history.

Implementation: **Planned persistent workflow**.

| Key | Field | Type / values | Nullable | Reference |
| --- | --- | --- | --- | --- |
| PK | chat_id | uuid | No | - |
| FK | requester_id | uuid | No | USER_ACCOUNT.account_id |
| - | question | text | No | - |
| - | answer | text | No | - |
| - | intent | enum | No | - |
| - | response_status | enum | No | - |
| - | asked_at | timestamptz | No | - |

- Chat does not approve requests, reserve a room, mutate inventory or create a Forecast entity.

