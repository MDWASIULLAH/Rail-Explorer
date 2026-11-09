'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Train, Loader2 } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<string>('Verifying Google credentials with Indian Railways Platform...');

  useEffect(() => {
    async function handleAuth() {
      if (!supabase) {
        router.replace('/');
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[Supabase callback error]', error);
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }

        if (session) {
          setStatus('Authentication verified. Redirecting to your dashboard...');
          const returnTo = searchParams.get('returnTo') || '/';
          router.replace(returnTo);
          return;
        }

        // Wait a second for hash parsing
        setTimeout(async () => {
          if (!supabase) {
            router.replace('/');
            return;
          }
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            router.replace(searchParams.get('returnTo') || '/');
          } else {
            router.replace('/login');
          }
        }, 1200);
      } catch (err: any) {
        console.error('[Auth Exception]', err);
        router.replace('/login');
      }
    }

    handleAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mb-6">
        <Train className="w-8 h-8 text-blue-400 animate-pulse" />
      </div>
      <div className="flex items-center gap-3 text-slate-300 font-semibold mb-2">
        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        <span>{status}</span>
      </div>
      <p className="text-xs text-slate-500">Security handshake: RDSO IRCTC OAuth 2.0</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
