# Chatbot Use Case and layout update

- Removed the visible Log In ellipse and its six associations. Authentication still exists; its supporting full description and table number remain.
- Ask Laboratory Question now has three conditional extensions: Ask Head Lab Information; Ask Equipment Information / Availability; Check Operating Hours. Each points toward the complete base use case with `extend` and has a documented question-intent condition.
- Removed Check Schedule Availability and Check Reservation Status from the chatbot use-case diagram and Table 14. Reservation slots, tracking and clearance navigation are not removed from the system.
- Updated Table 14's description, related cases, actor/system steps, exceptions and extension conditions; also updated the overview, chatbot event and backlog entry.
- Equipment availability means current recorded inventory, not a reservation, hold or guarantee for a future day/time. Approved knowledge supports contacts and basic equipment guidance; missing information is reported honestly.
- Main ellipses reduced from 250×110 to 230×100, supporting ellipses from 230×90 to 210×88. Actors are 75% of their previous size. Outer use-case columns move slightly inward; unused top space is removed. Monochrome styling, independent associations, conditional dependencies, editor reset and export remain.
- Scope: Use Case and its documentation only. DFD/Activity/Sequence chatbot scope still requires a separate alignment pass; Sequence diagrams were not changed. No new live AI behavior is claimed.
- No commit, push, live Google Docs update or database change.
