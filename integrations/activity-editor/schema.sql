-- Run once in your Supabase SQL editor. No service-role key belongs in the website.
begin;
create table public.activity_members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (length(display_name) between 1 and 100),
 role text not null check (role in ('owner','editor'))
);
create table public.activity_drafts (
 diagram_id text primary key check (diagram_id in ('p1','p2','p3','p4','p5')),
 base_hash text not null check (base_hash ~ '^[a-f0-9]{64}$'),
 revision integer not null check (revision>0), state jsonb not null,
 updated_by uuid references auth.users(id), updated_at timestamptz not null default now()
);
create table public.activity_history (
 id bigint generated always as identity primary key,
 diagram_id text not null references public.activity_drafts(diagram_id),
 revision integer not null, action text not null check(action in ('save','approve')),
 actor_id uuid references auth.users(id), actor_name text not null,
 note text not null check(length(note) between 1 and 2000),
 base_hash text not null, state jsonb not null, previous_state jsonb,
 created_at timestamptz not null default now()
);
create table public.activity_approved (
 diagram_id text primary key references public.activity_drafts(diagram_id),
 revision integer not null, base_hash text not null, state jsonb not null,
 approved_by uuid references auth.users(id), approved_at timestamptz not null default now()
);
alter table public.activity_members enable row level security;
alter table public.activity_drafts enable row level security;
alter table public.activity_history enable row level security;
alter table public.activity_approved enable row level security;
revoke all on public.activity_members,public.activity_drafts,public.activity_history,public.activity_approved from anon,authenticated;
grant select on public.activity_members,public.activity_drafts,public.activity_history,public.activity_approved to authenticated;
create policy "Read own membership" on public.activity_members for select to authenticated using(user_id=(select auth.uid()));
create policy "Members read drafts" on public.activity_drafts for select to authenticated using(exists(select 1 from public.activity_members where user_id=(select auth.uid())));
create policy "Members read history" on public.activity_history for select to authenticated using(exists(select 1 from public.activity_members where user_id=(select auth.uid())));
create policy "Members read approvals" on public.activity_approved for select to authenticated using(exists(select 1 from public.activity_members where user_id=(select auth.uid())));

create function public.activity_save(p_diagram text,p_expected integer,p_hash text,p_state jsonb,p_note text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare member public.activity_members%rowtype; current_row public.activity_drafts%rowtype; next_revision integer;
begin
 select * into member from public.activity_members where user_id=auth.uid();
 if member.user_id is null then raise exception 'Approved member login required'; end if;
 if p_diagram is null or p_diagram not in ('p1','p2','p3','p4','p5') or p_expected is null or p_expected<0 or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid diagram/version'; end if;
 if p_note is null or length(trim(p_note))<1 or length(p_note)>2000 then raise exception 'Change note required (1–2000 characters)'; end if;
 if p_state is null or jsonb_typeof(p_state) is distinct from 'object' or octet_length(p_state::text)>200000
  or jsonb_typeof(p_state->'nodes') is distinct from 'object' or jsonb_typeof(p_state->'edges') is distinct from 'object'
  or (p_state - 'nodes' - 'edges') <> '{}'::jsonb then raise exception 'Invalid draft format'; end if;
 -- Serializes even simultaneous first saves, when there is no row to lock yet.
 perform pg_advisory_xact_lock(hashtext('activity-editor:'||p_diagram));
 select * into current_row from public.activity_drafts where diagram_id=p_diagram for update;
 if coalesce(current_row.revision,0)<>p_expected then raise exception 'Revision conflict: another member saved first. Export your draft, then load the latest shared revision.'; end if;
 if current_row.base_hash is not null and current_row.base_hash<>p_hash then raise exception 'Authored version mismatch: administrator migration required'; end if;
 next_revision:=p_expected+1;
 insert into public.activity_drafts(diagram_id,base_hash,revision,state,updated_by) values(p_diagram,p_hash,next_revision,p_state,auth.uid())
 on conflict(diagram_id) do update set revision=excluded.revision,state=excluded.state,updated_by=excluded.updated_by,updated_at=now();
 insert into public.activity_history(diagram_id,revision,action,actor_id,actor_name,note,base_hash,state,previous_state)
 values(p_diagram,next_revision,'save',auth.uid(),member.display_name,p_note,p_hash,p_state,current_row.state);
 return jsonb_build_object('revision',next_revision);
end $$;

create function public.activity_approve(p_diagram text,p_expected integer,p_note text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare member public.activity_members%rowtype; draft public.activity_drafts%rowtype;
begin
 select * into member from public.activity_members where user_id=auth.uid();
 if member.user_id is null or member.role<>'owner' then raise exception 'Only the owner can approve a snapshot'; end if;
 if p_note is null or length(trim(p_note))<1 or length(p_note)>2000 then raise exception 'Review note required'; end if;
 perform pg_advisory_xact_lock(hashtext('activity-editor:'||p_diagram));
 select * into draft from public.activity_drafts where diagram_id=p_diagram for update;
 if draft.diagram_id is null or p_expected is null or draft.revision<>p_expected then raise exception 'Revision conflict: reload and review latest draft'; end if;
 insert into public.activity_approved(diagram_id,revision,base_hash,state,approved_by) values(p_diagram,draft.revision,draft.base_hash,draft.state,auth.uid())
 on conflict(diagram_id) do update set revision=excluded.revision,base_hash=excluded.base_hash,state=excluded.state,approved_by=excluded.approved_by,approved_at=now();
 insert into public.activity_history(diagram_id,revision,action,actor_id,actor_name,note,base_hash,state)
 values(p_diagram,draft.revision,'approve',auth.uid(),member.display_name,p_note,draft.base_hash,draft.state);
 return jsonb_build_object('revision',draft.revision);
end $$;
revoke all on function public.activity_save(text,integer,text,jsonb,text) from public,anon;
revoke all on function public.activity_approve(text,integer,text) from public,anon;
grant execute on function public.activity_save(text,integer,text,jsonb,text) to authenticated;
grant execute on function public.activity_approve(text,integer,text) to authenticated;
commit;
