# Section representative and Faculty account update

Confirmed workflow (2026-09-20):

- Head Laboratory manually creates Faculty accounts first, using verified name and NU email.
- Faculty manually supplies and verifies the representative's name, NU Student ID and section. There is no new online nomination module.
- Head enters these details, checks duplicates, creates/manages the account and links its subject/class assignments.
- One active representative account per section is reused across subjects. Faculty receives and manually hands representative credentials to that representative.
- Credential delivery does not determine all reservation reviewers. A representative selects an authorized active class; its Faculty reviews the request. On-schedule: Faculty; out-of-schedule: Faculty then Dean. Faculty-originated rules and the pre-assigned Dean account remain unchanged.

Updated: Docs Table 15 (creation/management), Table 7 (class selection/routing), ERD explanation and model rules, Activity P1/P2, Sequence P1/P2, overall Swimlane, and the reservation form preview/validation. Use Case ownership and DFD connections remain correct and unchanged; no external Faculty-to-representative DFD flow is needed for a manual hand-off.

The existing ERD already supports many CLASS_GROUP rows referencing one representative account, each with its own faculty_id. No extra table or account per subject was added. Production must enforce one active representative per section across assignments, validate section/term/schedule context, and derive reviewer IDs from trusted records. These are logical rules, not a deployed database constraint.

Limits: this repository has a reservation preview, not a production account backend. Live authentication, email delivery, server-side enforcement, representative replacement/history policy and live shared Activity Editor draft reconciliation are not implemented by this update. Existing member drafts are not overwritten. No password-reset or first-login-password-change feature was added.
