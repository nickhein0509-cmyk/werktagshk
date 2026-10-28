-- Draft: root generates the reviewed migration with the CLI. No secrets in this file.
create table if not exists public.assistance_installations (
 id uuid primary key, owner_user_id uuid references auth.users(id) on delete set null,
 username_hash text not null, password_hash text not null, map_hash text not null, owner_hash text not null,
 salt text not null check(length(salt)>=16), created_at timestamptz not null default now(), last_claimed_at timestamptz
);
create table if not exists public.assistance_points (
 installation_id uuid not null references public.assistance_installations(id), id text not null check(id ~ '^[0-9a-f]{64}$'),
 tst bigint not null check(tst>=946684800), day date not null, received_at timestamptz not null, payload jsonb not null,
 primary key(installation_id,id), check(jsonb_typeof(payload)='object'),
 check((payload->>'id')=id), check((payload->>'tst')::bigint=tst),
 check((payload->>'lat')::double precision between -90 and 90),check((payload->>'lon')::double precision between -180 and 180)
);
create index if not exists assistance_points_order on public.assistance_points(installation_id,tst,received_at,id);
create index if not exists assistance_points_day on public.assistance_points(installation_id,day,tst);
create table if not exists public.assistance_receipts (
 installation_id uuid primary key references public.assistance_installations(id), payload jsonb not null, updated_at timestamptz not null default now()
);
create table if not exists public.assistance_health_days (
 installation_id uuid not null references public.assistance_installations(id), date date not null,payload jsonb not null,updated_at timestamptz not null default now(),primary key(installation_id,date)
);
create table if not exists public.assistance_contexts (
 installation_id uuid not null references public.assistance_installations(id), date date not null,payload jsonb not null,updated_at timestamptz not null default now(),primary key(installation_id,date)
);
create table if not exists public.assistance_archives (
 installation_id uuid not null references public.assistance_installations(id), date date not null,payload jsonb not null,
 original_json text, gpx text,updated_at timestamptz not null default now(),primary key(installation_id,date)
);
create table if not exists public.assistance_sessions (
 installation_id uuid not null references public.assistance_installations(id),token_hash text not null check(token_hash ~ '^[0-9a-f]{64}$'),
 valid_until timestamptz not null,owner_until timestamptz,account_user_id uuid references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),primary key(installation_id,token_hash)
);
do $$ declare t text; begin
 foreach t in array array['installations','points','receipts','health_days','contexts','archives','sessions'] loop
 execute format('alter table public.assistance_%I enable row level security',t);
 execute format('revoke all on public.assistance_%I from public, anon, authenticated',t);
 execute format('grant select, insert, update, delete on public.assistance_%I to service_role',t);
 end loop;
end $$;
-- Only the authenticated Edge service can call these atomic operations. Browser JWTs
-- never receive table privileges; every Edge read also checks owner/session identity.
create or replace function public.assistance_claim(p_installation_id uuid,p_user_id uuid)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare existing uuid; claimed timestamptz; begin
 select owner_user_id,last_claimed_at into existing,claimed from public.assistance_installations where id=p_installation_id for update;
 if not found or p_user_id is null then raise exception 'INSTALLATION_NOT_FOUND'; end if;
 if (existing is not null and existing<>p_user_id) or (existing is null and claimed is not null) then return false; end if;
 update public.assistance_installations set owner_user_id=p_user_id,last_claimed_at=coalesce(last_claimed_at,clock_timestamp()) where id=p_installation_id;
 return true;
end $$;
create or replace function public.assistance_ingest(p_installation_id uuid,p_point jsonb,p_message_type text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare moment timestamptz; stamp text; prior jsonb; inserted_count integer:=0; duplicated boolean:=false; begin
 perform 1 from public.assistance_installations where id=p_installation_id for update;
 if not found then raise exception 'INSTALLATION_NOT_FOUND'; end if;
 moment:=clock_timestamp(); stamp:=to_char(moment at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
 select payload into prior from public.assistance_receipts where installation_id=p_installation_id;
 prior:=coalesce(prior,jsonb_build_object('observedSince',stamp,'lastMessageAt',null,'lastMessageType',null,'lastLocationMessageAt',null,'lastLocationFixTimestamp',null,'lastLocationWasDuplicate',null,'lastStoredLocationAt',null));
 if p_point is not null then
 insert into public.assistance_points(installation_id,id,tst,day,received_at,payload)
 values(p_installation_id,p_point->>'id',(p_point->>'tst')::bigint,(to_timestamp((p_point->>'tst')::double precision) at time zone 'Europe/Berlin')::date,moment,p_point||jsonb_build_object('receivedAt',stamp)) on conflict do nothing;
 get diagnostics inserted_count=row_count; duplicated:=inserted_count=0;
 prior:=prior||jsonb_build_object('lastLocationMessageAt',stamp,'lastLocationFixTimestamp',(p_point->>'tst')::bigint,'lastLocationWasDuplicate',duplicated);
 if not duplicated then prior:=prior||jsonb_build_object('lastStoredLocationAt',stamp); end if;
 end if;
 prior:=prior||jsonb_build_object('lastMessageAt',stamp,'lastMessageType',p_message_type);
 insert into public.assistance_receipts values(p_installation_id,prior,moment) on conflict(installation_id) do update set payload=excluded.payload,updated_at=excluded.updated_at;
 return jsonb_build_object('duplicate',duplicated,'stored',inserted_count=1);
end $$;
create or replace function public.assistance_import(p_installation_id uuid,p_data jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare r jsonb; n integer; pc integer:=0; hc integer:=0; cc integer:=0; ac integer:=0; stored text; stamp text; begin
 perform pg_advisory_xact_lock(hashtextextended(p_installation_id::text,813));
 perform 1 from public.assistance_installations where id=p_installation_id for update;
 if not found then raise exception 'INSTALLATION_NOT_FOUND'; end if;
 for r in select value from jsonb_array_elements(coalesce(p_data->'points','[]')) loop
 insert into public.assistance_points values(p_installation_id,r->>'id',(r->>'tst')::bigint,(to_timestamp((r->>'tst')::double precision) at time zone 'Europe/Berlin')::date,(r->>'receivedAt')::timestamptz,r) on conflict do nothing;
 get diagnostics n=row_count;pc:=pc+n; end loop;
 for r in select value from jsonb_array_elements(coalesce(p_data->'health','[]')) loop
 insert into public.assistance_health_days values(p_installation_id,(r->>'date')::date,r,clock_timestamp()) on conflict do nothing;
 get diagnostics n=row_count;hc:=hc+n; end loop;
 for r in select value from jsonb_array_elements(coalesce(p_data->'contexts','[]')) loop
 insert into public.assistance_contexts values(p_installation_id,(r->>'date')::date,r,clock_timestamp()) on conflict do nothing;
 get diagnostics n=row_count;cc:=cc+n; end loop;
 for r in select value from jsonb_array_elements(coalesce(p_data->'archives','[]')) loop
 insert into public.assistance_archives values(p_installation_id,(r->>'date')::date,(r->>'json')::jsonb,r->>'json',r->>'gpx',clock_timestamp()) on conflict do nothing;
 get diagnostics n=row_count;ac:=ac+n; end loop;
 select payload->>'receivedAt' into stored from public.assistance_points where installation_id=p_installation_id order by received_at desc limit 1;
 stamp:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
 insert into public.assistance_receipts values(p_installation_id,jsonb_build_object('observedSince',stamp,'lastMessageAt',null,'lastMessageType',null,'lastLocationMessageAt',null,'lastLocationFixTimestamp',null,'lastLocationWasDuplicate',null,'lastStoredLocationAt',stored),clock_timestamp()) on conflict(installation_id) do update set payload=public.assistance_receipts.payload||jsonb_build_object('lastStoredLocationAt',stored);
 return jsonb_build_object('points',pc,'health',hc,'contexts',cc,'archives',ac);
end $$;
create or replace function public.assistance_context_write(p_installation_id uuid,p_date date,p_expected_revision bigint,p_payload jsonb)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare old jsonb; begin
 perform 1 from public.assistance_installations where id=p_installation_id for update;
 if not found then raise exception 'INSTALLATION_NOT_FOUND'; end if;
 select payload into old from public.assistance_contexts where installation_id=p_installation_id and date=p_date;
 if coalesce((old->>'revision')::bigint,0)<>p_expected_revision then return false; end if;
 insert into public.assistance_contexts values(p_installation_id,p_date,p_payload,clock_timestamp()) on conflict(installation_id,date) do update set payload=excluded.payload,updated_at=excluded.updated_at;
 return true;
end $$;
revoke all on function public.assistance_claim(uuid,uuid),public.assistance_ingest(uuid,jsonb,text),public.assistance_import(uuid,jsonb),public.assistance_context_write(uuid,date,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.assistance_claim(uuid,uuid),public.assistance_ingest(uuid,jsonb,text),public.assistance_import(uuid,jsonb),public.assistance_context_write(uuid,date,bigint,jsonb) to service_role;
create or replace function public.assistance_read_points(p_installation_id uuid)
returns jsonb language sql security definer set search_path=pg_catalog,public as $$
 select coalesce(jsonb_agg(payload order by tst,received_at,id),'[]'::jsonb) from public.assistance_points where installation_id=p_installation_id;
$$;
revoke all on function public.assistance_read_points(uuid) from public,anon,authenticated;
grant execute on function public.assistance_read_points(uuid) to service_role;
