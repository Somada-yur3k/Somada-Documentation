# Changes Made — Required Reservation Type

Confirmed requirement: the Class Representative chooses **As a Group** (`GROUP`) or **As a Student Only** (`STUDENT_ONLY`) for **both** On-Schedule Non-Laboratory and Out-of-Schedule requests. No choice is preselected. Student Only identifies the signed-in representative. It does not create a new role or student login.

## Documentation

- **3.1.1 Product Backlog, Table 1:** items 04B and 04C require Reservation Type for Class Representatives.
- **3.1.2 Event Tables, Table 2:** both request events now validate and store the selected type before creating a reservation/hold.
- **3.1.3 Use Case Diagram, Figure 1:** adds Select Reservation Type under the existing combined reservation use case. There remain 20 main goals and six actors; supporting goals increase from 10 to 11, dependencies from 11 to 12.
- **3.1.4 Use Case Full Description, Table 7:** updates description, related behavior, actor/system steps, required validation and the supporting dependency. Documents all four Schedule Type × Reservation Type combinations. Group uses existing members; Student Only uses the account's student identity. Faculty retains its existing workflow.
- **Table 9, Reschedule:** retains the saved type and applicable accountable students; a missing legacy type must be resolved before a Class Representative request is resubmitted.
- **3.1.6 Context Diagram, Figure 2:** Class Representative request payloads carry Reservation Type, inherited from the canonical Level 1 model.
- **3.1.7 DFD, Figures 3 and 5:** adds Reservation Type to both Class Representative submission flows, D2 reservation writes/reads, and the validated request within Process 2. Existing actors, stores and flow identities are retained.
- **3.1.8 ERD, Figure 9:** adds `RESERVATION.reservation_type` and explains allowed values, required-for-role validation and reuse of `REQUEST_MEMBER`.
- **3.1.9 Activity Diagrams, Figure 11:** adds type selection and Group/Student Only alternatives before validation; alternatives use a UML merge. The Faculty path and existing approval outcomes remain.
- **3.1.10 Swimlane Diagram, Figure 15:** adds the selection/branch in the Class Representative lane; retains all six lanes including Dean.
- **System Diagrams, SEQ-02:** the Reservations major-process sequence summarizes type selection, validation, storage, rescheduling and approval routing in one A4 page.
- **Activity Editor:** supports the new merge shape; regenerates setup templates and supplies a guarded migration for existing, uncustomized Activity 2 drafts. The remote migration has not been applied.
- **Analytics:** adds the RES-01 change record and rebuilds evidence fingerprints after the source updates.

## Forms and data design

`Reservation-Form.html` provides both schedule variants with a required radio group. It hides/disables group-member controls for Student Only and derives the individual from the sample account, so stale Group selections cannot leak into the individual preview. It rejects missing/invalid types and members outside the existing class scope.

This repository is a documentation site, not a deployed reservation application. The form is a working **validation preview using sample data**; it does not write reservations or holds to Supabase. The existing Supabase integration stores shared Activity Diagram drafts, not laboratory reservations.

The logical database design uses one new attribute, not another table. `reservation_type` is required for Class Representatives; Faculty requests may leave it not applicable. `REQUEST_REVISION.request_basis / usage_type` remain separate schedule/use concepts. `CLASS_GROUP` continues to identify class/Faculty scope even for individual use. Existing `REQUEST_MEMBER` stores the signed-in representative automatically for Student Only, maintaining borrowing and clearance links without requiring a group form. Legacy records must be classified explicitly; do not silently backfill all records as Group.

For a future backend, validate requester role, type and member scope on the server and save the reservation, type, current revision, accountability rows and hold atomically. Client validation alone is not persistence or authorization. No remote database or Google Doc was changed by this local update.

## Use Case relationship decision

The existing combined request goal serves both Class Representative and Faculty. `Select Reservation Type` therefore **extends** it under the explicit Class Representative condition; that condition makes the behavior mandatory for both representative schedule variants. A unconditional `include` would incorrectly impose the new choice on Faculty. Both schedule variants remain in the existing goal, preserving approved structure.

## Verification

Run with `PLAYWRIGHT_MODULE` pointing to an available Playwright installation:

```powershell
node integrations/reservation-type/check.cjs --render
node integrations/google-docs/check-usecase-alignment.cjs
node integrations/google-docs/check-usecase.cjs --render
node integrations/google-docs/check-level1.cjs --render
node integrations/google-docs/check-level2.cjs --render
node integrations/google-docs/check-dfd-scope.cjs --render
node integrations/erd/check.cjs --render
node integrations/system-audit/build.cjs --write
node integrations/system-audit/build.cjs --check
```
