# Use-case publication and relationship decisions

The layout preserves the feature inventory; the subsequent user-approved role correction makes log management Head Laboratory only. Preserve the six actors, 20 base goals, ten supporting goals, 42 actor associations and eleven dependencies in the existing source. No DFD notation replaces UML: associations have no arrowheads, and dashed dependencies use open arrowheads.

User overrides the guide's blue fills and generous whitespace: use white shapes with black outlines, tighter outer margins, larger text, and the existing three-column composition.

The latest user-requested compression uses a 1600 × 1660 canvas and 3200 × 3320 PNG. Column centers are 450, 800 and 1150 rather than 370, 800 and 1230. Main ellipses are 250 × 110 instead of 270 × 120, and supporting ellipses are 230 × 110 instead of 250 × 120. Main/supporting labels decrease slightly from 24 to 22 units; actor labels remain 26. This increases each actor-to-main-column corridor from 102 to 192 units. Faculty moves to the middle left and Dean to the bottom left to shorten the approval-only associations.

All eleven include/extend dependencies are now single straight segments, not elbow-routed paths. Their 20-unit labels follow the segment angle, with audited offsets to avoid other lines and ellipses. Dashed lines, open arrowheads and semantic directions are preserved. The publication tradeoff is approximately 6.8 pt use-case text at 174 mm A4 width, as requested for the smaller shapes; inspect a physical print before submission.

Short print wording such as “Class Rep.” and “Submit Request: On-Schedule Non-Lab or Out-of-Schedule” retains the full goal in the SVG title and the full specifications in Docs.html. The latter remains the existing combined submission goal, not a new request type.

Run `node integrations/google-docs/check-usecase.cjs --render` to check node text, unrelated-node/label collisions, preserved counts, UML marker types, and editor behavior; regenerate the PNG. Run `check-pages.cjs` for the actual A4 page. Sync only **Use Case Diagrams** to replace this figure in Google Docs; local checks never send an update.

## Dependency evidence before drawing

| Base | Support | Type | Can base finish without support? / condition | Direction | Document evidence |
| --- | --- | --- | --- | --- | --- |
| Manage Equipment Inventory | Add Equipment | include | Required subprocess in documented management decomposition | Base → support | Table 16, maintain holdings / validation / save |
| Manage Equipment Inventory | Update Equipment | include | Required subprocess in documented management decomposition | Base → support | Table 16, maintain holdings / validation / save |
| Manage Equipment Inventory | Remove Equipment | include | Required subprocess in documented management decomposition | Base → support | Table 16, remove holding, outstanding-issued exception |
| Manage Equipment Inventory | Search & Filter Inventory | include | Required subprocess in documented management decomposition | Base → support | Table 16, search or filter catalogue |
| Submit Scheduled Laboratory Activity | Select Resources / Equipment | include | No; resource selection is part of the submission form | Base → support | Table 7, actor step 1 |
| Submit On-Schedule Non-Laboratory / Out-of-Schedule Request | Select Resources / Equipment | include | No; same required selection step | Base → support | Table 7, actor step 1 |
| Process Return | Record Broken / Lost / Consumed Items | extend | Yes; only on a broken, lost or consumed outcome | Support → base | Table 18, reconcile balances and classify outcomes |
| Ask Laboratory Question | Check Item Availability | extend | Yes; detected item-availability question | Support → base | Table 14, interpret question and retrieve relevant authorized records |
| Ask Laboratory Question | Check Schedule Availability | extend | Yes; detected schedule question | Support → base | Table 14, interpret question and retrieve relevant authorized records |
| Ask Laboratory Question | Check Reservation Status | extend | Yes; detected own-reservation question | Support → base | Table 14, requester-scoped status retrieval |
| Ask Laboratory Question | Check Operating Hours | extend | Yes; detected operating-hours question | Support → base | Table 14, authorized knowledge base retrieval |

The existing inventory decomposition is retained, not reclassified in a formatting task. Dean remains approval-only; clearance viewing remains Class Representative only, and processing remains Head Laboratory only. Manage Logs, Schedule & Daily Tasks is associated only with Head Laboratory. Both staff associations were removed by explicit user request; staff retain inventory, issuance/return and disposal, but no longer manage usage logs, schedules or daily tasks.
