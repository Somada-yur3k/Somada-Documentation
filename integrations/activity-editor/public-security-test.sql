-- Isolated TEST project only, after public-setup.sql. Uses p1 and rolls back.
begin;
set local role anon;
do $$begin
 begin
  perform 1 from public.activity_public_templates;
  raise exception 'Template read permission leaked';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.activity_public_drafts values('p1','bad',1,'{}',now());
  raise exception 'Direct write allowed';
 exception when insufficient_privilege then null; end;
 begin
  delete from public.activity_public_history;
  raise exception 'History deletion allowed';
 exception when insufficient_privilege then null; end;
 begin
  perform public.activity_public_save('p1',0,repeat('b',64),'{"nodes":{},"edges":{}}','Bad hash');
  raise exception 'Invalid hash accepted';
 exception when others then if sqlerrm not like 'Unknown diagram%' then raise; end if; end;
end $$;
reset role;
select set_config('activity_test.hash',(select base_hash from public.activity_public_templates where diagram_id='p1'),true);
set local role anon;
select public.activity_public_save('p1',0,current_setting('activity_test.hash'),'{"nodes":{},"edges":{}}','Anonymous save');
do $$begin
 if (select count(*) from public.activity_public_history where diagram_id='p1')<>1 then raise exception 'Anonymous read/history failed'; end if;
 begin
  perform public.activity_public_save('p1',0,current_setting('activity_test.hash'),'{"nodes":{},"edges":{}}','Stale');
  raise exception 'Stale revision accepted';
 exception when others then if sqlerrm not like 'Revision conflict:%' then raise; end if; end;
 begin
  perform public.activity_public_save('p1',1,current_setting('activity_test.hash'),'{"nodes":{"unknown":{"dx":0,"dy":0}},"edges":{}}','Invalid shape');
  raise exception 'Unknown node accepted';
 exception when others then if sqlerrm not like 'Invalid shape%' then raise; end if; end;
 begin
  perform public.activity_public_save('p1',1,current_setting('activity_test.hash'),'{"nodes":{},"edges":{"0":{"points":[[0,0],[99999,0]]}}}','Invalid route');
  raise exception 'Bad point accepted';
 exception when others then if sqlerrm not like 'Coordinate outside%' then raise; end if; end;
end $$;
rollback;
