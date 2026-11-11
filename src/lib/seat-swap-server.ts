import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { verifyProviderSession } from '@/lib/auth-session';

export interface SwapServerUser {
  id: string;
  email: string;
  name: string;
  provider: string;
}

let adminClient: SupabaseClient | null | undefined;

export function getSeatSwapAdminClient(): SupabaseClient | null {
  if (adminClient !== undefined) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  adminClient = url && serviceRoleKey
    ? createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    : null;
  return adminClient;
}

export function getSeatSwapUser(request: Request): SwapServerUser | null {
  const cookie = request.headers.get('cookie') || '';
  const session = cookie.match(/(?:^|;\s*)rail_session=([^;]+)/)?.[1];
  if (!session) return null;
  try {
    return verifyProviderSession(decodeURIComponent(session));
  } catch {
    return null;
  }
}

export function getSeatSwapErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (/rail_seat_swap|schema cache|does not exist|could not find the function/i.test(message)) {
    return 'Shared seat swaps are not initialized. The database migration must be applied first.';
  }
  return message || 'Seat swap service is temporarily unavailable.';
}
