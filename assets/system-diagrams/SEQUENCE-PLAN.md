# Sequence diagrams — five-major-process structure

The Sequence section now follows the same five-parent structure as DFD Level 1 and the Activity Diagrams. Related use cases are summarized inside guarded `alt`, `opt`, and `par` fragments instead of producing 25 separate pages.

| Sequence | Major process | DFD Level 2 coverage | Main interactions summarized |
|---|---|---|---|
| SEQ-01 | User Access and Account Management | 1.1–1.3 | Login; Head Lab creates or updates Faculty/Class Representative accounts |
| SEQ-02 | Reservations, Availability and Approvals | 2.1–2.4 | Availability/status/history; submit/reschedule; Faculty/Dean decisions; cancellation |
| SEQ-03 | Laboratory Questions | 3.1–3.4 | Scope classification; evidence lookup; grounded answer/refusal; Q&A history |
| SEQ-04 | Equipment and Borrowing Management | 4.1–4.5 | Inventory operations; issuance; return reconciliation; waste disposal |
| SEQ-05 | Laboratory Administration and Reporting | 5.1–5.5 | Schedule; daily tasks; clearance; own-group status; end-term report/export |

## Modeling decisions

- Each diagram is one A4 portrait page and maps to exactly one major process.
- Every one of the 20 documented use cases and all 21 DFD Level 2 child processes remains traceable through sequence metadata.
- Alternative operations are not claimed to happen in one transaction. The `alt` frame shows that one applicable interaction path is followed.
- Human actors communicate with the Web System, never directly with the Database.
- Faculty and Dean approval actions remain separate actor messages inside SEQ-02. Out-of-schedule Class Representative requests use available Faculty then Dean; they may route directly to Dean only when the assigned Faculty is unavailable. Faculty out-of-schedule requests require Dean.
- The end-term report retains a `par` fragment for its two independent read-only evidence inputs, followed by an optional export.
- Solid filled-head calls, dashed open-head replies, lifelines, activations, and UML combined fragments follow the project’s UML notation guide.

This consolidation changes presentation only. It does not remove any documented use case, actor restriction, DFD child process, record group, validation rule, or approval route.
