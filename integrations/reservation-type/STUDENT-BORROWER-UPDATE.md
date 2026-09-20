# Student borrower and clearance clarification — 2026-09-20

Class Rep is the submitting account for the section, not automatically the borrower. Group uses selected participating class students. Student Only requires one explicitly selected student from the assigned class, including the representative if applicable. Ordinary students need student records, not login accounts. Schedule type and Faculty/Dean approval routes are unchanged.

## Documentation updated

- Table 1, backlog 04B: distinguishes submitting account from participating classmates.
- Event table: on-schedule and out-of-schedule submission now includes selecting applicable students.
- Table 7: description, actor/system steps, required selections, validation, exceptions and Select Reservation Type behavior.
- Table 12: Class Rep views existing student clearance only, including Group and Student Only; no clearance application.
- Table 17: borrowing slip preserves the submitting account and actual selected borrowers separately.
- Table 19: Head identifies the responsible borrowing participant before creating clearance; no automatic liability for the Class Rep or the entire group. Student, item, reason and status appear in the Class Rep account.
- Proposed-process comparison: damage/loss is linked to an identified student, not automatically an entire group.
- Reservation preview explanation, ERD explanation and Swimlane explanation: aligned with the clarified borrower and clearance roles.

## Related artifacts

- Reservation preview: required individual-student selector, assignment validation and clearing stale selections when changing class; Group selections are ignored for Student Only.
- ERD notes: RESERVATION.requester_id is the submitting account; REQUEST_MEMBER/BORROWING_MEMBER preserve selected borrowers; CLEARANCE targets an identified participant and return outcome. Existing tables and PK/FK structure are sufficient.
- DFD 0–2: concise labels and topology unchanged; selected student IDs are explicit in canonical request/record payload metadata alongside reservation_type. No Class Rep clearance-creation flow added.
- Activity 2: choose a class student, not automatically self. Activity 5: Head identifies, creates/settles; Rep views only.
- Sequence 2: selected-student explanation. Sequence 5: View student clearance status replaces misleading Request own-group clearance; Head identification is explicit.
- Swimlane: student selection; Head identifies/creates clearance; Class Rep views its student/item/status.
- Use Case ownership and Deployment remain unchanged: Head processes clearance, Class Rep views status; no new actor or infrastructure is required.

## Preserved limits

Reservation remains Ongoing while an unresolved return balance exists. Completing it automatically after settlement remains a pending policy decision. Production account/reservation/clearance backend enforcement is not implemented by these local documentation/preview changes. Existing shared editor drafts are not overwritten; fresh-install templates only are refreshed. No live Google Docs, database, commit, push or deployment is performed by this update.
