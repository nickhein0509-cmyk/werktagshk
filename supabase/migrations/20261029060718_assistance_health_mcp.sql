-- Credentials remain encrypted in Vault; only the transport kind is public metadata.
alter table public.assistance_health_sync add column connection_kind text not null default 'api' check (connection_kind in ('api','mcp'));

create or replace function public.assistance_health_configure(p_installation_id uuid,p_api_key text,p_function_url text)
returns void language plpgsql security definer set search_path = '' as $$
declare key_id uuid; cron_id uuid; connection jsonb; connection_kind text:='api';
begin
  if p_api_key is null then raise exception 'HEALTH_INVALID_CONFIGURATION'; end if;
  if left(p_api_key,1)='{' then
    begin connection:=p_api_key::jsonb; exception when others then raise exception 'HEALTH_INVALID_CONFIGURATION'; end;
    if jsonb_typeof(connection)<>'object' or (select count(*) from jsonb_object_keys(connection))<>3
      or jsonb_typeof(connection->'kind')<>'string' or jsonb_typeof(connection->'url')<>'string' or jsonb_typeof(connection->'token')<>'string'
      or coalesce(connection->>'kind','')<>'mcp'
      or coalesce(connection->>'url','') !~ '^https://freddy\.coach/mcp/[A-Za-z0-9_-]{1,128}$'
      or coalesce(connection->>'token','') !~ '^[A-Za-z0-9._~-]+$'
      or length(coalesce(connection->>'token','')) not between 24 and 512
    then raise exception 'HEALTH_INVALID_CONFIGURATION'; end if;
    connection_kind:='mcp';
  elsif p_api_key not like 'fk_live_%' or length(p_api_key) not between 24 and 512 or p_api_key ~ '[[:space:][:cntrl:]]'
    then raise exception 'HEALTH_INVALID_CONFIGURATION';
  end if;
  if p_function_url !~ '^https://[a-z0-9-]+\.supabase\.co/functions/v1/health-sync\?route=sync$'
    or p_function_url is null
    or not exists(select 1 from public.assistance_installations where id=p_installation_id and owner_user_id is not null)
  then raise exception 'HEALTH_INVALID_CONFIGURATION'; end if;
  -- Shared scheduler lock must precede the installation lock in configure and disable.
  perform pg_advisory_xact_lock(813,1);
  perform pg_advisory_xact_lock(hashtextextended(p_installation_id::text,813));
  select key_secret_id into key_id from public.assistance_health_sync where installation_id=p_installation_id for update;
  if key_id is null then
    select vault.create_secret(p_api_key,'werktag-health-'||p_installation_id::text,'Freddy credentials; never expose to the browser') into key_id;
  else
    perform vault.update_secret(key_id,p_api_key);
  end if;
  select cron_secret_id into cron_id from assistance_private.health_scheduler where singleton for update;
  if cron_id is null then
    select vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'werktag-health-cron','Authenticates the private 15-minute dispatcher') into cron_id;
  end if;
  insert into assistance_private.health_scheduler(singleton,function_url,cron_secret_id) values(true,p_function_url,cron_id)
    on conflict(singleton) do update set function_url=excluded.function_url;
  insert into public.assistance_health_sync(installation_id,key_secret_id,enabled,connection_kind)
    values(p_installation_id,key_id,true,connection_kind)
    on conflict(installation_id) do update set key_secret_id=excluded.key_secret_id,connection_kind=excluded.connection_kind,enabled=true,configured_at=now(),error_code=null,lease_token=null,lease_until=null;
  -- Fixed job name keeps repeated configuration idempotent and avoids parallel schedules.
  perform cron.schedule('werktag-health-15min','*/15 * * * *','select public.assistance_health_dispatch();');
end $$;

create or replace function public.assistance_health_disable(p_installation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(813,1);
  perform pg_advisory_xact_lock(hashtextextended(p_installation_id::text,813));
  update public.assistance_health_sync set enabled=false,lease_token=null,lease_until=null
    where installation_id=p_installation_id;
  if not exists(select 1 from public.assistance_health_sync where enabled) then
    perform cron.unschedule(jobid) from cron.job where jobname='werktag-health-15min';
  end if;
end $$;

create or replace function public.assistance_health_status(p_installation_id uuid)
returns jsonb language sql security definer set search_path = '' as $$
  select jsonb_build_object(
    'status',case when s.installation_id is null then 'not_configured' when not s.enabled then 'disabled' when s.error_code is not null then 'error' else 'active' end,
    'connectionKind',s.connection_kind,'configured',s.installation_id is not null,'enabled',coalesce(s.enabled,false),
    'cronActive',coalesce(s.enabled,false) and exists(select 1 from cron.job where jobname='werktag-health-15min' and active),
    'intervalMinutes',15,'lastAttemptAt',s.last_attempt_at,'lastSuccessAt',s.last_success_at,
    'sourceLastSyncAt',s.source_last_sync_at,'sourceLastDataAt',s.source_last_data_at,
    'nextCheckAt',case when coalesce(s.enabled,false) and exists(select 1 from cron.job where jobname='werktag-health-15min' and active)
      then date_trunc('hour',now())+(floor(extract(minute from now())/15)+1)*interval '15 minutes' else null end,
    'errorCode',s.error_code,'setupUrl','https://freddy.coach/app')
  from (values(1)) v(n) left join public.assistance_health_sync s on s.installation_id=p_installation_id
$$;


revoke all on function public.assistance_health_configure(uuid,text,text), public.assistance_health_disable(uuid), public.assistance_health_status(uuid) from public, anon, authenticated;
grant execute on function public.assistance_health_configure(uuid,text,text), public.assistance_health_disable(uuid), public.assistance_health_status(uuid) to service_role;
