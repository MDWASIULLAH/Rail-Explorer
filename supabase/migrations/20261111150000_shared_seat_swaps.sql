-- Shared seat swap listings and atomic proposal acceptance.
-- Application access is server-side only: the Next.js routes verify the signed
-- rail_session cookie, then use the server-only service-role client.

create table if not exists public.rail_seat_swap_offers (
  id text primary key,
  owner_id text not null,
  owner_email text,
  status text not null default 'AVAILABLE'
    check (status in ('AVAILABLE', 'REQUEST_PENDING', 'SWAP_ACCEPTED')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  accepted_proposal_id text,
  accepted_at timestamptz
);

create index if not exists rail_seat_swap_offers_active_idx
  on public.rail_seat_swap_offers (status, created_at desc);
create index if not exists rail_seat_swap_offers_owner_idx
  on public.rail_seat_swap_offers (owner_id, created_at desc);

create table if not exists public.rail_seat_swap_proposals (
  id text primary key,
  offer_id text not null references public.rail_seat_swap_offers(id) on delete cascade,
  proposer_id text not null,
  proposer_email text,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'ACCEPTED', 'DECLINED')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists rail_seat_swap_proposals_offer_idx
  on public.rail_seat_swap_proposals (offer_id, status, created_at desc);
create index if not exists rail_seat_swap_proposals_proposer_idx
  on public.rail_seat_swap_proposals (proposer_id, created_at desc);
create unique index if not exists rail_seat_swap_proposals_one_pending_per_user_idx
  on public.rail_seat_swap_proposals (offer_id, proposer_id)
  where status = 'PENDING';

create table if not exists public.rail_seat_swap_notifications (
  id text primary key,
  recipient_id text not null,
  offer_id text not null references public.rail_seat_swap_offers(id) on delete cascade,
  proposal_id text references public.rail_seat_swap_proposals(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists rail_seat_swap_notifications_recipient_idx
  on public.rail_seat_swap_notifications (recipient_id, created_at desc);

alter table public.rail_seat_swap_offers enable row level security;
alter table public.rail_seat_swap_proposals enable row level security;
alter table public.rail_seat_swap_notifications enable row level security;

revoke all on public.rail_seat_swap_offers from public, anon, authenticated;
revoke all on public.rail_seat_swap_proposals from public, anon, authenticated;
revoke all on public.rail_seat_swap_notifications from public, anon, authenticated;
grant all on public.rail_seat_swap_offers to service_role;
grant all on public.rail_seat_swap_proposals to service_role;
grant all on public.rail_seat_swap_notifications to service_role;

create or replace function public.create_rail_seat_swap_proposal(
  p_proposal_id text,
  p_offer_id text,
  p_proposer_id text,
  p_proposer_email text,
  p_payload jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_offer public.rail_seat_swap_offers%rowtype;
begin
  select * into v_offer
  from public.rail_seat_swap_offers
  where id = p_offer_id
  for update;

  if not found or v_offer.status not in ('AVAILABLE', 'REQUEST_PENDING') then
    raise exception 'This swap offer is no longer available.' using errcode = 'P0001';
  end if;
  if v_offer.owner_id = p_proposer_id then
    raise exception 'You cannot propose a swap for your own offer.' using errcode = 'P0001';
  end if;

  insert into public.rail_seat_swap_proposals
    (id, offer_id, proposer_id, proposer_email, status, payload)
  values
    (p_proposal_id, p_offer_id, p_proposer_id, p_proposer_email, 'PENDING', p_payload);

  update public.rail_seat_swap_offers
  set status = 'REQUEST_PENDING', payload = jsonb_set(payload, '{status}', '"REQUEST_PENDING"'::jsonb)
  where id = p_offer_id;

  insert into public.rail_seat_swap_notifications
    (id, recipient_id, offer_id, proposal_id, payload)
  values (
    'swap-notice-' || p_proposal_id || '-new-request',
    v_offer.owner_id,
    p_offer_id,
    p_proposal_id,
    jsonb_build_object('message', 'A passenger proposed a berth swap.', 'kind', 'NEW_PROPOSAL')
  ) on conflict (id) do nothing;

  return jsonb_build_object('ok', true, 'proposal_id', p_proposal_id, 'offer_id', p_offer_id);
end;
$$;

create or replace function public.accept_rail_seat_swap_proposal(
  p_proposal_id text,
  p_owner_id text
) returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_proposal public.rail_seat_swap_proposals%rowtype;
  v_offer public.rail_seat_swap_offers%rowtype;
  v_now timestamptz := now();
begin
  select * into v_proposal
  from public.rail_seat_swap_proposals
  where id = p_proposal_id;
  if not found then
    raise exception 'Swap proposal not found.' using errcode = 'P0001';
  end if;

  select * into v_offer
  from public.rail_seat_swap_offers
  where id = v_proposal.offer_id
  for update;
  if not found or v_offer.owner_id <> p_owner_id then
    raise exception 'Only the listing owner can accept this proposal.' using errcode = 'P0001';
  end if;
  select * into v_proposal
  from public.rail_seat_swap_proposals
  where id = p_proposal_id
  for update;
  if v_offer.status <> 'REQUEST_PENDING' or v_proposal.status <> 'PENDING' then
    raise exception 'This offer has already been accepted or closed.' using errcode = 'P0001';
  end if;

  update public.rail_seat_swap_proposals
  set status = case when id = p_proposal_id then 'ACCEPTED' else 'DECLINED' end,
      payload = jsonb_set(payload, '{status}', to_jsonb(case when id = p_proposal_id then 'ACCEPTED' else 'DECLINED' end))
  where offer_id = v_offer.id and status = 'PENDING';

  update public.rail_seat_swap_offers
  set status = 'SWAP_ACCEPTED',
      accepted_proposal_id = p_proposal_id,
      accepted_at = v_now,
      payload = jsonb_set(
        jsonb_set(payload, '{status}', '"SWAP_ACCEPTED"'::jsonb),
        '{acceptedAt}', to_jsonb(v_now)
      )
  where id = v_offer.id;

  update public.rail_seat_swap_offers
  set payload = jsonb_set(payload, '{acceptedProposalId}', to_jsonb(p_proposal_id))
  where id = v_offer.id;

  insert into public.rail_seat_swap_notifications
    (id, recipient_id, offer_id, proposal_id, payload)
  values
    ('swap-notice-' || p_proposal_id || '-owner', v_offer.owner_id, v_offer.id, p_proposal_id,
      jsonb_build_object('message', 'Your berth swap was accepted.', 'kind', 'SWAP_ACCEPTED')),
    ('swap-notice-' || p_proposal_id || '-proposer', v_proposal.proposer_id, v_offer.id, p_proposal_id,
      jsonb_build_object('message', 'Your berth swap proposal was accepted.', 'kind', 'SWAP_ACCEPTED'))
  on conflict (id) do nothing;

  return jsonb_build_object('ok', true, 'offer_id', v_offer.id, 'proposal_id', p_proposal_id, 'accepted_at', v_now);
end;
$$;

create or replace function public.decline_rail_seat_swap_proposal(
  p_proposal_id text,
  p_owner_id text
) returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_proposal public.rail_seat_swap_proposals%rowtype;
  v_offer public.rail_seat_swap_offers%rowtype;
begin
  select * into v_proposal
  from public.rail_seat_swap_proposals
  where id = p_proposal_id;
  if not found then
    raise exception 'Swap proposal not found.' using errcode = 'P0001';
  end if;

  select * into v_offer
  from public.rail_seat_swap_offers
  where id = v_proposal.offer_id
  for update;
  if not found or v_offer.owner_id <> p_owner_id then
    raise exception 'Only the listing owner can decline this proposal.' using errcode = 'P0001';
  end if;
  select * into v_proposal
  from public.rail_seat_swap_proposals
  where id = p_proposal_id
  for update;
  if v_offer.status = 'SWAP_ACCEPTED' or v_proposal.status <> 'PENDING' then
    raise exception 'This proposal is already closed.' using errcode = 'P0001';
  end if;

  update public.rail_seat_swap_proposals
  set status = 'DECLINED', payload = jsonb_set(payload, '{status}', '"DECLINED"'::jsonb)
  where id = p_proposal_id;

  insert into public.rail_seat_swap_notifications
    (id, recipient_id, offer_id, proposal_id, payload)
  values (
    'swap-notice-' || p_proposal_id || '-declined',
    v_proposal.proposer_id,
    v_offer.id,
    p_proposal_id,
    jsonb_build_object('message', 'Your berth swap proposal was declined.', 'kind', 'PROPOSAL_DECLINED')
  ) on conflict (id) do nothing;

  if not exists (
    select 1 from public.rail_seat_swap_proposals
    where offer_id = v_offer.id and status = 'PENDING'
  ) then
    update public.rail_seat_swap_offers
    set status = 'AVAILABLE', payload = jsonb_set(payload, '{status}', '"AVAILABLE"'::jsonb)
    where id = v_offer.id;
  end if;

  return jsonb_build_object('ok', true, 'offer_id', v_offer.id, 'proposal_id', p_proposal_id);
end;
$$;

revoke all on function public.create_rail_seat_swap_proposal(text, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.accept_rail_seat_swap_proposal(text, text) from public, anon, authenticated;
revoke all on function public.decline_rail_seat_swap_proposal(text, text) from public, anon, authenticated;
grant execute on function public.create_rail_seat_swap_proposal(text, text, text, text, jsonb) to service_role;
grant execute on function public.accept_rail_seat_swap_proposal(text, text) to service_role;
grant execute on function public.decline_rail_seat_swap_proposal(text, text) to service_role;
