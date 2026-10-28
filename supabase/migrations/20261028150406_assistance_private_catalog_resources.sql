-- Reviewed draft. Root applies this to the existing assistance project and records its actual migration version.
-- No catalogue payloads or credentials belong in this migration.
create table if not exists public.assistance_catalog_resources (
  installation_id uuid not null references public.assistance_installations(id),
  path text not null,
  body text not null,
  content_type text not null,
  sha256 text not null,
  bytes integer not null,
  source_sha256 text not null,
  imported_at timestamptz not null default now(),
  primary key (installation_id,path),
  check(path in ('index.html','app.js','inflate.js','style-0.css','style-1.css','chrome.css','blocks/shk-offline-index.b64','blocks/shk-shard-0.b64','blocks/shk-shard-1.b64','blocks/shk-shard-2.b64','blocks/shk-shard-3.b64','blocks/shk-shard-4.b64','blocks/shk-shard-5.b64','blocks/shk-shard-6.b64','blocks/shk-shard-7.b64','blocks/shk-shard-8.b64','blocks/shk-shard-9.b64','blocks/shk-shard-10.b64','blocks/shk-shard-11.b64','blocks/shk-shard-12.b64','blocks/shk-shard-13.b64','blocks/shk-shard-14.b64','blocks/shk-shard-15.b64','blocks/shk-shard-16.b64','blocks/shk-shard-17.b64','blocks/shk-shard-18.b64','blocks/shk-shard-19.b64','blocks/shk-shard-20.b64','blocks/shk-shard-21.b64','blocks/shk-shard-22.b64','blocks/shk-shard-23.b64','blocks/shk-shard-24.b64','blocks/shk-shard-25.b64','blocks/shk-shard-26.b64','blocks/shk-shard-27.b64','blocks/shk-shard-28.b64','blocks/shk-shard-29.b64','blocks/shk-shard-30.b64','blocks/shk-shard-31.b64','blocks/shk-shard-32.b64','blocks/shk-shard-33.b64','blocks/shk-shard-34.b64','blocks/shk-shard-35.b64','blocks/shk-shard-36.b64','blocks/shk-shard-37.b64','blocks/shk-shard-38.b64','blocks/shk-shard-39.b64','blocks/shk-shard-40.b64','blocks/shk-shard-41.b64')),
  check(source_sha256='f33a749ef067768c9e86ec4964ddd42bde738f5be6f4eee5375919cf95ec6ace'),
  check(bytes between 1 and 2097152 and octet_length(body)=bytes),
  check(sha256 ~ '^[a-f0-9]{64}$' and sha256=encode(extensions.digest(convert_to(body,'UTF8'),'sha256'),'hex')),
  check(content_type = case when path='index.html' then 'text/html; charset=utf-8'
    when path in ('app.js','inflate.js') then 'text/javascript; charset=utf-8'
    when path in ('style-0.css','style-1.css','chrome.css') then 'text/css; charset=utf-8'
    else 'text/plain; charset=utf-8' end)
);
alter table public.assistance_catalog_resources enable row level security;
revoke all on public.assistance_catalog_resources from public,anon,authenticated;
grant select,insert on public.assistance_catalog_resources to service_role;

create or replace function public.assistance_catalog_import(
  p_installation_id uuid,p_path text,p_body text,p_content_type text,p_sha256 text,p_source_sha256 text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare prior public.assistance_catalog_resources; n integer; inserted boolean:=false;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_installation_id::text,814));
  if not exists(select 1 from public.assistance_installations where id=p_installation_id) then raise exception 'CATALOGUE_INSTALLATION_NOT_FOUND'; end if;
  select * into prior from public.assistance_catalog_resources where installation_id=p_installation_id and path=p_path for update;
  if found then
    if prior.body is distinct from p_body or prior.content_type is distinct from p_content_type
      or prior.sha256 is distinct from p_sha256 or prior.source_sha256 is distinct from p_source_sha256
    then return jsonb_build_object('conflict',true); end if;
  else
    insert into public.assistance_catalog_resources(installation_id,path,body,content_type,sha256,bytes,source_sha256)
      values(p_installation_id,p_path,p_body,p_content_type,p_sha256,octet_length(p_body),p_source_sha256);
    inserted:=true;
  end if;
  select count(*) into n from public.assistance_catalog_resources where installation_id=p_installation_id and source_sha256=p_source_sha256;
  return jsonb_build_object('stored',inserted,'resourceCount',n,'ready',n=49,'sourceSha256',p_source_sha256);
end $$;

-- Read only one requested resource, only after the entire immutable version is present.
-- No capability token, path traversal, signed URL or browser role can bypass the Edge session check.
create or replace function public.assistance_catalog_resource(p_installation_id uuid,p_path text)
returns jsonb language sql security definer set search_path='' as $$
  select to_jsonb(r) from public.assistance_catalog_resources r
  where r.installation_id=p_installation_id and r.path=p_path
    and r.source_sha256='f33a749ef067768c9e86ec4964ddd42bde738f5be6f4eee5375919cf95ec6ace'
    and (select count(*) from public.assistance_catalog_resources c
      where c.installation_id=p_installation_id and c.source_sha256=r.source_sha256)=49
$$;
revoke all on function public.assistance_catalog_import(uuid,text,text,text,text,text),public.assistance_catalog_resource(uuid,text) from public,anon,authenticated;
grant execute on function public.assistance_catalog_import(uuid,text,text,text,text,text),public.assistance_catalog_resource(uuid,text) to service_role;
notify pgrst,'reload schema';
