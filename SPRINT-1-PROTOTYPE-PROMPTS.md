# Sprint 1 UI Image-Generation Prompts

These are prompts for generating **UI mockup images**, not code, a working prototype, or a database. Attach a screenshot or Figma frame of the **current Head Lab Dashboard** each time you generate a page. That frame is the visual reference for the sidebar, header, typography, spacing, colors, cards, tables, and buttons. If the screenshot has not been attached, wait for it before trying to copy its exact appearance.

## Source and Sprint 1 boundary

The Sprint 1 Product Backlog in [Docs.html](Docs.html) contains only these stories:

| Story | Sprint 1 work | Roles |
|---|---|---|
| 01 | Log in and restrict access by role and laboratory | All six roles |
| 02 | Create and manage Faculty and Class Representative accounts | Head Laboratory |
| 03 | Choose Physics or Circuits Laboratory; view schedule and availability | Class Representative, Faculty |
| 10 | Manage the equipment catalogue | Head Laboratory, Physics Staff, Circuits Staff |

The live dashboard metrics in story 16, reservation submission and approvals, borrowing and returns, clearance, forecasting, chatbot, and end-term reporting belong to later sprints. The Head Lab Dashboard is a **style reference**, not a request to depict those later features as completed Sprint 1 work.

## Paste this shared instruction before each page prompt

> Generate **one high-resolution desktop UI image** for the page described below. Use the attached Figma Head Lab Dashboard screenshot as the visual reference. Match its sidebar, top bar, colors, typography, spacing, card and table styling, buttons, and icon style. Adapt visible navigation to the correct role. Make all text legible and aligned; use realistic, clearly **sample** values where records are needed. Show the primary page state only. Do not produce code, HTML, a wireframe, a collage of several screens, a mobile screen, or explanatory text outside the image. Do not claim that sample data is live or connected to a database. Preserve the system's documented roles, laboratories, labels, and workflows.

Recommended output: one full-page desktop mockup at approximately **1440 × 900 px or larger**, with enough height to show the complete page without tiny text. To generate a mobile counterpart, reuse the same prompt but replace “desktop UI image” with “mobile UI image at approximately 390 × 844 px” and attach the approved desktop image as an additional reference. Generate empty/error/modal variants as separate images, not cramped panels within the primary page.

## Suggested generation order

Generate and review one image at a time: login → role landing shell → account list → Faculty form → Class Representative form → laboratory selector → schedule and availability → inventory list → inventory item form. Paste the shared instruction plus **one** prompt below, and attach the same approved Head Lab Dashboard frame each time.

## Copy-ready page prompts

### 1. Login — Story 01

> Create the Log In screen in the attached Figma style. Show NU Fairview / Laboratory Services identity, a login identifier field, a password field, and a clear Log In button. The identifier hint should say “NU Student ID for Class Representatives; NU Fairview email for other roles.” Do not include a Sign Up or self-registration link. Keep this as a clean default-state image; validation and inactive-account messages can be separate image variants. Do not show real credentials or imply that login is already functional.

### 2. Role landing shell — Story 01

> Create one signed-in Head Laboratory landing-page image based on the attached Dashboard frame. Show the existing sidebar and header style, Head Laboratory identity, a clear page title, and links to the Sprint 1 pages: Account Management, Laboratory Schedule view, and Inventory Management. If the reference contains dashboard cards, retain their visual treatment but label any values “Sample” and avoid inventing live totals. Do not add a new visual system or depict later-sprint transactions as completed. Generate other role variants separately if needed; Physics/Circuits Staff must show only their own laboratory context.

### 3. Account Management list — Story 02

> Generate the Head Laboratory Account Management page. Reuse the attached Dashboard sidebar, header, and table styling. Show a page title, Create Account button, search, role/status filters, and a readable table of **sample** Faculty and Class Representative accounts with login identifier, role, section or class context where applicable, active/inactive status, and View/Edit actions. Do not show Dean or Staff account creation, self-registration, Delete, Change Role, or Reset Password actions. Show one coherent page state, not several variants in one image.

### 4. Create/Edit Faculty account — Story 02

> Generate a **Create Faculty Account** page or modal opened from Head Laboratory Account Management. Use the same Figma form styling. Show fields for verified Faculty name, NU Fairview email, a fixed Faculty role label, and active/inactive status, with Save and Cancel actions. Include a brief helper note that Faculty accounts are created before linked Class Representative accounts. Do not show a plain-text password, self-registration, Dean/Staff creation, or unsupported fields. An Edit Faculty Account image, validation-error image, or success image can be generated separately.

### 5. Create/Edit Class Representative account — Story 02

> Generate a **Create Class Representative Account** page or modal in the same Figma style. Show Faculty-verified full name, NU Student ID, section, an existing Faculty selection for credential hand-off, existing subject/class assignments, fixed Class Representative role, status, Save and Cancel. Add short helper text: one active representative account per section; credentials are passed to the designated Faculty for handover. Keep the Faculty assigned to each class visible where useful; the credential recipient is not automatically every class's reviewer. Do not show online nomination, self-registration, or a prefilled password. Create an Edit or validation-error variant as a separate image.

### 6. Choose Laboratory — Story 03

> Generate a laboratory-selection page for a signed-in Class Representative or Faculty member. Match the attached Dashboard style while showing only role-appropriate navigation. Present two clearly labeled choices: Physics Laboratory and Circuits Laboratory. Show the selected choice and a View Schedule & Availability action. Do not mix both laboratories' records in a selected-lab preview. Do not show a submitted reservation, held slot, or confirmed equipment. Create an inactive-laboratory variant separately if needed.

### 7. Schedule and Availability — Story 03

> Generate a **read-only** Schedule & Availability page for the selected Physics or Circuits Laboratory. Show the selected lab and term, a readable date/time schedule, assigned versus vacant blocks, and a small relevant equipment-availability panel with **sample** values. Visually distinguish occupied blocks and active holds from vacant blocks; no occupied block may appear selectable as vacant. Do not show a successful booking or claim that viewing availability reserves anything. If a reservation control is visible, mark it disabled or “Coming in a later Sprint.” Create the no-schedule state as a separate image.

### 8. Inventory catalogue — Story 10

> Generate the Head Laboratory Inventory Management page in the attached Dashboard design. Show Physics/Circuits selector, search, category filter, Add Item button, and a readable **sample-data** table with item name, category, equipment/consumable type, unit, condition, reorder level, and stock/availability display. Include a restrained Low Stock badge where appropriate. Head Laboratory can switch laboratories; a separate Physics Staff or Circuits Staff variant must show only its assigned laboratory. Do not include a working forecast panel, borrowing transaction, or made-up live data claim. Generate empty and loading states separately.

### 9. Add/Edit/Remove inventory item — Story 10

> Generate an **Add Inventory Item** form in the same Figma style. Show item name, laboratory, category, equipment/consumable type, unit, condition status, reorder level, and an initial quantity entry where applicable, plus Save and Cancel. Keep labels readable and group fields logically. Do not show a reusable item being “consumed,” and do not depict borrowing or return processing. Generate Edit Item and Remove Item confirmation as **separate images**. In the removal confirmation variant, make the warning clear that an item with outstanding issued quantities or linked history cannot be removed casually.

## Data consistency for text shown in the images

Use the logical ERD in [ERD-TABLES.md](ERD-TABLES.md) and its cardinalities in [ERD-RELATIONSHIPS.md](ERD-RELATIONSHIPS.md) to choose believable field labels and connected sample records. **An image cannot connect to the database.** These references help avoid contradictory UI data; they are not evidence that physical tables or APIs already exist.

| Screen or concern | Existing logical data | Important rule |
|---|---|---|
| Login and role access | `USER_ACCOUNT.account_id`, `login_identifier`, `password_hash`, `role`, `status`, `staff_lab_id`, `student_id` | Show login identifier and role where relevant; never show `password_hash` or actual credentials in a mockup. |
| Faculty and Class Representative accounts | `USER_ACCOUNT`, `STUDENT`, `CLASS_GROUP`, `TERM` | `STUDENT.student_number` identifies a Class Representative; `CLASS_GROUP.faculty_id` is the reviewer for that class, not automatically the credential hand-off recipient. |
| Laboratory selection | `LABORATORY.lab_id`, `room_name`, `lab_type`, `active` | Show the selected laboratory consistently across related mockups. |
| Read-only schedule | `TERM`, `SCHEDULE_BLOCK`, `CLASS_GROUP`; later reservation holds from `RESERVATION` and `REQUEST_REVISION` | Depict schedule and availability, not a completed reservation. |
| Inventory catalogue | `ITEM_CATEGORY`, `ITEM`, `STOCK_MOVEMENT` | If showing stock values, label them as sample values and make totals internally consistent. |

**Design note:** The inventory use case mentions item description, optional photograph, and existing/available/in-use/reserved quantities. The current logical `ITEM` table does not contain description or photograph fields, and quantities are not direct `ITEM` columns. If these appear in an image, treat them as proposed UI placeholders—not proof of persisted fields. The Faculty credential hand-off is documented, but a mockup must not claim that email delivery has already succeeded.

## Review checklist for every generated page

- Does it visibly match the attached Head Lab Dashboard frame while changing only the role-appropriate content?
- Is it one of stories 01, 02, 03, or 10, rather than a later-sprint feature presented as complete?
- Are Head Laboratory, Physics Staff, Circuits Staff, Faculty, and Class Representative permissions correct?
- Are any displayed records clearly sample values, with no claim of live database connection?
- Is this one high-resolution, legible image rather than a collage or code output?
- Are empty, error, and restricted-access states generated as separate images when needed?
- Do labels, forms, and actions preserve the workflows and acceptance criteria in `Docs.html`?
