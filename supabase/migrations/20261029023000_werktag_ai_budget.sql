-- No key, user grant, model, price or paid usage is activated by this migration.
create table public.werktag_ai_policy (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false,
  model text check (model ~ '^[a-zA-Z0-9._:-]{1,100}$'),
  max_output_tokens integer not null default 800 check (max_output_tokens between 16 and 4096),
  input_micro_usd_per_token numeric(12,6) check (input_micro_usd_per_token > 0),
  output_micro_usd_per_token numeric(12,6) check (output_micro_usd_per_token > 0),
  monthly_micro_usd bigint not null default 0 check (monthly_micro_usd between 0 and 1000000000),
  user_monthly_micro_usd bigint not null default 0 check (user_monthly_micro_usd between 0 and 1000000000),
  user_requests_per_minute integer not null default 3 check (user_requests_per_minute between 1 and 30),
  check (not enabled or (model is not null and input_micro_usd_per_token is not null
    and output_micro_usd_per_token is not null and monthly_micro_usd > 0 and user_monthly_micro_usd > 0))
);
insert into public.werktag_ai_policy(singleton) values (true);

create table public.werktag_ai_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lernen boolean not null default false,
  assistent boolean not null default false
);

-- Keep accounting after account deletion, but remove its user link. No prompts or answers.
create table public.werktag_ai_reservations (
  request_id uuid primary key,
  user_id uuid references auth.users(id) on delete set null,
  product text not null check (product in ('lernen', 'assistent')),
  reserved_micro_usd bigint not null check (reserved_micro_usd > 0),
  created_at timestamptz not null default clock_timestamp()
);
create index werktag_ai_month_idx on public.werktag_ai_reservations(created_at);
create index werktag_ai_user_time_idx on public.werktag_ai_reservations(user_id, created_at);

alter table public.werktag_ai_policy enable row level security;
alter table public.werktag_ai_access enable row level security;
alter table public.werktag_ai_reservations enable row level security;
revoke all on public.werktag_ai_policy, public.werktag_ai_access, public.werktag_ai_reservations from public, anon, authenticated;
grant select, insert, update on public.werktag_ai_policy, public.werktag_ai_access to service_role;
grant select on public.werktag_ai_reservations to service_role;

create function public.werktag_ai_reserve(p_user_id uuid, p_product text, p_input_tokens integer, p_request_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  policy public.werktag_ai_policy%rowtype;
  access public.werktag_ai_access%rowtype;
  stamp timestamptz;
  month_start timestamptz;
  reserved bigint;
  total_used numeric;
  user_used numeric;
begin
  if p_user_id is null or p_request_id is null or p_product is null or p_product not in ('lernen', 'assistent')
      or p_input_tokens is null or p_input_tokens not between 1 and 16384 then
    return jsonb_build_object('allowed', false, 'code', 'AI_INVALID_REQUEST');
  end if;
  -- One cross-instance lock orders admission and prevents parallel overspending.
  select * into policy from public.werktag_ai_policy where singleton for update;
  if not found or not policy.enabled then
    return jsonb_build_object('allowed', false, 'code', 'AI_NOT_CONFIGURED');
  end if;
  select * into access from public.werktag_ai_access where user_id = p_user_id for share;
  if not found or (p_product = 'lernen' and not access.lernen) or (p_product = 'assistent' and not access.assistent) then
    return jsonb_build_object('allowed', false, 'code', 'AI_FORBIDDEN');
  end if;
  if exists(select 1 from public.werktag_ai_reservations where request_id = p_request_id) then
    return jsonb_build_object('allowed', false, 'code', 'AI_INVALID_REQUEST');
  end if;
  stamp := clock_timestamp();
  month_start := date_trunc('month', stamp at time zone 'UTC') at time zone 'UTC';
  if (select count(*) from public.werktag_ai_reservations
      where user_id = p_user_id and created_at > stamp - interval '1 minute') >= policy.user_requests_per_minute then
    return jsonb_build_object('allowed', false, 'code', 'AI_RATE_LIMIT');
  end if;
  reserved := ceil(p_input_tokens * policy.input_micro_usd_per_token
    + policy.max_output_tokens * policy.output_micro_usd_per_token);
  select coalesce(sum(reserved_micro_usd), 0),
    coalesce(sum(reserved_micro_usd) filter (where user_id = p_user_id), 0)
    into total_used, user_used from public.werktag_ai_reservations where created_at >= month_start;
  if total_used + reserved > policy.monthly_micro_usd or user_used + reserved > policy.user_monthly_micro_usd then
    return jsonb_build_object('allowed', false, 'code', 'AI_BUDGET');
  end if;
  insert into public.werktag_ai_reservations(request_id, user_id, product, reserved_micro_usd, created_at)
    values (p_request_id, p_user_id, p_product, reserved, stamp);
  return jsonb_build_object('allowed', true, 'model', policy.model, 'maxOutputTokens', policy.max_output_tokens);
end $$;
revoke all on function public.werktag_ai_reserve(uuid,text,integer,uuid) from public, anon, authenticated;
grant execute on function public.werktag_ai_reserve(uuid,text,integer,uuid) to service_role;
