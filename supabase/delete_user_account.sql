create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.maintenance_log
  where sparepart_id in (
    select vs.id
    from public.vehicle_sparepart vs
    join public.user_vehicle uv on uv.id = vs.vehicle_id
    where uv.user_id = uid
  );

  delete from public.vehicle_sparepart
  where vehicle_id in (select id from public.user_vehicle where user_id = uid);

  delete from public.km_log
  where vehicle_id in (select id from public.user_vehicle where user_id = uid);

  delete from public.user_vehicle where user_id = uid;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_user_account() from public;
revoke all on function public.delete_user_account() from anon;
grant execute on function public.delete_user_account() to authenticated;
