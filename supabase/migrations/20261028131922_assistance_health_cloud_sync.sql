-- Apply after assistance-schema.sql. No key and no active cron are created by this file.
-- A verified owner configures an existing Freddy connection through the protected Edge Function.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists supabase_vault with schema vault;
create schema if not exists assistance_private;
revoke all on schema assistance_private from public, anon, authenticated;

create table if not exists public.assistance_health_sync (
  installation_id uuid primary key references public.assistance_installations(id),
  key_secret_id uuid not null,
  enabled boolean not null default false,
  configured_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  source_last_sync_at timestamptz,
  source_last_data_at timestamptz,
  error_code text,
  lease_token uuid,
  lease_until timestamptz
);
alter table public.assistance_health_sync enable row level security;
revoke all on public.assistance_health_sync from public, anon, authenticated;
grant select, insert, update on public.assistance_health_sync to service_role;

create table if not exists assistance_private.health_scheduler (
  singleton boolean primary key default true check(singleton),
  function_url text not null,
  cron_secret_id uuid not null
);
revoke all on assistance_private.health_scheduler from public, anon, authenticated;

create or replace function public.assistance_health_authorize_cron(p_secret text)
returns boolean language sql security definer set search_path = '' as $$
  select coalesce(length(p_secret) between 32 and 256 and
    exists(select 1 from assistance_private.health_scheduler c
      join vault.decrypted_secrets s on s.id=c.cron_secret_id
      where extensions.digest(p_secret,'sha256')=extensions.digest(s.decrypted_secret,'sha256')),false)
$$;

create or replace function public.assistance_health_dispatch()
returns bigint language plpgsql security definer set search_path = '' as $$
declare endpoint text; secret text; request_id bigint;
begin
  if not exists(select 1 from public.assistance_health_sync where enabled) then return null; end if;
  select c.function_url,s.decrypted_secret into endpoint,secret
    from assistance_private.health_scheduler c join vault.decrypted_secrets s on s.id=c.cron_secret_id;
  if endpoint is null or secret is null then return null; end if;
  select net.http_post(url:=endpoint,
    headers:=jsonb_build_object('Content-Type','application/json','x-health-cron-secret',secret),
    body:='{}'::jsonb, timeout_milliseconds:=60000) into request_id;
  return request_id;
end $$;

create or replace function public.assistance_health_configure(p_installation_id uuid,p_api_key text,p_function_url text)
returns void language plpgsql security definer set search_path = '' as $$
declare key_id uuid; cron_id uuid;
begin
  if p_api_key not like 'fk_live_%' or length(p_api_key) not between 24 and 512 or p_api_key ~ '[[:space:][:cntrl:]]'
    or p_function_url !~ '^https://[a-z0-9-]+\.supabase\.co/functions/v1/health-sync\?route=sync$'
    or not exists(select 1 from public.assistance_installations where id=p_installation_id and owner_user_id is not null)
  then raise exception 'HEALTH_INVALID_CONFIGURATION'; end if;
  -- Shared scheduler lock must precede the installation lock in configure and disable.
  perform pg_advisory_xact_lock(813,1);
  perform pg_advisory_xact_lock(hashtextextended(p_installation_id::text,813));
  select key_secret_id into key_id from public.assistance_health_sync where installation_id=p_installation_id for update;
  if key_id is null then
    select vault.create_secret(p_api_key,'werktag-health-'||p_installation_id::text,'Freddy read-only key; never expose to the browser') into key_id;
  else
    perform vault.update_secret(key_id,p_api_key);
  end if;
  select cron_secret_id into cron_id from assistance_private.health_scheduler where singleton for update;
  if cron_id is null then
    select vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'werktag-health-cron','Authenticates the private 15-minute dispatcher') into cron_id;
  end if;
  insert into assistance_private.health_scheduler(singleton,function_url,cron_secret_id) values(true,p_function_url,cron_id)
    on conflict(singleton) do update set function_url=excluded.function_url;
  insert into public.assistance_health_sync(installation_id,key_secret_id,enabled)
    values(p_installation_id,key_id,true)
    on conflict(installation_id) do update set key_secret_id=excluded.key_secret_id,enabled=true,configured_at=now(),error_code=null,lease_token=null,lease_until=null;
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
    'configured',s.installation_id is not null,'enabled',coalesce(s.enabled,false),
    'cronActive',coalesce(s.enabled,false) and exists(select 1 from cron.job where jobname='werktag-health-15min' and active),
    'intervalMinutes',15,'lastAttemptAt',s.last_attempt_at,'lastSuccessAt',s.last_success_at,
    'sourceLastSyncAt',s.source_last_sync_at,'sourceLastDataAt',s.source_last_data_at,
    'nextCheckAt',case when coalesce(s.enabled,false) and exists(select 1 from cron.job where jobname='werktag-health-15min' and active)
      then date_trunc('hour',now())+(floor(extract(minute from now())/15)+1)*interval '15 minutes' else null end,
    'errorCode',s.error_code,'setupUrl','https://freddy.coach/app')
  from (values(1)) v(n) left join public.assistance_health_sync s on s.installation_id=p_installation_id
$$;

create or replace function public.assistance_health_claim(p_installation_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare entry public.assistance_health_sync; token uuid:=gen_random_uuid(); key text;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_installation_id::text,813));
  select * into entry from public.assistance_health_sync where installation_id=p_installation_id for update;
  if entry.installation_id is null or not entry.enabled or entry.lease_until>now() then return jsonb_build_object('claimed',false); end if;
  select decrypted_secret into key from vault.decrypted_secrets where id=entry.key_secret_id;
  if key is null then
    update public.assistance_health_sync set error_code='HEALTH_KEY_UNAVAILABLE' where installation_id=p_installation_id;
    return jsonb_build_object('claimed',false);
  end if;
  update public.assistance_health_sync set last_attempt_at=now(),lease_token=token,lease_until=now()+interval '4 minutes' where installation_id=p_installation_id;
  return jsonb_build_object('claimed',true,'leaseToken',token,'apiKey',key);
end $$;

create or replace function public.assistance_health_fail_sync(p_installation_id uuid,p_lease_token uuid,p_error_code text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.assistance_health_sync set error_code=case when p_error_code ~ '^HEALTH_[A-Z_]{1,64}$' then p_error_code else 'HEALTH_SYNC_FAILED' end,
    lease_token=null,lease_until=null where installation_id=p_installation_id and lease_token=p_lease_token;
end $$;

create or replace function public.assistance_health_commit_sync(p_installation_id uuid,p_lease_token uuid,p_days jsonb,p_source_last_sync_at timestamptz,p_source_last_data_at timestamptz)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare state public.assistance_health_sync; day jsonb; previous jsonb; combined jsonb; metric record; prior_sync timestamptz; wrote integer:=0; next_day jsonb; obs jsonb; observations jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_installation_id::text,813));
  select * into state from public.assistance_health_sync where installation_id=p_installation_id for update;
  if state.installation_id is null or not state.enabled or state.lease_token is distinct from p_lease_token then return jsonb_build_object('committed',false,'reason','superseded'); end if;
  if jsonb_typeof(p_days) is distinct from 'array' or jsonb_array_length(p_days)>31 then raise exception 'HEALTH_INVALID_SNAPSHOT'; end if;
  if p_source_last_sync_at is null or state.source_last_sync_at is null or p_source_last_sync_at>=state.source_last_sync_at then
    for day in select value from jsonb_array_elements(p_days) loop
      if (day->>'schemaVersion') is distinct from '1' or (day->>'provider') is distinct from 'APPLE_HEALTH'
        or (day->>'timezone') is distinct from 'Europe/Berlin' or (day->>'source') is distinct from 'Apple Health via Freddy'
        or coalesce(day->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' or jsonb_typeof(day->'metrics') is distinct from 'object'
      then raise exception 'HEALTH_INVALID_SNAPSHOT'; end if;
      select payload into previous from public.assistance_health_days where installation_id=p_installation_id and date=(day->>'date')::date for update;
      prior_sync:=(previous->>'sourceLastSyncAt')::timestamptz;
      if prior_sync is not null and p_source_last_sync_at is not null and prior_sync>p_source_last_sync_at then continue; end if;
      combined:=coalesce(previous->'metrics','{}'::jsonb);
      for metric in select key,value from jsonb_each(day->'metrics') loop
        if jsonb_typeof(metric.value) is distinct from 'object' or jsonb_typeof(metric.value->'value') is distinct from 'number' or (metric.value->>'value')::numeric<0
          or (metric.value->>'updatedAt')::timestamptz is null then raise exception 'HEALTH_INVALID_METRIC'; end if;
        if combined ? metric.key and (combined->metric.key->>'updatedAt')::timestamptz >= (metric.value->>'updatedAt')::timestamptz then continue; end if;
        if metric.key='vo2_max' and combined ? metric.key then
          -- Keep observation history. Matching timestamp+device is a correction, not another measurement.
          select coalesce(jsonb_agg(value order by (value->>'observedAt')::timestamptz,value->>'sourceDevice'),'[]'::jsonb) into observations from (
            select distinct on(value->>'observedAt',value->>'sourceDevice') value
            from jsonb_array_elements(coalesce(combined->metric.key->'observations','[]'::jsonb)||coalesce(metric.value->'observations','[]'::jsonb))
            order by value->>'observedAt',value->>'sourceDevice',(value->>'updatedAt')::timestamptz desc
          ) deduplicated;
          select value into obs from jsonb_array_elements(observations) order by (value->>'observedAt')::timestamptz desc,value->>'sourceDevice' desc limit 1;
          if exists(select 1 from jsonb_array_elements(observations) x where x->>'observedAt'=obs->>'observedAt' and x->'value' is distinct from obs->'value') then raise exception 'HEALTH_AMBIGUOUS_OBSERVATION'; end if;
          metric.value:=obs||jsonb_build_object('updatedAt',metric.value->'updatedAt','aggregation','latest-observation','observations',observations);
        end if;
        combined:=jsonb_set(combined,array[metric.key],metric.value,true);
      end loop;
      next_day:=day||jsonb_build_object('metrics',combined,
        'fetchedAt',greatest((previous->>'fetchedAt')::timestamptz,(day->>'fetchedAt')::timestamptz),
        'sourceLastSyncAt',greatest(prior_sync,(day->>'sourceLastSyncAt')::timestamptz),
        'sourceLastDataAt',greatest((previous->>'sourceLastDataAt')::timestamptz,(day->>'sourceLastDataAt')::timestamptz));
      insert into public.assistance_health_days(installation_id,date,payload,updated_at) values(p_installation_id,(day->>'date')::date,next_day,now())
        on conflict(installation_id,date) do update set payload=excluded.payload,updated_at=excluded.updated_at;
      wrote:=wrote+1;
    end loop;
  end if;
  update public.assistance_health_sync set last_success_at=now(),error_code=null,lease_token=null,lease_until=null,
    source_last_sync_at=greatest(source_last_sync_at,p_source_last_sync_at),source_last_data_at=greatest(source_last_data_at,p_source_last_data_at)
    where installation_id=p_installation_id;
  return jsonb_build_object('committed',true,'daysWritten',wrote);
end $$;

-- These RPCs intentionally cross the private-schema boundary only for the Edge service role.
revoke all on function public.assistance_health_authorize_cron(text) from public,anon,authenticated;
revoke all on function public.assistance_health_dispatch() from public,anon,authenticated;
revoke all on function public.assistance_health_configure(uuid,text,text) from public,anon,authenticated;
revoke all on function public.assistance_health_disable(uuid) from public,anon,authenticated;
revoke all on function public.assistance_health_status(uuid) from public,anon,authenticated;
revoke all on function public.assistance_health_claim(uuid) from public,anon,authenticated;
revoke all on function public.assistance_health_fail_sync(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.assistance_health_commit_sync(uuid,uuid,jsonb,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.assistance_health_authorize_cron(text),public.assistance_health_dispatch(),public.assistance_health_configure(uuid,text,text),public.assistance_health_disable(uuid),public.assistance_health_status(uuid),public.assistance_health_claim(uuid),public.assistance_health_fail_sync(uuid,uuid,text),public.assistance_health_commit_sync(uuid,uuid,jsonb,timestamptz,timestamptz) to service_role;

-- Verified production baseline: net.http_request_queue has no PUBLIC/anon/authenticated grants.
-- Keep that baseline private: pg_net briefly holds the dedicated cron header there.
notify pgrst,'reload schema';
