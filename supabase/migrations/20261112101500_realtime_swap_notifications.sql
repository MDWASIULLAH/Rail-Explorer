-- Deliver swap notifications over Supabase Realtime while exposing only each
-- authenticated user's own notification rows. API writes still use service_role.
grant select on public.rail_seat_swap_notifications to authenticated;

drop policy if exists "users_read_own_swap_notifications"
  on public.rail_seat_swap_notifications;
create policy "users_read_own_swap_notifications"
  on public.rail_seat_swap_notifications
  for select
  to authenticated
  using (recipient_id = (select auth.uid()::text));

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rail_seat_swap_notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.rail_seat_swap_notifications';
  end if;
end
$$;
