# Public shared Activity Diagrams — no login or approval

Only the five Activity Diagrams are editable. Anyone can load/save them and read history. Do not put confidential information in labels or notes. Anonymous history records revisions/times, not verified editor identities. Public edits can be vandalized; history helps recover changes but cannot prevent abuse.

## Activate shared saving

1. In your Supabase project, open **SQL Editor → New query**.
2. Paste the complete **public-setup.sql**, then Run. It includes public tables/read policies, the validated save function and five canonical diagram definitions. Do not run public-schema.sql alone.
3. No user accounts, member rows or approvals are needed. The public project URL/key are already configured. Never add a service-role key or password.
4. Deploy the website files. Open **System Diagrams → Edit Activity Diagrams**. It loads the latest shared version automatically.
5. Edit → **Save for everyone** → refresh in another browser. System-Diagrams.html also displays shared activities on refresh, with their revisions.

The public version uses separate activity_public_* tables. If you ran the old schema.sql, leave its private tables alone: member details, private notes and approved snapshots are NOT exposed. The old schema.sql and security-test.sql are the retired account-based prototype.

## Safety and recovery

- Public direct table writes/deletes are denied. Only activity_public_save can save: it validates server-held diagram definitions, authored hashes, node/arrow identifiers, labels, coordinates and payload size.
- Every changed save creates a history revision. Concurrent/stale saves are rejected instead of silently overwriting someone else's changes.
- A five-second shared per-diagram save interval and no-op deduplication limit accidental history growth. This is not comprehensive abuse prevention; monitor database usage/costs. To disable writes, revoke execute on public.activity_public_save(text,integer,text,jsonb,text) from anon,authenticated.
- Refresh prefers the database, never a stale browser draft. Unsaved work is under **Recover local backup**. History's **Restore as local draft**, followed by Save, creates a new revision instead of deleting old history.
- Export review JSON (with up to 50 recent history entries) or SVG for adviser/AI review. Screenshots are fine for visual review; JSON gives exact changes. The database retains earlier history.
- Names are not authenticated and no credentials are requested or stored.

## Publication boundaries

The Activity Editor and System Diagrams page show shared edits. Those edits are unreviewed. Swimlane, Sequence, Deployment, DFD, Use Case and ERD remain unchanged.

**Docs.html images, static PNG/PDF downloads, Google Docs and Git sources are not automatically overwritten.** Export the shared SVG/review JSON or print the live System Diagrams page. Source integration/regeneration remains separate. Analytics percentages audit authored sources, not anonymous drafts.

## Checks and maintenance

Approval-routing update: Activities 2 and 4 now distinguish Pending Dean from final Approved. A new installation uses the rebuilt public-setup.sql. Existing installations require administrator review of public-approval-migration.sql: it accepts only the immediately previous template and an absent/empty draft, preserves history, and refuses customized drafts without changing either diagram. Export and reconcile customized drafts manually first; Activity 2 has new nodes/routes, so old arrow-index edits must not be copied blindly. Generate the bundle with `node integrations/activity-editor/build-approval-migration.cjs`. Until migrated, version-mismatched shared drafts are not applied and the authored diagram is shown. No live migration has been executed.

Account-scope update: Activity 1 now includes Head-Laboratory-created Faculty accounts. For a NEW installation, use the rebuilt public-setup.sql. If the previous public setup is already installed, review and run public-account-scope-migration.sql instead. It preserves positions/routes and history, and stops rather than overwriting edited account labels or unexpected template versions. No database migration is run automatically.

- node integrations/activity-editor/build-public.cjs rebuilds public-setup.sql; --check checks freshness. Rerunning retains existing template rows intentionally. A later authored hash change needs an explicit administrator migration after exporting/archiving existing drafts.
- node integrations/activity-editor/check.cjs tests dragging, attached routes, labels, Undo/Redo, import/export, anonymous save, latest-on-refresh, shared viewing, conflicts and offline recovery using mocked HTTP. Set PLAYWRIGHT_MODULE when needed.
- Run public-security-test.sql on an isolated TEST Supabase project after setup. It tests anonymous access, validation, conflicts and denied direct writes, then rolls back.
- System-Diagrams.html?authored=1 excludes shared drafts for reproducible source audits/exports.

Reservation Type update: Activity 2 now requires Group / Student Only for Class Representatives in both schedule variants. New installations use the rebuilt `public-setup.sql`. Existing installations can review `public-reservation-type-migration.sql`, generated by `node integrations/activity-editor/build-reservation-migration.cjs`. This updates only an expected, uncustomized Activity 2 draft and retains history; customized drafts or unknown template versions are refused for manual reconciliation. It has not been run on the shared database. It updates diagram templates, not laboratory reservation data.

References: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [database functions](https://supabase.com/docs/guides/database/functions).
