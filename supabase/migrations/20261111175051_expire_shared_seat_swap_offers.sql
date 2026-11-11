-- Remove swap requests, proposals, and notifications 24 hours after listing.
-- Child proposals/notifications are removed by the existing ON DELETE CASCADE
-- constraints, so expired rows do not remain visible or consume storage.
alter table public.rail_seat_swap_offers
  add column if not exists expires_at timestamptz;

update public.rail_seat_swap_offers
set expires_at = created_at + interval '24 hours'
where expires_at is null;

alter table public.rail_seat_swap_offers
  alter column expires_at set default (now() + interval '24 hours'),
  alter column expires_at set not null;

create index if not exists rail_seat_swap_offers_expiration_idx
  on public.rail_seat_swap_offers (expires_at);

create extension if not exists pg_cron;

-- Keep the migration safe to re-run during deployment retries.
select cron.unschedule(jobid)
from cron.job
where jobname = 'expire-shared-seat-swap-offers';

select cron.schedule(
  'expire-shared-seat-swap-offers',
  '* * * * *',
  $job$delete from public.rail_seat_swap_offers where expires_at <= now();$job$
);
