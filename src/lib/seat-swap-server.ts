import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { verifyProviderSession } from '@/lib/auth-session';

export interface SwapServerUser {
  id: string;
  email: string;
  name: string;
  provider: string;
}

let adminClient: SupabaseClient | null | undefined;
let authClient: SupabaseClient | null | undefined;

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

export async function getSeatSwapUser(request: Request): Promise<SwapServerUser | null> {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    const cookie = request.headers.get('cookie') || '';
    const session = cookie.match(/(?:^|;\s*)rail_session=([^;]+)/)?.[1];
    if (!session) return null;
    try {
      return verifyProviderSession(decodeURIComponent(session));
    } catch {
      return null;
    }
  }
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null;
    if (authClient === undefined) {
      authClient = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
    }
    if (!authClient) return null;
    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data.user?.id || !data.user.email) return null;
    const profile = data.user;
    const email = profile.email;
    if (!email) return null;
    const rawProvider = String(profile.app_metadata?.provider || 'supabase');
    return {
      id: profile.id,
      email,
      name: String(profile.user_metadata?.full_name || profile.user_metadata?.name || profile.user_metadata?.user_name || email.split('@')[0] || 'Passenger'),
      provider: rawProvider,
    };
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
