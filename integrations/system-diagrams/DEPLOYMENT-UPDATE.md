# Deployment Diagram update

## Changes made

- Revised to A4 portrait: five separate monochrome 3D client containers (Class Representative, Faculty, Dean, Circuit/Physics Staff, Head Lab), one application server and one database server.
- Each client contains a browser environment, web-interface artifact and device icon, with its own HTTPS communication path. All roles may use desktop, laptop, tablet or smartphone; icons are illustrative, not access restrictions.
- Each of D1–D10 has its own labelled box inside the PostgreSQL container. These remain logical stores, not separate database servers.
- Uses the provisional title **Physics and Circuits Laboratory Management System**, not SOMADA.
- Grouped Desktop, Laptop, Tablet and Smartphone access under one Web Browser environment. All six roles access the same role-scoped application.
- Replaced unselected runtime / DBMS labels with the proposed Next.js, React, TypeScript, Node.js and PostgreSQL stack. This is a proposal, not a claim that the production system has been implemented or deployed.
- Removed the Email Infrastructure node and its communication path.
- Added backend AI Chatbot and Inventory Forecasting modules. Forecasts remain recommendations only; no automatic stock mutation or purchasing and no invented external AI provider.
- Uses two UML communication paths: client–application HTTPS and application–database TLS. No direct client–database link.
- Database lists all ten actual canonical DFD stores, loaded from the Level 1 model at render time. They are logical stores within one relational database, not ten physical servers.
- Retains existing application functions without adding or changing reservation, approval, clearance or account rules.

## Sources and limits

The current DFD store model, process models, Activity/Swimlane workflows and 25-entity ERD support the grouped application modules. The user-supplied requirements establish the newly proposed stack.

Older `assets/erd/DESIGN.md` prose still contains historical Faculty-then-Dean routing and chatbot schedule/reservation scope; these disagree with the current approved activities and sequences. This deployment-only change does not restore those rules or silently rewrite unrelated workflow descriptions. Its earlier statement that no database product is selected is superseded by this proposed PostgreSQL deployment, not by a physical schema migration.

## Outputs

- `System-Diagrams.html#deployment`: current diagram.
- `assets/system-diagrams/deployment.png`, `.svg`, `.pdf`: standalone outputs.
- `assets/system-diagrams/diagrams.pdf`: complete diagram collection.

No database changes, hosting deployment, commit or push are included.
