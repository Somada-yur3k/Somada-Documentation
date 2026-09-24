# ERD Tables

## Entity Data Dictionary

## D1 — User Accounts

### STUDENT

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | student_id | id | No |
| UK | student_number | text | No |
| — | full_name | text | No |
| — | program | text | No |
| — | year_section | text | No |

### USER_ACCOUNT

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | account_id | id | No |
| FK / UK | student_id | id | Yes |
| FK | staff_lab_id | id | Yes |
| UK | login_identifier | text | No |
| — | password_hash | text | No |
| — | role | enum | No |
| — | status | enum | No |
| — | last_login_at | datetime | Yes |

### CLASS_GROUP

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | group_id | id | No |
| FK | term_id | id | No |
| FK | faculty_id | id | No |
| FK | representative_id | id | No |
| — | subject_code | text | No |
| — | year_section | text | No |
| — | active | boolean | No |

### GROUP_MEMBER

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | group_member_id | id | No |
| FK | group_id | id | No |
| FK | student_id | id | No |
| — | active | boolean | No |

## D2 — Reservation Records

### RESERVATION

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | request_id | id | No |
| FK | requester_id | id | No |
| FK | group_id | id | No |
| — | reservation_type | enum | Yes |
| UK | reference_no | text | No |
| — | purpose | text | No |
| — | status | enum | No |
| — | filed_at | datetime | No |

### REQUEST_REVISION

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | revision_id | id | No |
| FK | request_id | id | No |
| FK | lab_id | id | No |
| FK | block_id | id | Yes |
| FK | changed_by | id | No |
| — | revision_no | integer | No |
| — | starts_at | datetime | No |
| — | ends_at | datetime | No |
| — | request_basis | enum | No |
| — | usage_type | enum | No |
| — | is_current | boolean | No |

### APPROVAL

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | approval_id | id | No |
| FK / UK | revision_id | id | No |
| FK | approver_id | id | No |
| — | route_order | integer | No |
| — | decision | enum | No |
| — | decided_at | datetime | Yes |

### REQUEST_ITEM

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | request_item_id | id | No |
| FK | revision_id | id | No |
| FK | item_id | id | No |
| — | qty_requested | quantity | No |

### REQUEST_MEMBER

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | request_member_id | id | No |
| FK | revision_id | id | No |
| FK | student_id | id | No |

## D3 — Laboratory Schedule

### TERM

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | term_id | id | No |
| UK | term_code | text | No |
| — | starts_on | date | No |
| — | ends_on | date | No |

### LABORATORY

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | lab_id | id | No |
| UK | room_name | text | No |
| — | lab_type | enum | No |
| — | active | boolean | No |

### SCHEDULE_BLOCK

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | block_id | id | No |
| FK | lab_id | id | No |
| FK | term_id | id | No |
| FK | group_id | id | Yes |
| — | starts_at | datetime | No |
| — | ends_at | datetime | No |
| — | block_type | enum | No |

## D4 — Equipment Inventory

### ITEM_CATEGORY

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | category_id | id | No |
| UK | category_name | text | No |
| — | description | text | No |

### ITEM

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | item_id | id | No |
| FK | lab_id | id | No |
| FK | category_id | id | No |
| — | item_name | text | No |
| — | item_type | enum | No |
| — | unit | text | No |
| — | reorder_level | quantity | No |
| — | condition_status | enum | No |

### STOCK_MOVEMENT

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | movement_id | id | No |
| FK | item_id | id | No |
| FK | recorded_by | id | No |
| FK | borrowing_item_id | id | Yes |
| FK | return_entry_id | id | Yes |
| FK | disposal_id | id | Yes |
| — | on_hand_delta | quantity | No |
| — | owned_delta | quantity | No |
| — | movement_type | enum | No |
| — | recorded_at | datetime | No |

## D5 — Borrowing Slip Records

### BORROWING

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | borrowing_id | id | No |
| FK | revision_id | id | No |
| FK | issued_by | id | No |
| UK | slip_no | text | No |
| — | issued_at | datetime | No |
| — | status | enum | No |

### BORROWING_ITEM

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | borrowing_item_id | id | No |
| FK | borrowing_id | id | No |
| FK | request_item_id | id | No |
| — | qty_issued | quantity | No |

### BORROWING_MEMBER

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | borrow_member_id | id | No |
| FK | borrowing_id | id | No |
| FK | request_member_id | id | No |

### RETURN_ENTRY

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | return_entry_id | id | No |
| FK | borrowing_item_id | id | No |
| FK | received_by | id | No |
| — | qty_good | quantity | No |
| — | qty_broken | quantity | No |
| — | qty_lost | quantity | No |
| — | qty_consumed | quantity | No |
| — | recorded_at | datetime | No |

## D6 — Clearance Records

### CLEARANCE

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | clearance_id | id | No |
| FK | return_entry_id | id | No |
| FK | borrow_member_id | id | No |
| FK | raised_by | id | No |
| FK | settled_by | id | Yes |
| — | quantity | quantity | No |
| — | reason | text | No |
| — | status | enum | No |
| — | raised_at | datetime | No |
| — | settled_at | datetime | Yes |

## D7 — Daily Task Records

### DAILY_TASK

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | task_id | id | No |
| FK | lab_id | id | No |
| FK | recorded_by | id | No |
| — | task_date | date | No |
| — | activity | text | No |
| — | status | enum | No |
| — | work_availability | text | No |
| — | overtime_hours | quantity | No |
| — | remarks | text | Yes |

## D8 — Knowledge Base

### KNOWLEDGE_ARTICLE

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | article_id | id | No |
| — | topic | text | No |
| — | content | text | No |
| — | category | text | No |
| — | updated_at | datetime | No |

## D9 — Chat Interaction History

### CHAT_EXCHANGE

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | chat_id | id | No |
| FK | requester_id | id | No |
| — | question | text | No |
| — | answer | text | No |
| — | intent | enum | No |
| — | response_status | enum | No |
| — | asked_at | datetime | No |

## D10 — Disposal Records

### DISPOSAL

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | disposal_id | id | No |
| FK | item_id | id | No |
| FK | recorded_by | id | No |
| FK | return_entry_id | id | Yes |
| — | quantity | quantity | No |
| — | waste_class | enum | No |
| — | reason | text | No |
| — | disposed_at | datetime | No |
| — | status | enum | No |

## D11 — Laboratory Usage Logs

### USAGE_LOG

| Key | Field | Type | Nullable |
|---|---|---|---|
| PK | usage_id | id | No |
| FK | revision_id | id | No |
| FK | borrowing_id | id | Yes |
| FK | faculty_id | id | No |
| FK | recorded_by | id | No |
| — | actual_start | datetime | No |
| — | actual_end | datetime | No |
| — | remarks | text | Yes |
