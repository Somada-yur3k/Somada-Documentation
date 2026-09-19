-- Run on an isolated Supabase TEST project after schema.sql. Everything rolls back.
begin;
insert into auth.users(id,email) values
 ('11111111-1111-4111-8111-111111111111','activity-owner@example.invalid'),
 ('22222222-2222-4222-8222-222222222222','activity-editor@example.invalid'),
 ('33333333-3333-4333-8333-333333333333','activity-outsider@example.invalid');
insert into public.activity_members values
 ('11111111-1111-4111-8111-111111111111','Test Owner','owner'),
 ('22222222-2222-4222-8222-222222222222','Test Editor','editor');
set local role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select public.activity_save('p1',0,repeat('a',64),'{"nodes":{},"edges":{}}','Test editor save');
do $$begin
 if (select count(*) from public.activity_members)<>1 then raise exception 'Membership RLS failed'; end if;
 begin
  perform public.activity_save('p1',0,repeat('a',64),'{"nodes":{},"edges":{}}','Stale revision');
  raise exception 'Conflict protection failed';
 exception when others then if sqlerrm not like 'Revision conflict:%' then raise; end if; end;
 begin
  perform public.activity_approve('p1',1,'Editor cannot approve');
  raise exception 'Role protection failed';
 exception when others then if sqlerrm not like 'Only the owner%' then raise; end if; end;
 begin
  update public.activity_members set role='owner';
  raise exception 'Membership write protection failed';
 exception when insufficient_privilege then null; end;
 begin
  delete from public.activity_history;
  raise exception 'History protection failed';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
do $$begin
 if exists(select 1 from public.activity_drafts) then raise exception 'Outsider can read drafts'; end if;
 begin
  perform public.activity_save('p2',0,repeat('a',64),'{"nodes":{},"edges":{}}','Unauthorized');
  raise exception 'Non-member write protection failed';
 exception when others then if sqlerrm not like 'Approved member%' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select public.activity_approve('p1',1,'Owner reviewed');
do $$begin
 if (select count(*) from public.activity_history where diagram_id='p1')<>2 then raise exception 'History missing save/approve'; end if;
 if (select revision from public.activity_approved where diagram_id='p1')<>1 then raise exception 'Approval missing'; end if;
end $$;
rollback;
