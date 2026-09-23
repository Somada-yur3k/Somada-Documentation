# Common Activity Final update — reverted

The common-final layout below was reverted at the user's request. Original branch endings and canvas sizes are restored pending clarification of whether completed operations return to operation selection or finish the invocation. This document records the superseded experiment, not the current layout.

All five standalone major-process Activity Diagrams now have one Initial Node and one Activity Final Node. Existing success, invalid-input, refusal and no-operation outcomes converge through an explicitly labelled OR completion node; it does not wait for mutually exclusive outcomes. The genuine parallel read fork/join in reporting is preserved.

No Flow Final is needed for these exclusive endings: they finish the selected activity invocation, not a parallel branch. Activity Final does not mean application shutdown. The six-lane overall Swimlane and Sequence diagrams are outside this change.

Tests cover exactly one start/final per diagram, reachability of every node, attached orthogonal edges, and no action/decision shape intersections. Generated PNG/SVG and the activity publication PDF are refreshed. This does not migrate or overwrite shared database drafts.
