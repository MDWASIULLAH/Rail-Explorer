-- Cover the notification foreign keys for cleanup joins and referential checks.
create index if not exists rail_seat_swap_notifications_offer_idx
  on public.rail_seat_swap_notifications (offer_id);

create index if not exists rail_seat_swap_notifications_proposal_idx
  on public.rail_seat_swap_notifications (proposal_id)
  where proposal_id is not null;
