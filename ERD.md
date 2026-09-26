# Entity–Relationship Diagram (ERD)

## Readable print edition

The schema is unchanged: 25 tables, 161 attributes and 51 PK-FK relationships. The main document uses the complete A4 portrait ERD, with larger definitions and cardinalities in Appendix A across six A4 detail pages. Each full table appears once within the appendix. R01-R51 identify the FK pairs; A1-A6 identify the parent and child detail pages. Repeated names in relationship reference rows are not additional entities.

- [Readable A4 viewer](ERD-PRINT.html)
- [Overview and six A4 detail pages (PDF)](assets/erd/erd-a4-readable.pdf)
- [Main documentation and Appendix A](Docs.html#erd)

## Entity Data Dictionary

## D1 — User Accounts

### STUDENT

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | student_id | id | No | — |
| UK | student_number | text | No | — |
| — | full_name | text | No | — |
| — | program | text | No | — |
| — | year_section | text | No | — |

### USER_ACCOUNT

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | account_id | id | No | — |
| FK / UK | student_id | id | Yes | STUDENT.student_id |
| FK | staff_lab_id | id | Yes | LABORATORY.lab_id |
| UK | login_identifier | text | No | — |
| — | password_hash | text | No | — |
| — | role | enum | No | — |
| — | status | enum | No | — |
| — | last_login_at | datetime | Yes | — |

### CLASS_GROUP

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | group_id | id | No | — |
| FK | term_id | id | No | TERM.term_id |
| FK | faculty_id | id | No | USER_ACCOUNT.account_id |
| FK | representative_id | id | No | USER_ACCOUNT.account_id |
| — | subject_code | text | No | — |
| — | year_section | text | No | — |
| — | active | boolean | No | — |

### GROUP_MEMBER

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | group_member_id | id | No | — |
| FK | group_id | id | No | CLASS_GROUP.group_id |
| FK | student_id | id | No | STUDENT.student_id |
| — | active | boolean | No | — |

## D2 — Reservation Records

### RESERVATION

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | request_id | id | No | — |
| FK | requester_id | id | No | USER_ACCOUNT.account_id |
| FK | group_id | id | No | CLASS_GROUP.group_id |
| — | reservation_type | enum | Yes | — |
| UK | reference_no | text | No | — |
| — | purpose | text | No | — |
| — | status | enum | No | — |
| — | filed_at | datetime | No | — |

### REQUEST_REVISION

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | revision_id | id | No | — |
| FK | request_id | id | No | RESERVATION.request_id |
| FK | lab_id | id | No | LABORATORY.lab_id |
| FK | block_id | id | Yes | SCHEDULE_BLOCK.block_id |
| FK | changed_by | id | No | USER_ACCOUNT.account_id |
| — | revision_no | integer | No | — |
| — | starts_at | datetime | No | — |
| — | ends_at | datetime | No | — |
| — | request_basis | enum | No | — |
| — | usage_type | enum | No | — |
| — | is_current | boolean | No | — |

### APPROVAL

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | approval_id | id | No | — |
| FK / UK | revision_id | id | No | REQUEST_REVISION.revision_id |
| FK | approver_id | id | No | USER_ACCOUNT.account_id |
| — | route_order | integer | No | — |
| — | decision | enum | No | — |
| — | decided_at | datetime | Yes | — |

### REQUEST_ITEM

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | request_item_id | id | No | — |
| FK | revision_id | id | No | REQUEST_REVISION.revision_id |
| FK | item_id | id | No | ITEM.item_id |
| — | qty_requested | quantity | No | — |

### REQUEST_MEMBER

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | request_member_id | id | No | — |
| FK | revision_id | id | No | REQUEST_REVISION.revision_id |
| FK | student_id | id | No | STUDENT.student_id |

## D3 — Laboratory Schedule

### TERM

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | term_id | id | No | — |
| UK | term_code | text | No | — |
| — | starts_on | date | No | — |
| — | ends_on | date | No | — |

### LABORATORY

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | lab_id | id | No | — |
| UK | room_name | text | No | — |
| — | lab_type | enum | No | — |
| — | active | boolean | No | — |

### SCHEDULE_BLOCK

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | block_id | id | No | — |
| FK | lab_id | id | No | LABORATORY.lab_id |
| FK | term_id | id | No | TERM.term_id |
| FK | group_id | id | Yes | CLASS_GROUP.group_id |
| — | starts_at | datetime | No | — |
| — | ends_at | datetime | No | — |
| — | block_type | enum | No | — |

## D4 — Equipment Inventory

### ITEM_CATEGORY

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | category_id | id | No | — |
| UK | category_name | text | No | — |
| — | description | text | No | — |

### ITEM

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | item_id | id | No | — |
| FK | lab_id | id | No | LABORATORY.lab_id |
| FK | category_id | id | No | ITEM_CATEGORY.category_id |
| — | item_name | text | No | — |
| — | item_type | enum | No | — |
| — | unit | text | No | — |
| — | reorder_level | quantity | No | — |
| — | condition_status | enum | No | — |

### STOCK_MOVEMENT

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | movement_id | id | No | — |
| FK | item_id | id | No | ITEM.item_id |
| FK | recorded_by | id | No | USER_ACCOUNT.account_id |
| FK | borrowing_item_id | id | Yes | BORROWING_ITEM.borrowing_item_id |
| FK | return_entry_id | id | Yes | RETURN_ENTRY.return_entry_id |
| FK | disposal_id | id | Yes | DISPOSAL.disposal_id |
| — | on_hand_delta | quantity | No | — |
| — | owned_delta | quantity | No | — |
| — | movement_type | enum | No | — |
| — | recorded_at | datetime | No | — |

## D5 — Borrowing Slip Records

### BORROWING

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | borrowing_id | id | No | — |
| FK | revision_id | id | No | REQUEST_REVISION.revision_id |
| FK | issued_by | id | No | USER_ACCOUNT.account_id |
| UK | slip_no | text | No | — |
| — | issued_at | datetime | No | — |
| — | status | enum | No | — |

### BORROWING_ITEM

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | borrowing_item_id | id | No | — |
| FK | borrowing_id | id | No | BORROWING.borrowing_id |
| FK | request_item_id | id | No | REQUEST_ITEM.request_item_id |
| — | qty_issued | quantity | No | — |

### BORROWING_MEMBER

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | borrow_member_id | id | No | — |
| FK | borrowing_id | id | No | BORROWING.borrowing_id |
| FK | request_member_id | id | No | REQUEST_MEMBER.request_member_id |

### RETURN_ENTRY

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | return_entry_id | id | No | — |
| FK | borrowing_item_id | id | No | BORROWING_ITEM.borrowing_item_id |
| FK | received_by | id | No | USER_ACCOUNT.account_id |
| — | qty_good | quantity | No | — |
| — | qty_broken | quantity | No | — |
| — | qty_lost | quantity | No | — |
| — | qty_consumed | quantity | No | — |
| — | recorded_at | datetime | No | — |

## D6 — Clearance Records

### CLEARANCE

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | clearance_id | id | No | — |
| FK | return_entry_id | id | No | RETURN_ENTRY.return_entry_id |
| FK | borrow_member_id | id | No | BORROWING_MEMBER.borrow_member_id |
| FK | raised_by | id | No | USER_ACCOUNT.account_id |
| FK | settled_by | id | Yes | USER_ACCOUNT.account_id |
| — | quantity | quantity | No | — |
| — | reason | text | No | — |
| — | status | enum | No | — |
| — | raised_at | datetime | No | — |
| — | settled_at | datetime | Yes | — |

## D7 — Daily Task Records

### DAILY_TASK

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | task_id | id | No | — |
| FK | lab_id | id | No | LABORATORY.lab_id |
| FK | recorded_by | id | No | USER_ACCOUNT.account_id |
| — | task_date | date | No | — |
| — | activity | text | No | — |
| — | status | enum | No | — |
| — | work_availability | text | No | — |
| — | overtime_hours | quantity | No | — |
| — | remarks | text | Yes | — |

## D8 — Knowledge Base

### KNOWLEDGE_ARTICLE

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | article_id | id | No | — |
| — | topic | text | No | — |
| — | content | text | No | — |
| — | category | text | No | — |
| — | updated_at | datetime | No | — |

## D9 — Chat Interaction History

### CHAT_EXCHANGE

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | chat_id | id | No | — |
| FK | requester_id | id | No | USER_ACCOUNT.account_id |
| — | question | text | No | — |
| — | answer | text | No | — |
| — | intent | enum | No | — |
| — | response_status | enum | No | — |
| — | asked_at | datetime | No | — |

## D10 — Disposal Records

### DISPOSAL

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | disposal_id | id | No | — |
| FK | item_id | id | No | ITEM.item_id |
| FK | recorded_by | id | No | USER_ACCOUNT.account_id |
| FK | return_entry_id | id | Yes | RETURN_ENTRY.return_entry_id |
| — | quantity | quantity | No | — |
| — | waste_class | enum | No | — |
| — | reason | text | No | — |
| — | disposed_at | datetime | No | — |
| — | status | enum | No | — |

## D11 — Laboratory Usage Logs

### USAGE_LOG

| Key | Field | Type | Nullable | Reference |
|---|---|---|---|---|
| PK | usage_id | id | No | — |
| FK | revision_id | id | No | REQUEST_REVISION.revision_id |
| FK | borrowing_id | id | Yes | BORROWING.borrowing_id |
| FK | faculty_id | id | No | USER_ACCOUNT.account_id |
| FK | recorded_by | id | No | USER_ACCOUNT.account_id |
| — | actual_start | datetime | No | — |
| — | actual_end | datetime | No | — |
| — | remarks | text | Yes | — |

## Relationship Register

| ID | Parent | Child FK | Parent cardinality | Child cardinality |
|---|---|---|---|---|
| R01 | STUDENT.student_id | USER_ACCOUNT.student_id | 0..1 | 0..1 |
| R02 | LABORATORY.lab_id | USER_ACCOUNT.staff_lab_id | 0..1 | 0..* |
| R03 | TERM.term_id | CLASS_GROUP.term_id | 1 | 0..* |
| R04 | USER_ACCOUNT.account_id | CLASS_GROUP.faculty_id | 1 | 0..* |
| R05 | USER_ACCOUNT.account_id | CLASS_GROUP.representative_id | 1 | 0..* |
| R06 | CLASS_GROUP.group_id | GROUP_MEMBER.group_id | 1 | 0..* |
| R07 | STUDENT.student_id | GROUP_MEMBER.student_id | 1 | 0..* |
| R08 | LABORATORY.lab_id | SCHEDULE_BLOCK.lab_id | 1 | 0..* |
| R09 | TERM.term_id | SCHEDULE_BLOCK.term_id | 1 | 0..* |
| R10 | CLASS_GROUP.group_id | SCHEDULE_BLOCK.group_id | 0..1 | 0..* |
| R11 | USER_ACCOUNT.account_id | RESERVATION.requester_id | 1 | 0..* |
| R12 | CLASS_GROUP.group_id | RESERVATION.group_id | 1 | 0..* |
| R13 | RESERVATION.request_id | REQUEST_REVISION.request_id | 1 | 0..* |
| R14 | LABORATORY.lab_id | REQUEST_REVISION.lab_id | 1 | 0..* |
| R15 | SCHEDULE_BLOCK.block_id | REQUEST_REVISION.block_id | 0..1 | 0..* |
| R16 | USER_ACCOUNT.account_id | REQUEST_REVISION.changed_by | 1 | 0..* |
| R17 | REQUEST_REVISION.revision_id | APPROVAL.revision_id | 1 | 0..1 |
| R18 | USER_ACCOUNT.account_id | APPROVAL.approver_id | 1 | 0..* |
| R19 | REQUEST_REVISION.revision_id | REQUEST_ITEM.revision_id | 1 | 0..* |
| R20 | ITEM.item_id | REQUEST_ITEM.item_id | 1 | 0..* |
| R21 | REQUEST_REVISION.revision_id | REQUEST_MEMBER.revision_id | 1 | 0..* |
| R22 | STUDENT.student_id | REQUEST_MEMBER.student_id | 1 | 0..* |
| R23 | REQUEST_REVISION.revision_id | BORROWING.revision_id | 1 | 0..* |
| R24 | USER_ACCOUNT.account_id | BORROWING.issued_by | 1 | 0..* |
| R25 | BORROWING.borrowing_id | BORROWING_ITEM.borrowing_id | 1 | 0..* |
| R26 | REQUEST_ITEM.request_item_id | BORROWING_ITEM.request_item_id | 1 | 0..* |
| R27 | BORROWING.borrowing_id | BORROWING_MEMBER.borrowing_id | 1 | 0..* |
| R28 | REQUEST_MEMBER.request_member_id | BORROWING_MEMBER.request_member_id | 1 | 0..* |
| R29 | BORROWING_ITEM.borrowing_item_id | RETURN_ENTRY.borrowing_item_id | 1 | 0..* |
| R30 | USER_ACCOUNT.account_id | RETURN_ENTRY.received_by | 1 | 0..* |
| R31 | RETURN_ENTRY.return_entry_id | CLEARANCE.return_entry_id | 1 | 0..* |
| R32 | BORROWING_MEMBER.borrow_member_id | CLEARANCE.borrow_member_id | 1 | 0..* |
| R33 | USER_ACCOUNT.account_id | CLEARANCE.raised_by | 1 | 0..* |
| R34 | USER_ACCOUNT.account_id | CLEARANCE.settled_by | 0..1 | 0..* |
| R35 | LABORATORY.lab_id | ITEM.lab_id | 1 | 0..* |
| R36 | ITEM_CATEGORY.category_id | ITEM.category_id | 1 | 0..* |
| R37 | ITEM.item_id | STOCK_MOVEMENT.item_id | 1 | 0..* |
| R38 | USER_ACCOUNT.account_id | STOCK_MOVEMENT.recorded_by | 1 | 0..* |
| R39 | BORROWING_ITEM.borrowing_item_id | STOCK_MOVEMENT.borrowing_item_id | 0..1 | 0..* |
| R40 | RETURN_ENTRY.return_entry_id | STOCK_MOVEMENT.return_entry_id | 0..1 | 0..* |
| R41 | DISPOSAL.disposal_id | STOCK_MOVEMENT.disposal_id | 0..1 | 0..* |
| R42 | ITEM.item_id | DISPOSAL.item_id | 1 | 0..* |
| R43 | USER_ACCOUNT.account_id | DISPOSAL.recorded_by | 1 | 0..* |
| R44 | RETURN_ENTRY.return_entry_id | DISPOSAL.return_entry_id | 0..1 | 0..* |
| R45 | REQUEST_REVISION.revision_id | USAGE_LOG.revision_id | 1 | 0..* |
| R46 | BORROWING.borrowing_id | USAGE_LOG.borrowing_id | 0..1 | 0..* |
| R47 | USER_ACCOUNT.account_id | USAGE_LOG.faculty_id | 1 | 0..* |
| R48 | USER_ACCOUNT.account_id | USAGE_LOG.recorded_by | 1 | 0..* |
| R49 | LABORATORY.lab_id | DAILY_TASK.lab_id | 1 | 0..* |
| R50 | USER_ACCOUNT.account_id | DAILY_TASK.recorded_by | 1 | 0..* |
| R51 | USER_ACCOUNT.account_id | CHAT_EXCHANGE.requester_id | 1 | 0..* |
