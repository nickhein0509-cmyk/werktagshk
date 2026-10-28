begin;
insert into auth.users values('11111111-1111-4111-8111-111111111111');
insert into public.assistance_installations(id,owner_user_id,username_hash,password_hash,map_hash,owner_hash,salt)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','test','test','test','test','synthetic-salt-for-test');
do $$
declare i uuid:='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; u uuid:='11111111-1111-4111-8111-111111111111';
 e jsonb; result jsonb; n integer;
begin
 e:='[{"id":"22222222-2222-4222-8222-222222222222","deviceId":"33333333-3333-4333-8333-333333333333","kind":"location","capturedAt":"2026-10-29T12:00:00Z","hash":"hash1","payload":{"id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","tst":1793275140,"source":"werktag_ios","device":"test","lat":48,"lon":8,"acc":10}}]';
 result:=public.assistance_native_ingest(i,u,e);
 if jsonb_array_length(result->'accepted')<>1 then raise exception 'NO_ACK'; end if;
 perform public.assistance_native_ingest(i,u,e);
 select count(*) into n from public.assistance_points;
 if n<>1 then raise exception 'REPLAY_DUPLICATES'; end if;
 begin
  perform public.assistance_native_ingest(i,'99999999-9999-4999-8999-999999999999',e);
  raise exception 'OWNER_BYPASSED';
 exception when others then if sqlerrm<>'NATIVE_OWNER_REQUIRED' then raise; end if; end;
 begin
  -- First row would insert; second conflicting row must roll the entire batch back.
  perform public.assistance_native_ingest(i,u,jsonb_build_array(
   jsonb_set(e->0,'{id}','"44444444-4444-4444-8444-444444444444"'),
   jsonb_set(e->0,'{hash}','"different"')));
  raise exception 'CONFLICT_BYPASSED';
 exception when others then if sqlerrm<>'NATIVE_ID_CONFLICT' then raise; end if; end;
 select count(*) into n from public.assistance_native_events;
 if n<>1 then raise exception 'BATCH_NOT_ATOMIC'; end if;
 e:='[{"id":"55555555-5555-4555-8555-555555555555","deviceId":"33333333-3333-4333-8333-333333333333","kind":"health","capturedAt":"2026-10-29T12:00:00Z","hash":"health1","payload":{"date":"2026-10-29","timezone":"Europe/Berlin","steps":900}}]';
 perform public.assistance_native_ingest(i,u,e);
 e:=jsonb_set(jsonb_set(jsonb_set(jsonb_set(e,'{0,id}','"66666666-6666-4666-8666-666666666666"'),'{0,capturedAt}','"2026-10-29T10:00:00Z"'),'{0,hash}','"health-old"'),'{0,payload,steps}','100');
 perform public.assistance_native_ingest(i,u,e);
 if (select (payload->>'steps')::int from public.assistance_native_health_days)<>900 then raise exception 'STALE_HEALTH_OVERWROTE'; end if;
 if has_table_privilege('authenticated','public.assistance_native_events','SELECT') or has_function_privilege('authenticated','public.assistance_native_ingest(uuid,uuid,jsonb)','EXECUTE') then raise exception 'DIRECT_ACCESS_GRANTED'; end if;
end $$;
rollback;

