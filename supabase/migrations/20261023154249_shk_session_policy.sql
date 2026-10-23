-- Refresh only the existing per-session access lease. No question issuance,
-- learner events or data migration. The existing private function checks the
-- confirmed allowlisted learner and ownership before returning any policy.
create or replace function public.shk_session_policy(_session uuid)
returns jsonb
language sql
security invoker
strict
set search_path = ''
as $$
  select shk_private.learning_policy(_session)
$$;
revoke all on function public.shk_session_policy(uuid) from public, anon;
grant execute on function public.shk_session_policy(uuid) to authenticated;
notify pgrst, 'reload schema';
