-- Read one device/day in a single database snapshot. Offset pagination over a
-- live upload stream can repeat/omit points when late observations arrive.
create or replace function public.assistance_native_journey(
 p_installation_id uuid, p_user_id uuid, p_date date, p_device_id uuid, p_limit integer default 10001
) returns jsonb language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare owner_id uuid; result jsonb;
begin
 select owner_user_id into owner_id from public.assistance_installations where id=p_installation_id;
 if owner_id is null or owner_id is distinct from p_user_id then raise exception 'NATIVE_OWNER_REQUIRED'; end if;
 if p_date is null or p_device_id is null or p_limit is null or p_limit not between 1 and 10001 then
  raise exception 'NATIVE_INVALID_JOURNEY';
 end if;
 select coalesce(jsonb_agg(snapshot.payload order by snapshot.tst,snapshot.received_at,snapshot.id),'[]'::jsonb)
 into result from (
  select payload,tst,received_at,id from public.assistance_points
  where installation_id=p_installation_id and day=p_date
   and payload->>'source'='werktag_ios' and payload->>'device'=p_device_id::text
  order by tst,received_at,id limit p_limit
 ) snapshot;
 return result;
end $$;
revoke all on function public.assistance_native_journey(uuid,uuid,date,uuid,integer) from public,anon,authenticated;
grant execute on function public.assistance_native_journey(uuid,uuid,date,uuid,integer) to service_role;
