---
name: use-case-guide-layout
description: Create or revise UML use-case diagrams that follow the project's three-column guide layout with large external actors, process-focused use cases, and a dedicated center column for include and extend relationships. Use for the SOMADA use-case diagram or another diagram explicitly requested in this visual format; do not apply DFD notation or data-flow rules.
---

# Use-Case Guide Layout

Build a panel-readable UML use-case diagram that closely follows the supplied guide image while preserving the actual system requirements.

## Visual blueprint

- Use a wide landscape canvas with a tall, centered system boundary and the system name above or in its top edge.
- Draw actors outside the boundary as large, equally sized stick figures. Put the role name directly below each actor.
- Place the primary/requesting roles down the left side and the reviewing/fulfilling roles down the right side. Space both sides vertically and align actors with the use cases most relevant to them.
- Organize the inside of the boundary into exactly three visual columns:
  1. Left column: the main use cases of the actors on the left.
  2. Center column: small supporting use cases used only to explain `<<include>>` and `<<extend>>` relationships.
  3. Right column: the main use cases of the actors on the right.
- Put authentication at the top center when it is shared by all authenticated actors.
- Use uniform pale-blue ellipses with a blue outline for peer use cases. Use a pale neutral fill and thin blue-gray outline for the system boundary.
- Keep generous whitespace. The overall composition should resemble the guide at first glance: actors framing a three-column system boundary, with relationship details concentrated in the middle.

## UML meaning

- Derive actor names and use cases from the documentation and implemented workflows before drawing.
- Name use cases as user goals or meaningful business processes, using concise verb phrases.
- Omit passive navigation or screen labels such as `View Dashboard` when they do not represent an independent user goal.
- Draw an actor association as a solid line without an arrowhead.
- Draw `<<include>>` and `<<extend>>` as dashed dependencies with open arrowheads and an explicit stereotype label.
- For `<<include>>`, point the dependency arrow toward the required included use case.
- For `<<extend>>`, point the dependency arrow toward the base use case being extended.
- Do not use a center-column ellipse as decoration. Every supporting use case must have a real relationship to a documented main use case.
- Do not invent actors, permissions, or processes merely to fill a column.

## Relationship layout

- Keep actor-to-use-case associations on the actor's own side whenever possible.
- Connect each actor only to the use cases in which that role directly participates; do not create a dense all-to-all web.
- Give each association its own visible endpoints. Avoid shared trunks and minimize crossings through spacing and actor alignment.
- Stack center-column supporting use cases vertically. Route their short dashed relationships horizontally or diagonally to the related main ellipse.
- Place `<<include>>` or `<<extend>>` beside its own dashed dependency, never floating between multiple lines.
- Increase the canvas or boundary height before shrinking actors, ellipses, or text to unreadable sizes.

## Source and interaction

- Keep the diagram source editable in SVG or HTML rather than replacing it with a bitmap-only result.
- Preserve existing hover highlighting, drag behavior, reset controls, print styles, and export behavior when the project already provides them.
- Treat interaction as optional assistance: the default static layout must remain readable without scripts.
- Use stable identifiers for actors, use cases, associations, and relationship dependencies so future edits remain manageable.

## Required audit

Before completion:

1. Compare every actor and main use case with the project documentation and system permissions.
2. Confirm the boundary has the requested left, center, and right column structure.
3. Confirm all actors are large, uniform, outside the system boundary, and clearly labelled.
4. Confirm `View Dashboard` and similar navigation-only items are absent unless the user explicitly restores them.
5. Verify every `<<include>>` and `<<extend>>` arrow points in the correct UML direction.
6. Trace every association and dependency; reject ambiguous endpoints, label collisions, unnecessary crossings, and lines passing through unrelated ellipses or actor labels.
7. Render the complete diagram at normal scale and at high zoom. Check both desktop display and print/export output.
8. Keep the result consistent with the guide's composition without copying placeholder labels or sacrificing the system's actual meaning.
