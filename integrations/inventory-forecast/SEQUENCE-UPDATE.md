# Sequence alignment update

## Updated / added

- Sequence 4 — Equipment and Borrowing: Head Lab requests forecasting; the system reads scoped stock and actual usage evidence, checks history sufficiency, estimates next-month needs when supported, and returns recommendations. Insufficient history returns known stock / threshold alerts, not fabricated predictions.
- Forecasting distinguishes actual consumable consumption from concurrent reusable-equipment demand. It creates no stock adjustment, purchase or forecast table. History period and generation date remain required in the output.
- Sequence 3 — Laboratory Questions: approved Circuits/Physics laboratory information, equipment information / current availability and hours. Reads D4/D8; saves exchanges to D9. Reservation and schedule lookups are excluded.
- Sequence 5 — Administration and Reporting: completed-records and no-records alternatives; usage summaries and optional export.
- Coverage checks now require all 24 child processes, including p4.6–p4.8. Page rendering fails promptly with the underlying error rather than an unexplained timeout.
- A compact spacing fallback preserves the minimum readable text size for dense A4 sequence pages. Shared evidence is read once before selecting an equipment operation.

## Already correct / retained

- Five major-process diagrams, not 25 individual scenarios.
- Sequence 1: Head Lab creates and manages Faculty / Class Representative accounts; Faculty hands credentials to the Class Representative; Dean is pre-assigned.
- Sequence 2: Class Rep on-schedule → Faculty; out-of-schedule → available Faculty or direct Dean if Faculty unavailable. The selected reviewer is final. Faculty on-schedule needs no academic approval; out-of-schedule → Dean.
- Head Lab owns student clearance; Class Representative views class student status.

## Outputs

- `assets/system-diagrams/sequence-p1` through `sequence-p5`: SVG, PNG and single-page A4 PDF.
- `assets/system-diagrams/sequences.pdf`: five-page sequence collection.
- `System-Diagrams.html`: live diagrams and downloads.

## Verification

- Model and geometry checks: five sequences, 20 main use cases, 24 child processes; matched calls/replies, activation scopes and read-only forecast branch.
- Full render: five activities, overall Swimlane, five sequences and deployment; 12 A4 pages total. No geometry issues reported.
- No live database write, Google Docs synchronization, commit or push performed by this follow-up.
