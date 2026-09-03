---
name: dfd-level2-decomposition-layout
description: Create, revise, or audit SOMADA DFD Level 2 decompositions using one readable vertical child-process layout per Level 1 parent process. Use for the five SOMADA Level 2 diagrams; apply dfd-arrow-integrity for connector rules.
---

# SOMADA DFD Level 2 Decomposition Layout

Create five separate Level 2 diagrams—one decomposition for each approved SOMADA Level 1 process. These are detailed child diagrams, not a replacement for the five-process Level 1 diagram.

Before authoring any Level 2 diagram, read `../dfd-arrow-integrity/SKILL.md` and apply its connector, unique-node, label, interactive-editor, and audit rules. This skill adds the project-specific Level 2 structure and the entity-port ordering shown in the approved reference layout.

## Parent inventory

Use the **Compact Detail** Level 1 view as the balancing authority because it retains individual boundary flows. The Traceable Flow View is a presentation aid only; its grouped labels must not be used to derive strict Level 2 inputs or outputs.

Create one diagram for each parent below:

| Diagram | Parent process |
| --- | --- |
| 1.0 | Manage User Access & Accounts |
| 2.0 | Manage Reservations, Availability & Approvals |
| 3.0 | Answer Laboratory Questions |
| 4.0 | Manage Equipment & Borrowing |
| 5.0 | Manage Laboratory Administration & Reporting |

Each child diagram receives a title in the form `Process X.0 — [Parent Process Name]` and has a clearly visible system/decomposition boundary.

## Required canvas structure

Use the same readable structure for every parent diagram unless a real flow conflict requires a different arrangement:

1. Place the title above the boundary.
2. Place every relevant external entity in one left column, ordered from top to bottom by the subprocesses they most closely serve.
3. Stack equal-sized subprocesses vertically in the centre, numbered `X.1`, `X.2`, and so on. Name every subprocess with a concise verb phrase.
4. Place every relevant persistent data store in one right column. Use the normal store symbol and one canonical store symbol per logical store in that child diagram.
5. Connect the central subprocess sequence with short, downward, independent arrows whenever the child workflow is sequential.
6. Route entity-to-subprocess and subprocess-to-store flows through the side corridors. Reserve enough horizontal space for labels; increase the canvas before allowing congestion.

An entity or data store may appear once in each separate Level 2 diagram when that parent process genuinely exchanges data with it. It must never be duplicated within one child diagram.

## Compact PNG presentation standard

For SOMADA Level 2 diagrams that will appear inside `Docs.html`, use an editable fixed SVG canvas and export a PNG from that canvas. The current compact publication target is **1200 × 950 pixels**; do not use a fluid container that grows with the browser window.

- Keep child processes in a compact vertical stack. Use the smallest clear vertical gap between adjacent process boxes; do not add empty height merely to fill the canvas.
- Place external entities and data stores as close as possible to the child processes they serve before adding route bends. Reorder a column or adjust the canvas before accepting a tall detour.
- Use a visibly small SVG arrowhead (roughly 5–6 marker units on the 1200-pixel canvas). The triangle must end on the target boundary, never dominate a label or collide with a nearby port.
- Allocate at least 16 screen pixels between adjacent route lanes on the same side corridor. Give each flow its own lane and label bay; never compress lanes until lines or labels touch.
- Put each label on the longest isolated segment of its own arrow. If a source-side segment is short, use the final horizontal segment instead. Do not stack repeated labels at a process edge.
- When exact Level 1 variants cannot remain separately legible at the fixed publication size, keep the Compact Level 1 diagram as the detailed authority and explicitly confirm with the project owner before consolidating the Level 2 presentation flow.

## Entity right-side port order

For every entity box, order all right-side source/destination ports by estimated route length:

- The shortest route starts at the top-most port.
- Each longer route starts progressively lower.
- Within that entity's dedicated side corridor, give the shortest route the outermost/rightmost lane and step longer routes inward/leftward before they travel vertically.
- Preserve the same sorted order at the entity port, the lane assignment, and the final approach bands; do not reorder the arrows midway.

Estimate a route from the entity centre to the target subprocess centre before allocating ports. Break ties by the target subprocess number, then by the flow's defined order. Every flow still needs its own source port, lane, destination port, arrowhead, and noun-labelled pill.

## Balancing and data rules

For a parent process `X.0`:

- Inventory every incoming and outgoing flow in the Compact Detail Level 1 diagram before choosing child subprocesses.
- The completed `X.0` diagram must expose the same external entities, data stores, flow labels, directions, and logical data exchanges as its parent. Do not add a new external boundary flow in Level 2 and do not drop a parent flow for visual simplicity.
- New arrows are allowed only between child subprocesses or as the detailed realization of a parent flow; they must not change the parent process contract.
- Keep generated displays such as dashboards, reports, and borrowing slips as outputs unless the system explicitly persists them.
- Use noun phrases on data flows and verb phrases on child processes.

## Per-diagram checklist

Before handing off a Level 2 diagram, verify:

1. One parent process is decomposed; no other Level 1 process is included as a peer child.
2. Every child is numbered from the correct parent prefix, such as `2.1`, `2.2`, and `2.3`.
3. All peers have identical subprocess geometry; all entity peers and store peers are likewise uniform.
4. Each relevant entity and store is shown once in that diagram.
5. Every external parent flow balances exactly against the Compact Detail Level 1 parent.
6. Each connector is independent, orthogonal, labelled, and has no crossing, shared lane, shared port, or detached arrowhead.
7. Right-side entity ports run shortest-route-first from top to bottom.
8. The final diagram remains readable without hover, grid, or editing controls; interaction only assists review.
