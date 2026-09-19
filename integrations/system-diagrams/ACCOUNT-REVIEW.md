# Head Laboratory account responsibility review

## Updated

- Documentation: backlog 02, account event and Table 15 now describe creating and managing Faculty / Class Representative accounts. Updates cover details, applicable Faculty assignment and active/inactive status; retain the existing role and linked history. No credential reset or hard deletion is added.
- Use Case: renamed the existing Head-only goal to Manage Class Representative / Faculty Accounts; retained its stable ID and actor association.
- DFD 0/1/2: Account Management Details replaces issuance-only input. Process 1.3 manages both roles, with a D1 read for existing accounts, balanced to the existing Level 1 Account Data flow.
- Activity P1: Head-only create/update flow and creation-only credential delivery.
- Sequence SEQ-01: distinct Create / Update alternatives inside the User Access major process; authorization and permitted role checks; no credential email for updates.
- Swimlane: explicit Faculty / Class Representative account management in the Head Lab lane. Existing schedule/daily-task work is retained separately.
- ERD: documented administration scope on USER_ACCOUNT. Existing role/status fields and relationships already support it; no table or relationship was added.
- Regenerated figures and refreshed analytics evidence and fresh-install Activity Editor seeds.

## Already correct

- Head Laboratory is the only account-creation actor; Faculty and Class Representatives do not self-register.
- Representative identity uses NU Student ID with an existing Faculty assignment; Faculty identity uses NU email.
- Faculty receives its own credentials or the assigned representative's credentials for hand-off.
- Dean is pre-assigned; no Dean or Staff account-administration permission was added.

## Deployment boundary

These are local documentation/model changes, not a deployed authentication implementation. Existing shared Activity Editor templates/drafts may still hold the previous P1 version. Fresh-install public-setup.sql does not overwrite existing rows; reconcile existing shared drafts separately to preserve member edits. No live database, Google Docs, Git push or deployment was performed during this review.
