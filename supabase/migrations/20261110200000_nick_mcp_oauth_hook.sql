-- Configuration is populated separately, with the validated owner and deployed resource URL.
create schema if not exists mcp_private;
revoke all on schema mcp_private from public, anon, authenticated;
create table mcp_private.oauth_clients (
  client_id uuid primary key,
  owner_id uuid not null references auth.users(id),
  audience text not null check (audience ~ '^https://[a-z0-9.-]+/mcp$'),
  enabled boolean not null default false
);
alter table mcp_private.oauth_clients enable row level security;
revoke all on mcp_private.oauth_clients from public, anon, authenticated;

create function public.nick_mcp_access_token_hook(event jsonb)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare cfg mcp_private.oauth_clients%rowtype; claims jsonb;
begin
  -- Ordinary password, recovery, refresh and unrelated OAuth flows remain unchanged.
  select * into cfg from mcp_private.oauth_clients
    where client_id::text = event->>'client_id' and enabled;
  if not found then return event; end if;
  claims := event->'claims';
  if event->>'user_id' is distinct from cfg.owner_id::text
     or claims->>'sub' is distinct from cfg.owner_id::text then
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'MCP access is restricted to its owner.'));
  end if;
  claims := jsonb_set(claims, '{aud}', to_jsonb(cfg.audience));
  claims := jsonb_set(claims, '{client_id}', to_jsonb(cfg.client_id::text));
  claims := jsonb_set(claims, '{mcp_permissions}', '["knowledge:read"]'::jsonb);
  return jsonb_set(event, '{claims}', claims);
end;
$$;
revoke all on function public.nick_mcp_access_token_hook(jsonb) from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.nick_mcp_access_token_hook(jsonb) to supabase_auth_admin;
comment on function public.nick_mcp_access_token_hook(jsonb) is 'Dedicated Nick MCP audience and read permission; ordinary WerkTag tokens unchanged. Enable through Auth Hooks only after config and tests.';
