# Chatbot diagram alignment

## Updated

- Docs: Level 1 narrative now records 73 flows (48 external, 25 store flows).
- DFD Level 1: removed chatbot reads of Reservation Status Data (D2) and Schedule Availability Data (D3). Reservation workflows retain their own reads.
- DFD Level 2, Process 3: same two reads removed; retrieve step now identifies laboratory knowledge/current stock. Seven boundary flows remain balanced with Level 1.
- Activity 3: reads laboratory knowledge/current stock, answers from evidence or states unavailable, and saves requester-scoped history. Unpermitted questions still receive a refusal.
- Overall Swimlane: short chatbot action identifies laboratory/equipment information or hours. No extra detailed branches or actors added.
- ERD notes: KNOWLEDGE_ARTICLE holds approved Circuits/Physics information, equipment guidance and hours; CHAT_EXCHANGE records questions/answers. Inventory is read from existing item records, not copied into a new availability table.

## Already correct

- Level 0 Inquiry/Answer exchanges do not change; question categories are internal details.
- ERD remains 25 tables and 51 PK–FK relationships. No duplicate Circuits/Physics knowledge tables, equipment-availability table or generated-answer table is necessary. Knowledge articles and conversation exchanges have different identities/lifecycles.
- Current inventory availability is informational only, not a stock hold or future-session guarantee.
- Account, reservation, clearance and reporting processes are not changed by this scope update.

## Remaining issues / limits

- Resolved in the approved Sequence follow-up: Sequence 3 now uses D4/D8/D9 only, with laboratory/equipment information and hours; D2/D3 lookups removed.
- The existing straight Login associations cross some use-case shapes; this update does not alter the requested straight-line layout.
- Level 1's existing layout reports connector crossings, despite passing its built-in geometry assertions. It is not a crossing-free layout; no full Level 1 rerouting is claimed.
- Knowledge-base editing ownership remains pending. No live database migration, Google Docs write, commit or push performed.

This report supersedes the earlier use-case-only scope note. Log In has since been restored and Head Lab Information renamed to Circuits / Physics Laboratory Information.
