begin;
insert into auth.users values('11111111-1111-4111-8111-111111111111');
insert into public.assistance_installations(id,owner_user_id,username_hash,password_hash,map_hash,owner_hash,salt)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','test','test','test','test','synthetic-salt-for-test');
do $$
declare i uuid:='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; u uuid:='11111111-1111-4111-8111-111111111111';
 e jsonb; result jsonb; n integer;
begin
 e:='[{"id":"22222222-2222-4222-8222-222222222222","deviceId":"33333333-3333-4333-8333-333333333333","kind":"location","capturedAt":"2026-10-29T12:00:00Z","hash":"hash1","payload":{"id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","tst":1793275140,"source":"werktag_ios","device":"33333333-3333-4333-8333-333333333333","lat":48,"lon":8,"acc":10}}]';
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
 -- Missing Health permissions must not erase previously confirmed metrics.
 e:='[{"id":"77777777-7777-4777-8777-777777777777","deviceId":"33333333-3333-4333-8333-333333333333","kind":"health","capturedAt":"2026-10-29T13:00:00Z","hash":"health-partial","payload":{"date":"2026-10-29","timezone":"Europe/Berlin","activeEnergyKcal":20}}]';
 perform public.assistance_native_ingest(i,u,e);
 if (select (payload->>'steps')::int from public.assistance_native_health_days) is distinct from 900
  or (select (payload->>'activeEnergyKcal')::int from public.assistance_native_health_days) is distinct from 20 then
  raise exception 'PARTIAL_HEALTH_ERASED_CONFIRMED_METRIC'; end if;
 if has_table_privilege('authenticated','public.assistance_native_events','SELECT') or has_function_privilege('authenticated','public.assistance_native_ingest(uuid,uuid,jsonb)','EXECUTE') then raise exception 'DIRECT_ACCESS_GRANTED'; end if;
end $$;
do $$
declare i uuid:='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; u uuid:='11111111-1111-4111-8111-111111111111';
 d uuid:='33333333-3333-4333-8333-333333333333'; day date; result jsonb; total integer;
begin
 select assistance_points.day into day from public.assistance_points limit 1;
 -- More than a PostgREST page, including equal and late observation times.
 insert into public.assistance_points(installation_id,id,tst,day,received_at,payload)
 select i,repeat(md5(n::text),2),1793275140+n,day,'2026-10-29T12:30:00Z',
  jsonb_build_object('id',repeat(md5(n::text),2),'tst',1793275140+n,'lat',48,'lon',8,'acc',10,
    'source','werktag_ios','device',d::text,'receivedAt','2026-10-29T12:30:00Z')
 from generate_series(1,1105) n;
 -- A parallel recorder must never appear in this device's result.
 perform public.assistance_ingest(i,jsonb_build_object('id',repeat('b',64),'tst',1793275140,'lat',49,'lon',9,'acc',10,'source','owntracks','device',d::text),'location');
 perform public.assistance_ingest(i,jsonb_build_object('id',repeat('c',64),'tst',1793275140,'lat',49,'lon',9,'acc',10,'source','werktag_ios','device',u::text),'location');
 result:=public.assistance_native_journey(i,u,day,d,10001);
 if jsonb_array_length(result)<>1106 then raise exception 'JOURNEY_INCOMPLETE_OR_MIXED'; end if;
 select count(distinct value->>'id') into total from jsonb_array_elements(result);
 if total<>1106 then raise exception 'JOURNEY_DUPLICATE_IDS'; end if;
 if exists(select 1 from jsonb_array_elements(result) where value->>'source'<>'werktag_ios' or value->>'device'<>d::text) then raise exception 'JOURNEY_SCOPE_LEAK'; end if;
 if jsonb_array_length(public.assistance_native_journey(i,u,day+1,d,10001))<>0 then raise exception 'JOURNEY_DAY_LEAK'; end if;
 if jsonb_array_length(public.assistance_native_journey(i,u,day,d,1000))<>1000 then raise exception 'JOURNEY_LIMIT_IGNORED'; end if;
 begin
  perform public.assistance_native_journey(i,u,day,d,10002);
  raise exception 'JOURNEY_LIMIT_BYPASSED';
 exception when others then if sqlerrm<>'NATIVE_INVALID_JOURNEY' then raise; end if; end;
 begin
  perform public.assistance_native_journey(i,d,day,d,10001);
  raise exception 'JOURNEY_OWNER_BYPASSED';
 exception when others then if sqlerrm<>'NATIVE_OWNER_REQUIRED' then raise; end if; end;
 if has_function_privilege('authenticated','public.assistance_native_journey(uuid,uuid,date,uuid,integer)','EXECUTE')
  or has_function_privilege('anon','public.assistance_native_journey(uuid,uuid,date,uuid,integer)','EXECUTE') then raise exception 'JOURNEY_DIRECT_ACCESS_GRANTED'; end if;
end $$;
rollback;
