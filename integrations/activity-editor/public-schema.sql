-- Public collaboration is intentional: anyone with the public website settings
-- may read/edit these FIVE diagrams. No other table is opened to anonymous users.
-- The old private activity_* tables, if installed, are not exposed or modified.
begin;
create table if not exists public.activity_public_templates (
 diagram_id text primary key check(diagram_id in ('p1','p2','p3','p4','p5')),
 base_hash text not null check(base_hash ~ '^[a-f0-9]{64}$'), seed jsonb not null
);
create table if not exists public.activity_public_drafts (
 diagram_id text primary key references public.activity_public_templates(diagram_id),
 base_hash text not null, revision integer not null check(revision>0),
 state jsonb not null, updated_at timestamptz not null default now()
);
create table if not exists public.activity_public_history (
 diagram_id text not null references public.activity_public_drafts(diagram_id),
 revision integer not null, base_hash text not null, state jsonb not null,
 note text not null check(length(note) between 1 and 2000),
 created_at timestamptz not null default now(), primary key(diagram_id,revision)
);
alter table public.activity_public_templates enable row level security;
alter table public.activity_public_drafts enable row level security;
alter table public.activity_public_history enable row level security;
revoke all on public.activity_public_templates,public.activity_public_drafts,public.activity_public_history from anon,authenticated;
grant select on public.activity_public_drafts,public.activity_public_history to anon,authenticated;
drop policy if exists "Public diagram reads" on public.activity_public_drafts;
create policy "Public diagram reads" on public.activity_public_drafts for select to anon,authenticated using(true);
drop policy if exists "Public history reads" on public.activity_public_history;
create policy "Public history reads" on public.activity_public_history for select to anon,authenticated using(true);

create or replace function public.activity_public_save(p_diagram text,p_expected integer,p_hash text,p_state jsonb,p_note text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare template public.activity_public_templates%rowtype; current_row public.activity_public_drafts%rowtype;
 k text; patch jsonb; node jsonb; point jsonb; route jsonb; dx numeric; dy numeric; next_revision integer;
begin
 select * into template from public.activity_public_templates where diagram_id=p_diagram;
 if template.diagram_id is null or p_expected is null or p_expected<0 or p_hash is distinct from template.base_hash then raise exception 'Unknown diagram or authored version'; end if;
 if p_note is null or length(trim(p_note))<1 or length(p_note)>2000 then raise exception 'Invalid note'; end if;
 if p_state is null or jsonb_typeof(p_state) is distinct from 'object' or octet_length(p_state::text)>200000
  or jsonb_typeof(p_state->'nodes') is distinct from 'object' or jsonb_typeof(p_state->'edges') is distinct from 'object'
  or (p_state-'nodes'-'edges')<>'{}'::jsonb then raise exception 'Invalid draft structure'; end if;
 for k,patch in select * from jsonb_each(p_state->'nodes') loop
  node:=template.seed->'nodes'->k;
  if node is null or jsonb_typeof(patch) is distinct from 'object' or (patch-'dx'-'dy'-'label')<>'{}'::jsonb
   or jsonb_typeof(patch->'dx') is distinct from 'number' or jsonb_typeof(patch->'dy') is distinct from 'number' then raise exception 'Invalid shape'; end if;
  dx:=(patch->>'dx')::numeric; dy:=(patch->>'dy')::numeric;
  if (node->>'x')::numeric+dx<0 or (node->>'y')::numeric+dy<100
   or (node->>'x')::numeric+(node->>'w')::numeric+dx>(template.seed->>'width')::numeric
   or (node->>'y')::numeric+(node->>'h')::numeric+dy>(template.seed->>'height')::numeric then raise exception 'Shape outside canvas'; end if;
  if patch ? 'label' and (jsonb_typeof(patch->'label') is distinct from 'string' or length(trim(patch->>'label'))<1 or length(patch->>'label')>180 or node->>'kind' not in ('action','decision')) then raise exception 'Invalid shape label'; end if;
 end loop;
 for k,patch in select * from jsonb_each(p_state->'edges') loop
  if k !~ '^(0|[1-9][0-9]{0,3})$' then raise exception 'Invalid arrow identifier'; end if;
  route:=template.seed->'routes'->(k::integer);
  if route is null or jsonb_typeof(patch) is distinct from 'object' or (patch-'points'-'label')<>'{}'::jsonb then raise exception 'Invalid arrow'; end if;
  if patch ? 'label' and (jsonb_typeof(patch->'label') is distinct from 'string' or length(patch->>'label')>100 or (coalesce(route->>'guard','')<>'' and length(trim(patch->>'label'))<1)) then raise exception 'Invalid arrow label'; end if;
  if patch ? 'points' then
   if jsonb_typeof(patch->'points') is distinct from 'array' then raise exception 'Invalid arrow points'; end if;
   if jsonb_array_length(patch->'points') not between 2 and 30 then raise exception 'Invalid arrow points'; end if;
   for point in select value from jsonb_array_elements(patch->'points') loop
    if jsonb_typeof(point) is distinct from 'array' then raise exception 'Invalid coordinate'; end if;
    if jsonb_array_length(point)<>2 or jsonb_typeof(point->0) is distinct from 'number' or jsonb_typeof(point->1) is distinct from 'number' then raise exception 'Invalid coordinate'; end if;
    if (point->>0)::numeric not between 0 and (template.seed->>'width')::numeric or (point->>1)::numeric not between 0 and (template.seed->>'height')::numeric then raise exception 'Coordinate outside canvas'; end if;
   end loop;
  end if;
 end loop;
 perform pg_advisory_xact_lock(hashtext('activity-public:'||p_diagram));
 select * into current_row from public.activity_public_drafts where diagram_id=p_diagram for update;
 if coalesce(current_row.revision,0)<>p_expected then raise exception 'Revision conflict: someone saved first. Export or keep your local backup, then reload latest.'; end if;
 if current_row.base_hash is not null and current_row.base_hash<>p_hash then raise exception 'Existing draft requires an administrator migration'; end if;
 if current_row.state=p_state then return jsonb_build_object('revision',current_row.revision); end if;
 -- A shared per-diagram throttle bounds anonymous history growth. It is not
 -- identity verification or comprehensive abuse prevention; public edits can be vandalized.
 if current_row.updated_at>clock_timestamp()-interval '5 seconds' then raise exception 'Please wait five seconds between shared saves'; end if;
 next_revision:=p_expected+1;
 insert into public.activity_public_drafts(diagram_id,base_hash,revision,state) values(p_diagram,p_hash,next_revision,p_state)
 on conflict(diagram_id) do update set revision=excluded.revision,state=excluded.state,updated_at=clock_timestamp();
 insert into public.activity_public_history(diagram_id,revision,base_hash,state,note) values(p_diagram,next_revision,p_hash,p_state,p_note);
 return jsonb_build_object('revision',next_revision);
end $$;
revoke all on function public.activity_public_save(text,integer,text,jsonb,text) from public;
grant execute on function public.activity_public_save(text,integer,text,jsonb,text) to anon,authenticated;
-- TEMPLATE_INSERTS: the build script inserts the five canonical seeds here.
commit;
