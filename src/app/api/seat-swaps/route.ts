import { NextResponse } from 'next/server';
import { getSeatSwapAdminClient, getSeatSwapErrorMessage, getSeatSwapUser } from '@/lib/seat-swap-server';

export async function GET(request: Request) {
  const user = await getSeatSwapUser(request);
  if (!user) return NextResponse.json({ success: false, error: 'Sign in to view shared seat swaps.' }, { status: 401 });

  const db = getSeatSwapAdminClient();
  if (!db) return NextResponse.json({ success: false, error: 'Shared seat swaps are not configured.' }, { status: 503 });

  try {
    const now = new Date().toISOString();
    const [activeResult, ownedResult] = await Promise.all([
      db.from('rail_seat_swap_offers').select('id, owner_id, owner_email, status, payload, created_at, expires_at, accepted_proposal_id, accepted_at')
        .in('status', ['AVAILABLE', 'REQUEST_PENDING']).gt('expires_at', now).order('created_at', { ascending: false }).limit(250),
      db.from('rail_seat_swap_offers').select('id, owner_id, owner_email, status, payload, created_at, expires_at, accepted_proposal_id, accepted_at')
        .eq('owner_id', user.id).gt('expires_at', now).order('created_at', { ascending: false }).limit(250),
    ]);
    if (activeResult.error) throw activeResult.error;
    if (ownedResult.error) throw ownedResult.error;

    const offersById = new Map<string, Record<string, unknown>>();
    for (const row of [...(activeResult.data || []), ...(ownedResult.data || [])]) {
      offersById.set(row.id, row as unknown as Record<string, unknown>);
    }
    const rows = [...offersById.values()];
    const offerIds = rows.map((row) => String(row.id));
    const proposalQueries = [
      db.from('rail_seat_swap_proposals').select('id, offer_id, proposer_id, proposer_email, status, payload, created_at')
        .eq('proposer_id', user.id).order('created_at', { ascending: false }).limit(250),
    ];
    if (offerIds.length) {
      proposalQueries.push(
        db.from('rail_seat_swap_proposals').select('id, offer_id, proposer_id, proposer_email, status, payload, created_at')
          .in('offer_id', offerIds).order('created_at', { ascending: false }).limit(500),
      );
    }
    const [sentResult, incomingResult] = await Promise.all(proposalQueries);
    if (sentResult.error) throw sentResult.error;
    if (incomingResult?.error) throw incomingResult.error;

    const proposalRows = new Map<string, Record<string, unknown>>();
    for (const row of [...(sentResult.data || []), ...(incomingResult?.data || [])]) {
      proposalRows.set(row.id, row as unknown as Record<string, unknown>);
    }
    const sentOfferIds = [...new Set((sentResult.data || []).map((row) => row.offer_id))]
      .filter((id) => !offersById.has(id));
    if (sentOfferIds.length) {
      const sentOffersResult = await db.from('rail_seat_swap_offers')
        .select('id, owner_id, owner_email, status, payload, created_at, expires_at, accepted_proposal_id, accepted_at')
        .in('id', sentOfferIds).gt('expires_at', now).limit(250);
      if (sentOffersResult.error) throw sentOffersResult.error;
      for (const row of sentOffersResult.data || []) offersById.set(row.id, row as unknown as Record<string, unknown>);
    }
    const allRows = [...offersById.values()];
    const proposals = [...proposalRows.values()].map((row) => {
      const payload = (row.payload && typeof row.payload === 'object' ? row.payload : {}) as Record<string, unknown>;
      const proposerId = String(row.proposer_id || '');
      return {
        ...payload,
        id: row.id,
        offerId: row.offer_id,
        status: row.status,
        proposerUserId: proposerId === user.id ? proposerId : undefined,
        proposerEmail: proposerId === user.id ? row.proposer_email : undefined,
        isCurrentUser: proposerId === user.id,
        createdAt: row.created_at,
      };
    });
    const proposalsById = new Map(proposals.map((proposal) => [String(proposal.id), proposal]));
    const offers = allRows.map((row) => {
      const payload = (row.payload && typeof row.payload === 'object' ? row.payload : {}) as Record<string, unknown>;
      const ownerId = String(row.owner_id || '');
      const acceptedProposalId = String(row.accepted_proposal_id || '');
      return {
        ...payload,
        id: row.id,
        status: row.status,
        userId: ownerId === user.id ? ownerId : undefined,
        userEmail: ownerId === user.id ? row.owner_email : undefined,
        isCurrentUser: ownerId === user.id,
        acceptedProposal: proposalsById.get(acceptedProposalId) || payload.acceptedProposal,
        acceptedAt: row.accepted_at || payload.acceptedAt,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      };
    });
    const offerOwnerIds = new Set(rows.filter((row) => row.owner_id === user.id).map((row) => row.id));
    const sentProposalIds = new Set(proposals.filter((proposal) => proposal.proposerUserId === user.id).map((proposal) => proposal.id));
    const notificationResult = await db.from('rail_seat_swap_notifications')
      .select('id, offer_id, proposal_id, payload, created_at')
      .eq('recipient_id', user.id).order('created_at', { ascending: false }).limit(100);
    if (notificationResult.error) throw notificationResult.error;

    const notifications = (notificationResult.data || []).map((row) => ({
      ...(row.payload && typeof row.payload === 'object' ? row.payload : {}),
      id: row.id,
      offerId: row.offer_id,
      proposalId: row.proposal_id,
      recipientUserId: user.id,
      createdAt: row.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        offers,
        proposals,
        notifications,
        incomingOfferIds: [...offerOwnerIds],
        sentProposalIds: [...sentProposalIds],
      },
    }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: getSeatSwapErrorMessage(error) }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getSeatSwapUser(request);
  if (!user) return NextResponse.json({ success: false, error: 'Sign in to list a berth.' }, { status: 401 });
  const db = getSeatSwapAdminClient();
  if (!db) return NextResponse.json({ success: false, error: 'Shared seat swaps are not configured.' }, { status: 503 });

  try {
    const input = await request.json() as Record<string, unknown>;
    const id = typeof input.id === 'string' ? input.id.slice(0, 100) : '';
    const trainNumber = typeof input.trainNumber === 'string' ? input.trainNumber.trim() : '';
    if (!id || !/^\d{1,5}$/.test(trainNumber)) {
      return NextResponse.json({ success: false, error: 'A valid offer ID and train number are required.' }, { status: 400 });
    }
    const status = 'AVAILABLE';
    const payload = { ...input, trainNumber, status, userId: user.id, userEmail: user.email, isCurrentUser: true };
    const result = await db.from('rail_seat_swap_offers').insert({
      id,
      owner_id: user.id,
      owner_email: user.email,
      status,
      payload,
    }).select('id').single();
    if (result.error) throw result.error;
    return NextResponse.json({ success: true, data: { id: result.data.id } }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: getSeatSwapErrorMessage(error) }, { status: 503 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
