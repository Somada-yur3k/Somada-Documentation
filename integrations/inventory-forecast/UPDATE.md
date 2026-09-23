# Inventory Forecasting — agreed scope and update record

## Scope

### Approved Sequence follow-up

The earlier Sequence freeze below is historical and is now superseded. The five major-process sequences have been reviewed against the current activities. Sequence 4 covers p4.6–p4.8 forecasting (Head Lab only, actual usage evidence, sufficient-history estimates and insufficient-history stock alerts, read-only recommendations). Sequence 3 uses the revised laboratory/equipment-information scope and D4/D8/D9. Sequence 5 includes a no-completed-records alternative. The current final Faculty-or-Dean approval route remains unchanged in Sequence 2. See `SEQUENCE-UPDATE.md` for outputs and verification.

Head Lab → Inventory Management → Inventory Forecast → select Circuits / Physics → Generate Next-Month Forecast. This is an update to the proposed system documentation, editable diagrams and UI-generation specification. It does not claim that a production forecasting service or trained model has been deployed.

Existing stock and actual issue/return history supply the inputs. Cancelled/rejected reservations and requested-only quantities are not consumption. Consumables use actual recorded consumption. Reusable equipment uses concurrent borrowing demand and serviceable stock, not the sum of monthly borrowings. Missing/incomplete timing or consumption history means **Insufficient history**, not zero demand. Head Lab reviews the results; no automatic purchase, inventory write or reservation action occurs.

Results: item, laboratory, usable stock, next-month period, demand estimate, consumable restock recommendation or possible equipment shortage, explanation, history coverage and generation time. Current low-stock threshold alerts remain separate. Refresh regenerates dynamic results; no Forecast table is added. A usage-based baseline must be labelled honestly and evaluated against subsequent actual use before making AI-model or accuracy claims.

## Added / updated

- **Documentation:** overview explains both Q&A and Inventory Forecasting; Table 16 adds the optional Head-only forecast, read-only outcome and insufficient-history exception; the event table adds Head's forecast request; backlog 10F and Gap 14 cover the feature. Project title is unchanged.
- **Use Case:** Head Lab is associated with Generate Inventory Forecast. It extends Manage Equipment Inventory only when Head requests it. The base inventory workflow can finish without forecasting; no AI actor is added. Main use-case table numbering is preserved.
- **DFD Level 0:** Forecast Request and Inventory Forecast cross the existing Head Lab / system boundary.
- **DFD Level 1:** the same exchanges belong to Process 4; D2 Historical Request Data supports existing item links. Five parents and ten stores remain.
- **DFD Level 2:** 4.6 Retrieve Forecast Inputs; 4.7 Estimate Next-Month Needs; 4.8 Present Inventory Forecast. D4/D5 reads and D2 history are balanced to Level 1. Data sufficiency accompanies the history; insufficient evidence produces an unavailable assessment. No forecast-to-store write exists. Process 4's publication canvas is taller to keep eight children and independent noun-labelled arrows readable.
- **ERD:** existing ITEM, REQUEST_ITEM, BORROWING, BORROWING_ITEM and RETURN_ENTRY links suffice. Data dictionary / design notes explain read-only derivation. 25 entities and 51 foreign keys remain; no artificial Forecast table.
- **Activity:** Process 4 adds Head-only history retrieval, sufficiency check, next-month estimation, display and Head review. Other business processes are unchanged.
- **Final-node review:** P1 invalid-login/account branches have separate Flow Finals; P2/P4/P5 validation-error and no-operation branches use circle-X Flow Finals. Successful exclusive operation invocations retain Activity Finals because each completes that invocation, not just an intermediate step. P3 answer and refusal each terminate the entire inquiry and retain Activity Finals. P5's report/no-record outcome occurs after its fork/join and ends the report invocation. Forecast unavailable likewise completes that read-only request. No final occurs between forked reads and their synchronization join. Multiple whole-activity alternatives are intentional, not parallel-operation terminations.
- **Swimlane:** the Head Lab partition includes optional inventory-forecast review. Existing six lanes, including Dean, remain. Detailed calculations stay in Process 4's activity and DFD.
- **Publication/editor:** refreshed diagram images, maintained figure references, circle-X rendering in the Activity Editor, updated local template setup and audit/workspace snapshots. No cloud write is performed.

## Not changed

- Sequence diagram sources and standalone sequence exports are frozen at their pre-forecast state. Their three new forecasting child processes are explicitly deferred in coverage checks, not falsely counted as covered.
- AI chatbot behavior, system title, actor inventory, purchasing and unrelated business rules.

## Remaining implementation / review items

- Production forecast method, minimum reliable history, model evaluation and measured error remain implementation tasks. No live AI model, real-data training or accuracy result is asserted.
- Existing shared Activity Editor database templates need an admin-reviewed migration before new-base edits can be saved there. Generated setup/migration files do not change Supabase by themselves. Export customized drafts first; never silently overwrite member edits.
- `public-template-migration.sql` is the optional migration for the committed previous template version. It aborts atomically if a template differs or a draft is customized; history is retained. New installations use `integrations/activity-editor/public-setup.sql`. Neither file has been executed against the live database.
- There is pre-existing approval-policy drift: the revised Activity 2 / Swimlane use a final available-Faculty decision, while some older documentation/ERD notes still describe Faculty-then-Dean escalation. This forecasting update does not silently revise those unrelated policies or the frozen sequences.

## Review locations

- `Docs.html`: Project Overview, Table 1 backlog, event table, Table 16 inventory use case, Gap 14, DFD / ERD descriptions, Activities and Swimlane figures.
- `System-Diagrams.html`: Activity 4 and overall Swimlane; all five Activity diagrams for final-node review.
- `UI-IMAGE-GENERATION-ROADMAP.md`: Head Lab Inventory Forecast screen after Batch H3, retaining five-screen batches.
- `assets/erd/DESIGN.md`: forecast data lineage and limits.

## Checks

Run the DFD boundary/geometry checks, Use Case alignment/render audit, Activity/Swimlane checks, editor/export regression, ERD check, docs pagination/sync collector checks and audit freshness. Use `check.cjs --render --activities-only` to avoid rewriting frozen Sequence exports.

Verified locally: Use Case geometry/interaction, DFD Level 0 balance, Level 1 geometry/interaction, all five Level 2 diagrams, all five activities and overall Swimlane, 25-table/51-relationship ERD, Activity Editor including Flow Final display/export, forecast read-only boundary contract, account/report regressions, 66-page documentation pagination, Figures 10–15 image capture, Google Docs sync/lifecycle contract (11 pt retained), navigation, and audit freshness. Sequence-file hashes matched the pre-forecast baseline. No commit, push, live Google Docs synchronization or Supabase migration was performed.
