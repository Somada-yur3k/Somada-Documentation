# SOMADA UI Image-Generation Roadmap

## Purpose

This document organizes the generated UI/UX prototype work for the SOMADA Laboratory Management System. It is a generation roadmap only; it does not change the approved system workflow, role permissions, diagrams, or documentation.

Generate the UI as **small reviewable batches**, not as one complete set of screens. Each batch contains at most five related images. Approve the visual direction of one batch before generating the next.

## System Roles and Generation Order

Generate roles in this exact order:

1. Head Lab
2. Circuit Staff
3. Physics Staff
4. Class Representative
5. Faculty
6. Dean

Head Lab comes first because its sidebar, header, cards, tables, filters, badges, and visual style are the shared reference for all other role dashboards.

## Shared Visual Direction

The unfinished Head Lab prototype images are visual references, not final screens. Keep their professional laboratory-management feel, but improve hierarchy, spacing, responsive behavior, accessibility, and consistency.

### Required visual system

- Fixed desktop sidebar and compact top header.
- NU Fairview / Laboratory Services identity area in the sidebar.
- White or very light-gray workspace.
- Navy blue for primary buttons, selected tabs, and major actions.
- Soft yellow for the active sidebar item and shortcut-icon circles.
- Soft neutral or pink-gray borders for cards, filters, and tables.
- Clear semantic badges: Pending, Approved, Rejected, Ongoing, Completed, Returned, Open Clearance, Settled, Low Stock.
- Modern readable sans-serif typeface such as Inter, Poppins, or Nunito Sans.
- Rounded cards with restrained shadows; avoid excessive gradients and decoration.
- Large page title, one-line explanation, then the primary action and content.
- Responsive layouts: sidebar becomes a drawer, tables become scrollable or card-based, and key actions remain visible on mobile.

### Shared components to keep consistent

- Sidebar
- Top header with notifications and profile avatar
- Dashboard summary card
- Search field
- Filter bar
- Status badge
- Table and responsive record card
- Empty state
- Loading state
- Confirmation modal
- Record details drawer or modal
- Pagination
- Chart card

## Non-Negotiable Data and Permission Rules

- Only Head Lab creates and manages Faculty and Class Representative accounts.
- Faculty and Class Representatives do not self-register.
- Class Representative submits a reservation for the assigned class or section.
- `Submitted by: Class Representative` must be separate from `Borrower(s): selected student(s)`.
- Group reservation uses selected participating class students.
- Student Only requires exactly one selected student from the assigned class; it may be the representative or a classmate.
- Head Lab identifies the responsible student before creating a clearance.
- A Class Representative is not automatically responsible for a group member's damaged or missing item.
- Class Representatives only view clearance status; they cannot create, edit, settle, or request clearance.
- Circuit Staff sees Circuit Laboratory operations only. Physics Staff sees Physics Laboratory operations only.
- Dean sees only correctly routed approval requests.

---

# Phase 1 — Head Lab UI

## Head Lab navigation

1. Dashboard
2. Account Management
3. Faculty Management
4. Class Representative Management
5. Inventory Overview
6. Laboratory Service Requests
7. Borrowing Slip Records
8. Clearance Records
9. Broken / Loss / Consumed
10. Circuit Logs
11. Physics Logs
12. Lab Schedule
13. Waste Disposal
14. Daily Tasks
15. Lab End-Term Report
16. Notifications
17. Profile and Settings

## Batch H1 — Foundation and Account Management

Generate these five images first:

1. **Head Lab Dashboard**
   - Summary cards: total inventory, low stock, requests in progress, consumed items, open clearance, today's sessions.
   - Charts: frequently used consumables, laboratory/requester usage.
   - Recent reservation/borrowing record card.
   - Quick-access grid.
2. **Account Management**
   - Search, role filter, account status filter, user table, create-account action.
3. **Faculty Management**
   - Faculty list, assigned classes, account status, create/edit Faculty action.
4. **Class Representative Management**
   - Verified student details, student ID, section, assigned Faculty, account status, create/edit Class Rep action.
5. **Create / Edit Account Modal or Page**
   - Role-specific form, required field validation, assigned Faculty/class selection, activation status, password reset option.

### Head Lab Batch H1 acceptance rules

- Head Lab is visibly the only role with account creation actions.
- Faculty and Class Representative forms are distinct.
- The Class Representative form clearly assigns a Faculty and class/section.
- Use realistic but explicitly sample-only data.

## Batch H2 — Requests, Borrowing, and Clearance

1. **Laboratory Service Requests**
   - Search, laboratory/status/date filters, request table/cards, approval route status.
2. **Borrowing Slip Records**
   - Tabs for service requests and borrowing slips, laboratory/status filters, return-status badge.
   - Clearly separate submitting Class Rep and actual selected borrower(s).
3. **Borrowing Slip Details**
   - Items issued, quantities, condition, return history, selected student/group, staff handling.
4. **Clearance Records**
   - Search, status filter, laboratory filter, clearance cards/table, create clearance action.
5. **Create / Update Clearance Record**
   - Reservation and borrowing evidence, responsible student selector, item/reason, remarks, settlement status.

## Batch H3 — Inventory and Daily Operations

1. Inventory Overview — include a Head Lab-only Inventory Forecast tab/action (not a separate sidebar module).
2. Inventory Item Details / Movement History
3. Broken / Loss / Consumed Records
4. Lab Schedule Management
5. Daily Task Management

### Inventory Forecast screen — generate separately after Batch H3

Use the same Head Lab visual style. Show Circuits / Physics selector, next-month forecast period and Generate / Refresh action. Results show item, current usable stock, estimated consumption or concurrent equipment demand, suggested consumable restock / possible equipment shortage, explanation, history coverage and generated date. Include loading, no inventory, Insufficient history and retrieval-error states. Keep rule-based current low-stock alerts distinct from predicted shortages. Head reviews only: no Buy, Auto-order or automatic stock-adjustment action. This is a design specification, not a claim of a deployed AI model; label a formula-only baseline as usage-based forecasting. Ordinary Staff, Class Rep, Faculty and Dean pages do not receive this feature.

## Batch H4 — Logs, Disposal, and Reporting

1. Circuit Laboratory Logs
2. Physics Laboratory Logs
3. Waste Disposal Records
4. Lab End-Term Report
5. Report Export / Print Preview

---

# Phase 2 — Laboratory Staff UI

Circuit Staff and Physics Staff use the same structure but are restricted to their own laboratory data. Generate Circuit Staff first, approve it, then adapt the same design for Physics Staff.

## Circuit Staff navigation

1. Dashboard
2. Circuit Schedule
3. Prepare Items
4. Issue Items
5. Return Items
6. Circuit Inventory
7. Daily Tasks
8. Notifications
9. Profile

## Batch CS1 — Circuit Staff Core Operations

1. Circuit Staff Dashboard
2. Circuit Schedule
3. Prepare Items
4. Issue Items
5. Process Returns

### Circuit Staff UI rules

- Only Circuit Laboratory records are visible.
- Staff may record returned quantity, missing quantity, damage, and condition.
- Staff may report a return issue to Head Lab, but cannot create or settle a clearance.

## Batch CS2 — Circuit Staff Supporting Pages

1. Circuit Inventory
2. Inventory Item Details
3. Daily Tasks
4. Notifications
5. Profile

## Physics Staff batches

Generate the exact equivalent after Circuit Staff is approved:

- **PS1:** Dashboard, Physics Schedule, Prepare Items, Issue Items, Process Returns.
- **PS2:** Physics Inventory, Item Details, Daily Tasks, Notifications, Profile.

---

# Phase 3 — Class Representative UI

## Class Representative navigation

1. Dashboard
2. Make Reservation
3. My Reservations
4. Schedule
5. Borrowing Slips
6. Clearance Status
7. Notifications
8. Profile

## Batch CR1 — Reservation Journey

1. Class Representative Dashboard
2. Make Reservation — class, laboratory, date, time, and purpose
3. Make Reservation — Group / Student Only selection
4. Make Reservation — selected students and equipment confirmation
5. Reservation Submitted / Request Details

### Class Representative UI rules

- Use a guided multi-step reservation form.
- Group means selected participating students from the assigned class.
- Student Only must show one required selected-student field.
- Do not preselect the Class Representative as borrower.
- Clearly show the selected student(s) before final submission.

## Batch CR2 — Status and Records

1. My Reservations
2. Reservation Detail / Approval History
3. Schedule and Availability
4. Borrowing Slip List and Details
5. Clearance Status — read-only

## Batch CR3 — Supporting Pages

1. Notifications
2. Profile
3. Empty State / No Reservations
4. Rejected Reservation with Reason
5. Mobile Dashboard / Sidebar Drawer

---

# Phase 4 — Faculty UI

## Faculty navigation

1. Dashboard
2. Reservation Requests
3. My Laboratory Requests
4. Schedule
5. Class Representatives
6. Notifications
7. Profile

## Batch F1 — Review and Approval

1. Faculty Dashboard
2. Reservation Requests List
3. Request Details and Approval Panel
4. Reject Request Modal with Required Reason
5. Out-of-Schedule Request Routed to Dean

### Faculty UI rules

- Show Class Representative as the submitter and student/group as actual borrower(s).
- On-schedule Class Rep requests are reviewed by Faculty.
- Approved out-of-schedule Class Rep requests are routed to Dean.
- Faculty out-of-schedule requests are routed to Dean.

## Batch F2 — Faculty Supporting Pages

1. My Laboratory Requests
2. Schedule
3. Class Representative Information
4. Notifications
5. Profile

---

# Phase 5 — Dean UI

## Dean navigation

1. Dashboard
2. Approval Requests
3. Schedule Overview
4. Notifications
5. Profile

## Batch D1 — Approval Workspace

1. Dean Dashboard
2. Routed Approval Requests List
3. Approval Request Details
4. Approve / Reject Decision Modal
5. Schedule Overview

### Dean UI rules

- Only correctly routed requests appear.
- Display Faculty review/decision before the Dean makes a final decision when applicable.
- Keep the layout focused on decision information; do not expose inventory, staff operations, clearance creation, or account management.

## Batch D2 — Supporting Pages

1. Approval History
2. Notifications
3. Profile
4. Empty State / No Pending Approvals
5. Mobile Approval View

---

# Generation Prompt Checklist

Before generating any batch, include all applicable instructions below:

1. State the role and exact five screens being generated.
2. State that it is a high-fidelity web dashboard UI mockup, not a mobile-only app and not an HTML implementation.
3. Require the shared SOMADA visual system and consistent sidebar/header.
4. Require role-specific navigation and hide unauthorized functions.
5. Use readable English labels; do not use lorem ipsum or unreadable placeholder text.
6. Use sample data only; avoid real personal information.
7. Preserve workflow rules from this document.
8. Request a desktop 16:9 or 1440px-wide layout unless the screen is explicitly a mobile view.
9. Use clear tables, filters, cards, semantic badges, and visible primary actions.
10. Review the batch before starting the next five screens.

# Final Completion Checklist

Do not consider the UI image set complete until all of these exist:

- Head Lab: all four batches H1–H4.
- Circuit Staff: batches CS1–CS2.
- Physics Staff: batches PS1–PS2.
- Class Representative: batches CR1–CR3.
- Faculty: batches F1–F2.
- Dean: batches D1–D2.
- A shared desktop/mobile visual system.
- No screen grants a role a function it is not authorized to perform.
- The submitter/borrower/clearance responsibilities are clear on every applicable screen.
