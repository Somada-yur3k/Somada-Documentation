---
name: dfd-arrow-integrity
description: Create, review, or repair DFD Level 0, Level 1, and Level 2 diagrams with uniform peer-node dimensions, unique external entities and data stores, independent noun-labelled arrows, and optional hover-and-drag SVG editing. Use when generating a DFD or when shapes, connectors, labels, entity or data-store duplication, interaction, or balancing need correction.
---

# DFD Arrow Integrity

Produce a panel-readable DFD in which every flow can be followed from exactly one source to exactly one destination without ambiguity.

## Uniform node geometry

- Declare one `width x height` pair for external entities before laying out a diagram. Every external entity in that diagram must use that exact width and height.
- Declare one `width x height` pair for peer processes. When a Level 1 or Level 2 diagram contains multiple processes, every peer process box must use the same width and height. A Level 0 context diagram with one system process may size that single process for the canvas.
- Declare one outer `width x height` pair and one identifier-compartment width for data stores. Every data-store symbol in the diagram must use those dimensions.
- Entity, process, and data-store dimensions may differ from one another. They may also change between diagrams when the canvas or content requires it; uniformity is mandatory within each peer group in one diagram.
- Never enlarge or shrink only one node because its label is longer. Wrap the label, use a shorter equivalent name, or increase the size of every node in that peer group.
- Keep internal padding, header height, corner radius, stroke width, and text alignment consistent for every node in the same peer group.

## Unique external-entity rule

- Inventory external entities before drawing as `entity key | canonical actor name | system-boundary role`.
- Draw exactly one symbol for each logical external entity in the complete diagram. Never repeat, clone, alias, or mark an entity with `*` merely to shorten routes.
- Treat role names as duplicates after normalizing case, punctuation, spacing, and qualifiers such as `repeated`, `copy`, or `same actor`. For example, `Faculty`, `* Faculty`, and `Faculty (copy)` are one entity and must resolve to one symbol.
- Connect every process interaction for an actor to that actor's single canonical symbol using independent ports and routes.
- When one actor participates in distant processes, first reorganize the process bands, enlarge the canvas, or move the actor to a shared routing position. If the graph remains too dense, consolidate defensible top-level processes and defer internal detail to Level 2.
- A multi-panel Level 1 diagram still has one entity inventory: do not redraw the same actor in another panel. Use a single shared entity column or reconsider the decomposition.

## Unique data-store rule

- Inventory stores before drawing as `store key | canonical noun name | persistent meaning`.
- Draw exactly one symbol for each logical data store in a diagram. Multiple processes must connect to the same store symbol; never repeat, clone, or alias a data store to shorten routes.
- Never create two stores with different labels for the same persistent records. Normalize names mentally by case, punctuation, spacing, and singular/plural form when checking for aliases.
- Create separate stores only when the system truly persists distinct records with different identities or lifecycles, such as `Reservation Records`, `Borrowing Slip Records`, and `Clearance Records`.
- Treat a generated slip, dashboard, or report as a data-flow output unless the requirements explicitly say the system stores it. When it is persisted, represent its record once as a store and its displayed or exported form separately as an output flow.
- Neither external entities nor data stores are eligible for repetition.

## Non-negotiable arrow rules

- Draw every data flow as its own connector with one source, one destination, and one arrowhead.
- Never share a horizontal segment, vertical segment, bend, route lane, source port, destination port, or arrowhead between two flows.
- Never merge connectors into a trunk, bus, branch, fork, or combined arrow. Repeat the complete connector even when flows use the same noun label.
- Do not let connectors cross, touch, or appear to continue into one another. White gaps, bridges, halos, and different colors do not make a crossing acceptable.
- Give every connector a visibly separated source port and destination port. Use at least 16 screen pixels of separation when practical.
- Treat every process side as an invisible routing grid. Divide that side into one non-overlapping band for each connected external entity or data store, then allocate one row and one port per flow inside its owner's band.
- Keep every flow owned by an entity or store inside that owner's side band for its complete final approach to the process. A flow must never borrow, enter, or visually merge with another node's band.
- Order side bands to match the visual order of their connected nodes whenever practical. If two entities connect on the left side, the upper entity owns the upper band and the lower entity owns the lower band; apply the equivalent ordering on every side.
- Within one band, preserve a consistent row order from the source node to the process ports. Give each row its own route lane, label bay, and arrowhead, even when five or more arrows connect the same entity to the same process.
- Keep routing-grid guides invisible in the submitted diagram. An editor may expose the band rectangles, owner names, rows, and ports through an explicit debug toggle or query parameter, but export and print output must hide them.
- Terminate every connector exactly on the visible boundary of its source and destination node. An arrowhead in nearby whitespace is disconnected even when it points toward the correct node.
- Validate endpoint coordinates numerically: a left/right port must use the node's exact left/right X-coordinate with Y inside the node height; a top/bottom port must use the exact top/bottom Y-coordinate with X inside the node width. Include the visible stroke width when checking for gaps.
- Treat collinear parallel segments as an overlap whenever their coordinate ranges intersect. Separate SVG paths are still visually merged if their horizontal or vertical approach segments occupy the same line.
- When two or more flows enter the same side of a process, assign each flow a different approach tier as well as a different destination port. Use at least 24 screen pixels between parallel approach tiers and at least 40 screen pixels between destination ports when practical.
- For multiple flows entering the top edge, keep the nearest or local process flow direct or on the lowest tier. Route the longer-distance flow on a visibly higher horizontal tier, then drop vertically into its own top port. Apply the equivalent left/right ordering to side-entry flows.
- Use the shortest conflict-free orthogonal route with the fewest bends. Start with a direct connector and add a bend only when a real node, label, port, or connector conflict requires it.
- Connect vertically aligned adjacent processes with a short direct vertical arrow when its corridor is clear. Connect horizontally aligned adjacent nodes with a short direct horizontal arrow under the same condition.
- Keep a connector inside the rectangular corridor bounded by its source and destination whenever possible. Do not send a local flow past the process edge, into the datastore corridor, or around unrelated nodes and then return.
- After resolving overlaps, trim every segment to the nearest necessary bend. If a shorter route remains separate and readable, the longer route is invalid.
- Put one visible label on every arrow and anchor it to one clear segment of that same arrow. Never leave a label floating between nearby connectors where its owner is ambiguous.
- Prefer the longest isolated segment that can fit the complete label with padding. Center the label on that segment while keeping at least 12 screen pixels from bends and 20 screen pixels from arrowheads or node edges.
- Match the label orientation to its host segment: horizontal text on a horizontal segment and rotated vertical text on a vertical segment. Keep the reading direction consistent throughout the diagram.
- Render every on-line label as a compact white rounded pill with a subtle light-gray border and optional soft shadow. Use dark neutral text so the noun stays readable independently of the connector color.
- Size each pill from its actual text width. Keep left and right padding extremely tight: approximately 1-2 screen pixels per side, with 2-3 screen pixels vertically. Do not impose a large minimum width on short labels.
- Center the pill directly on its own host segment so it cleanly interrupts only that connector. A horizontal segment gets an unrotated pill; a vertical segment gets a 90-degree rotated pill with one consistent reading direction across the diagram.
- The pill must never hide another flow, arrowhead, bend, or node boundary. If the label cannot fit between the endpoints while keeping the required clearances, first increase the node-to-node gap or select another isolated segment; do not stretch the arrow past its destination or merge it with another route.
- Keep labels away from shapes, other labels, bends, crossings, and unrelated connectors. When no segment has enough clear length, create a short dedicated label bay without merging or crossing flows.
- Write flow labels as nouns or noun phrases, such as `Credentials`, `Reservation Record`, or `Laboratory Update`. Avoid imperative action labels such as `Submit Reservation` or `Approve Request`; a word such as `Update` is acceptable when it names exchanged data inside a noun phrase.
- Write process names as verb phrases. Write entity names, datastore names, and data-flow labels as nouns.
- Preserve DFD balancing. Do not remove a required flow merely to make the layout cleaner.

## Interactive SVG behavior

- Treat interaction as an aid to tracing and adjustment, never as a substitute for a clean static diagram. The default layout must remain panel-readable when printed, exported, or opened with scripts disabled.
- Assign one stable flow identifier to the visible connector, its optional white halo, its enlarged transparent hit target, and its label. Hovering any of them must highlight exactly that complete flow and label while temporarily dimming unrelated flows.
- Give thin connectors a transparent pointer target of roughly 12-16 screen pixels without changing their visible stroke. The hit target must follow the full current route after every edit.
- Make each label draggable independently of its connector. Preserve its original rotation, keep the label linked to the same flow identifier, store user offsets locally when appropriate, and provide a one-action reset to the authored position.
- Make orthogonal routes editable through handles on internal horizontal or vertical segments. Dragging a handle moves that complete segment and its two adjacent bends; it must not move either endpoint away from the source or destination boundary.
- Do not implement arrow movement by translating the whole connector, because that disconnects its endpoints. For a straight connector, a center handle may insert a reversible orthogonal dogleg while preserving both endpoints; otherwise keep it label-draggable only.
- Keep route editing reversible. A reset action must restore every authored path and label transform and clear saved user overrides.
- Exclude editing controls from print or static export output. Export the authored default rather than a browser user's saved adjustments unless the user explicitly requests exporting their edited layout.

## Plan before drawing

1. Inventory every flow as `flow key | source | noun label | destination`.
2. Inventory every logical store and assign one canonical key and noun name.
3. Declare the entity, peer-process, and data-store size constants for the diagram.
4. Compare the inventories with the parent DFD and related use cases.
5. Test the shortest direct orthogonal route first; record the actual obstacle before introducing a detour.
6. For each process side, list the connected entities and stores in visual order and divide the side into non-overlapping owner bands.
7. Inside each owner band, assign a unique row, source port, destination port, and route lane to every flow.
8. Assign distinct approach tiers to every fan-in or fan-out group; do not place overlapping horizontal intervals on the same Y-coordinate or overlapping vertical intervals on the same X-coordinate.
9. Select a host segment and orientation for every label, then reserve its padded clearance area before drawing paths.
10. Draw only after all flows have independent routes and every store reference resolves to the single canonical symbol.

## Resolve conflicts in this order

1. Reposition nodes while keeping the intended column structure.
2. Assign unused ports and route lanes.
3. Increase spacing or canvas size.
4. Preserve the approved process inventory and decomposition. Consolidate top-level processes only when the user or accepted system model explicitly authorizes that semantic change; never reduce the process count solely to solve routing density.
5. Split a crowded diagram into clearly titled panels while preserving one shared, non-duplicated external-entity inventory, the process numbering, and the flow inventory.

Never solve a conflict by merging arrows, deleting a required flow, hiding a label, or relying on a crossing gap.
Never solve a conflict by resizing only one peer node or by duplicating an external entity or data store.

## Same-noun example

If Physics Laboratory Staff and Circuits Laboratory Staff both send `Laboratory Update` to Process 5.0, draw two complete connectors, two unique source ports, two unique destination ports, two separate route lanes, two arrowheads, and two `Laboratory Update` labels.

## Required visual audit

1. Render the full diagram.
2. Inspect crowded regions at high zoom.
3. Trace every arrow from its source to its arrowhead.
4. Confirm that no pair of connector segments intersects, overlaps, touches, or shares a port.
5. Verify every source and destination coordinate against the target node boundary and inspect the rendered contact point at high zoom; reject any arrowhead that stops in whitespace.
6. For each process edge receiving multiple arrows, compare the complete approach segments - not only the arrowheads - and confirm that their tiers and coordinate ranges do not visually merge.
7. Expose the routing grid during audit and verify that every connected entity or store owns one non-overlapping side band and that every arrow remains in its owner's band during the final approach.
8. Inspect every detour. Remove each bend in turn; if the shorter route remains clear, keep the shorter route and reject the detour.
9. Confirm that local flows do not leave the source-destination corridor or cross into an unrelated diagram column.
10. Confirm that every arrow has a visible noun label anchored to its own segment, with the same orientation as that segment and no ambiguous floating placement.
11. Confirm that every label is a text-sized white rounded pill with tight padding, correct horizontal/vertical orientation, and a center point lying on its own connector segment. Verify that it covers only that connector—not a neighboring flow, arrowhead, bend, or node border.
12. Compare the rendered arrows against the flow inventory and the parent DFD.
13. Verify that the set of entity dimensions contains exactly one `width x height` pair, the set of peer-process dimensions contains exactly one pair, and the set of data-store dimensions contains exactly one pair.
14. Verify that all external-entity keys and normalized canonical actor names are unique. Reject every repeated `*`, `copy`, or duplicate actor symbol.
15. Verify that all data-store keys and normalized canonical names are unique.
16. For an interactive SVG, test hover linkage, label dragging, route-handle dragging, persistence, reset, and export mode. Confirm that route edits keep both endpoints fixed on their node boundaries.
17. Do not report completion until every check passes.

When handing off the result, confirm that every logical external entity and data store appears exactly once, mention any panel split used for clarity, and keep the diagram source editable.
