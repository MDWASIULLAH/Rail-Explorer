import { NextResponse } from 'next/server';
import { getSeatSwapAdminClient, getSeatSwapErrorMessage, getSeatSwapUser } from '@/lib/seat-swap-server';

export async function POST(request: Request) {
  const user = getSeatSwapUser(request);
  if (!user) return NextResponse.json({ success: false, error: 'Sign in to manage swap requests.' }, { status: 401 });
  const db = getSeatSwapAdminClient();
  if (!db) return NextResponse.json({ success: false, error: 'Shared seat swaps are not configured.' }, { status: 503 });

  try {
    const input = await request.json() as Record<string, unknown>;
    const action = input.action;
    const proposalId = typeof input.proposalId === 'string' ? input.proposalId.slice(0, 100) : '';
    if (action === 'propose') {
      const offerId = typeof input.offerId === 'string' ? input.offerId.slice(0, 100) : '';
      const payload = input.payload && typeof input.payload === 'object' ? input.payload as Record<string, unknown> : {};
      if (!offerId || !proposalId || typeof payload.proposerName !== 'string' || typeof payload.proposerCoach !== 'string') {
        return NextResponse.json({ success: false, error: 'Proposal details are incomplete.' }, { status: 400 });
      }
      const result = await db.rpc('create_rail_seat_swap_proposal', {
        p_proposal_id: proposalId,
        p_offer_id: offerId,
        p_proposer_id: user.id,
        p_proposer_email: user.email,
        p_payload: { ...payload, proposerUserId: user.id, proposerEmail: user.email, isCurrentUser: true, status: 'PENDING' },
      });
      if (result.error) throw result.error;
      return NextResponse.json({ success: true, data: result.data }, { headers: { 'Cache-Control': 'no-store' } });
    }

    if (action === 'accept' || action === 'decline') {
      if (!proposalId) return NextResponse.json({ success: false, error: 'Proposal ID is required.' }, { status: 400 });
      const result = await db.rpc(action === 'accept' ? 'accept_rail_seat_swap_proposal' : 'decline_rail_seat_swap_proposal', {
        p_proposal_id: proposalId,
        p_owner_id: user.id,
      });
      if (result.error) throw result.error;
      return NextResponse.json({ success: true, data: result.data }, { headers: { 'Cache-Control': 'no-store' } });
    }

    if (action === 'delete') {
      const offerId = typeof input.offerId === 'string' ? input.offerId.slice(0, 100) : '';
      if (!offerId) return NextResponse.json({ success: false, error: 'Offer ID is required.' }, { status: 400 });
      const result = await db.from('rail_seat_swap_offers').delete().eq('id', offerId).eq('owner_id', user.id).neq('status', 'SWAP_ACCEPTED').select('id').maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) return NextResponse.json({ success: false, error: 'Offer not found, already accepted, or not owned by this account.' }, { status: 409 });
      return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
    }

    return NextResponse.json({ success: false, error: 'Unknown swap action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: getSeatSwapErrorMessage(error) }, { status: 503 });
  }
}
