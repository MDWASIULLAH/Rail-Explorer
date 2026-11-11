export interface NtesBundle {
  status: Record<string, unknown> & {
    status?: string;
    journeyDate?: string;
    trainNumber?: string;
    source?: string;
  };
  schedule: Record<string, unknown> & { stations?: unknown[] };
  route: Record<string, unknown> & { stations?: unknown[] };
  source: 'NTES';
  checkedAt: string;
}

/** Reads only the public NTES running-status/schedule payload through our bounded adapter. */
export async function getNtesTrainBundle(
  origin: string,
  trainNumber: string,
  journeyDate: string,
): Promise<NtesBundle | null> {
  if (process.env.VERCEL !== '1') return null;

  const endpoint = new URL('/api/ntes_train', origin);
  endpoint.searchParams.set('train', trainNumber);
  endpoint.searchParams.set('date', journeyDate);
  try {
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const body = await response.json() as { success?: boolean; data?: NtesBundle };
    const bundle = body.data;
    if (!body.success || !bundle || bundle.source !== 'NTES' || !bundle.status || !bundle.schedule?.stations?.length) {
      return null;
    }
    return bundle;
  } catch {
    return null;
  }
}
