import { NextResponse } from 'next/server';
import { getSeatSwapAdminClient, getSeatSwapErrorMessage, getSeatSwapUser } from '@/lib/seat-swap-server';

export async function POST(request: Request) {
  const user = getSeatSwapUser(request);
  if (!user) return NextResponse.json({ success: false, error: 'Sign in to sync your saved berth listings.' }, { status: 401 });
  const db = getSeatSwapAdminClient();
  if (!db) return NextResponse.json({ success: false, error: 'Shared seat swaps are not configured.' }, { status: 503 });

  try {
    const input = await request.json() as { offers?: unknown };
    const offers = Array.isArray(input.offers) ? input.offers.slice(0, 50) : [];
    const eligible = offers.filter((value): value is Record<string, unknown> => Boolean(value && typeof value === 'object'))
      .filter((offer) => offer.isCurrentUser === true && typeof offer.id === 'string' && typeof offer.trainNumber === 'string' && /^\d{1,5}$/.test(offer.trainNumber) && offer.status !== 'SWAP_ACCEPTED');

    // Upsert is intentionally disabled: an existing listing must never be claimed by a different account.
    const existing = eligible.length
      ? await db.from('rail_seat_swap_offers').select('id').in('id', eligible.map((offer) => String(offer.id)))
      : { data: [], error: null };
    if (existing.error) throw existing.error;
    const existingIds = new Set((existing.data || []).map((row) => row.id));
    const rows = eligible.filter((offer) => !existingIds.has(String(offer.id))).map((offer) => ({
      id: String(offer.id).slice(0, 100),
      owner_id: user.id,
      owner_email: user.email,
      status: 'AVAILABLE',
      payload: { ...offer, status: 'AVAILABLE', userId: user.id, userEmail: user.email, isCurrentUser: true },
    }));
    if (rows.length) {
      const inserted = await db.from('rail_seat_swap_offers').insert(rows);
      if (inserted.error) throw inserted.error;
    }
    return NextResponse.json({ success: true, data: { imported: rows.length, skipped: eligible.length - rows.length } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: getSeatSwapErrorMessage(error) }, { status: 503 });
  }
}
