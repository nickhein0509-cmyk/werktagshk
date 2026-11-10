-- Preserve every existing client's read-only grant. Enable personal learning
-- permissions separately after the resource server and consent page are ready.
alter table mcp_private.oauth_clients
  add column permissions text[] not null default array['knowledge:read']::text[],
  add constraint nick_mcp_permissions_allowlist check (
    array_ndims(permissions) = 1
    and cardinality(permissions) between 1 and 6
    and array_position(permissions, null) is null
    and permissions <@ array[
      'knowledge:read', 'learning:read', 'learning:submit',
      'learning:review', 'learning:sync', 'learning:ack'
    ]::text[]
  );

create or replace function public.nick_mcp_access_token_hook(event jsonb)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare cfg mcp_private.oauth_clients%rowtype; claims jsonb;
begin
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
  -- Never derive resource permissions from requested OAuth scopes or user metadata.
  claims := jsonb_set(claims, '{mcp_permissions}', to_jsonb(cfg.permissions));
  return jsonb_set(event, '{claims}', claims);
end;
$$;
revoke all on function public.nick_mcp_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.nick_mcp_access_token_hook(jsonb) to supabase_auth_admin;
comment on column mcp_private.oauth_clients.permissions is 'Explicit server-managed MCP grants; the default remains knowledge:read. Does not grant Google IAM access.';
comment on function public.nick_mcp_access_token_hook(jsonb) is 'Dedicated Nick MCP audience and configured permissions after owner/client checks; ordinary WerkTag tokens unchanged.';
