create table public.assistance_native_events (
 installation_id uuid not null references public.assistance_installations(id),
 id uuid not null,device_id uuid not null,payload_hash text not null,
 kind text not null check(kind in ('location','health')),captured_at timestamptz not null,
 received_at timestamptz not null default clock_timestamp(),primary key(installation_id,id)
);
create table public.assistance_native_health_days (
 installation_id uuid not null references public.assistance_installations(id),
 device_id uuid not null,date date not null,captured_at timestamptz not null,
 received_at timestamptz not null default clock_timestamp(),payload jsonb not null,
 primary key(installation_id,device_id,date)
);
alter table public.assistance_native_events enable row level security;
alter table public.assistance_native_health_days enable row level security;
revoke all on public.assistance_native_events,public.assistance_native_health_days from public,anon,authenticated;
grant select,insert,update,delete on public.assistance_native_events,public.assistance_native_health_days to service_role;
create or replace function public.assistance_native_ingest(p_installation_id uuid,p_user_id uuid,p_events jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare e jsonb; prior text; owner_id uuid; accepted jsonb:='[]'; moment timestamptz:=clock_timestamp();
begin
 select owner_user_id into owner_id from public.assistance_installations where id=p_installation_id for update;
 if owner_id is null or owner_id is distinct from p_user_id then raise exception 'NATIVE_OWNER_REQUIRED'; end if;
 if jsonb_typeof(p_events)<>'array' or jsonb_array_length(p_events) not between 1 and 100 then raise exception 'NATIVE_INVALID_BATCH'; end if;
 for e in select value from jsonb_array_elements(p_events) loop
  select payload_hash into prior from public.assistance_native_events where installation_id=p_installation_id and id=(e->>'id')::uuid;
  if found then
   if prior is distinct from e->>'hash' then raise exception 'NATIVE_ID_CONFLICT'; end if;
  else
   insert into public.assistance_native_events values(p_installation_id,(e->>'id')::uuid,(e->>'deviceId')::uuid,e->>'hash',e->>'kind',(e->>'capturedAt')::timestamptz,moment);
   if e->>'kind'='location' then
    perform public.assistance_ingest(p_installation_id,e->'payload','location');
   elsif e->>'kind'='health' then
    insert into public.assistance_native_health_days values(p_installation_id,(e->>'deviceId')::uuid,(e->'payload'->>'date')::date,(e->>'capturedAt')::timestamptz,moment,e->'payload')
    on conflict(installation_id,device_id,date) do update set payload=excluded.payload,captured_at=excluded.captured_at,received_at=excluded.received_at
    where excluded.captured_at>public.assistance_native_health_days.captured_at;
   end if;
  end if;
  accepted:=accepted||jsonb_build_array(e->>'id');
 end loop;
 return jsonb_build_object('schemaVersion',1,'accepted',accepted,'receivedAt',to_char(moment at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
end $$;
revoke all on function public.assistance_native_ingest(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.assistance_native_ingest(uuid,uuid,jsonb) to service_role;

