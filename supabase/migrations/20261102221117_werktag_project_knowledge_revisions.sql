create schema werktag_knowledge;
revoke all on schema werktag_knowledge from public, anon, authenticated;
create role werktag_knowledge_agent nologin;
grant usage on schema werktag_knowledge to werktag_knowledge_agent;
create table werktag_knowledge.revisions (
 canonical_key text not null check (canonical_key ~ '^[a-z0-9][a-z0-9._-]{0,159}$'),
 version integer not null check (version > 0),
 request_id uuid not null unique,
 title text not null check (length(trim(title)) > 0),
 content text not null check (length(trim(content)) > 0),
 area text not null check (area in ('company_shop','learning_products','assistance','technical_components')),
 source text not null check (length(trim(source)) > 0),
 source_date date not null,
 kind text not null check (kind in ('fact','decision','idea','draft')),
 status text not null check (status in ('unverified','documented','confirmed','archived')),
 created_at timestamptz not null default now(),
 primary key (canonical_key, version)
);
alter table werktag_knowledge.revisions enable row level security;
revoke all on werktag_knowledge.revisions from public, anon, authenticated, werktag_knowledge_agent;
grant select on werktag_knowledge.revisions to werktag_knowledge_agent;
create policy project_reader on werktag_knowledge.revisions for select to werktag_knowledge_agent using (true);
create function werktag_knowledge.append_revision(k text, expected_version int, req uuid, t text, c text, a text, s text, d date, typ text, st text)
returns int language plpgsql security definer set search_path = pg_catalog as $$
declare prev int; old werktag_knowledge.revisions;
begin
 perform pg_advisory_xact_lock(hashtextextended(k,0));
 select * into old from werktag_knowledge.revisions where request_id=req;
 if found then
  if row(old.canonical_key,old.version,old.title,old.content,old.area,old.source,old.source_date,old.kind,old.status)
   is distinct from row(k,expected_version+1,t,c,a,s,d,typ,st) then raise exception 'request_id conflict'; end if;
  return old.version;
 end if;
 select coalesce(max(version),0) into prev from werktag_knowledge.revisions where canonical_key=k;
 if prev is distinct from expected_version then raise exception 'version conflict'; end if;
 insert into werktag_knowledge.revisions(canonical_key,version,request_id,title,content,area,source,source_date,kind,status)
 values(k,prev+1,req,t,c,a,s,d,typ,st);
 return prev+1;
end $$;
revoke all on function werktag_knowledge.append_revision(text,int,uuid,text,text,text,text,date,text,text) from public,anon,authenticated;
grant execute on function werktag_knowledge.append_revision(text,int,uuid,text,text,text,text,date,text,text) to werktag_knowledge_agent;