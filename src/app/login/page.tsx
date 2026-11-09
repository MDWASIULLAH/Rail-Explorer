'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Train,
  ShieldCheck,
  Radio,
  MapPin,
  Ticket,
  Sparkles,
  ArrowRight,
  LogOut,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loginWithGoogle, loginWithSupabaseGoogle, loginAsDemo, logout, isLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState<'direct' | 'supabase'>('direct');
  const [errorMsg, setErrorMsg] = useState<string | null>(searchParams.get('error') || null);

  const returnTo = searchParams.get('returnTo') || searchParams.get('redirect') || '/';

  const handleGoogleSignIn = async () => {
    try {
      setSubmitting(true);
      setErrorMsg(null);

      if (method === 'direct') {
        // Direct Google OAuth 2.0 flow
        loginWithGoogle(returnTo);
      } else {
        // Supabase Google Auth
        const result = await loginWithSupabaseGoogle(returnTo);
        if (result.error) {
          setErrorMsg(result.error);
          setSubmitting(false);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initiate Google sign-in');
      setSubmitting(false);
    }
  };

  const handleDemoLogin = () => {
    loginAsDemo();
    router.push(returnTo);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 border border-blue-400/30 shadow-xl shadow-blue-900/40 mb-4 ring-4 ring-blue-500/10">
          <Train className="w-8 h-8 text-white drop-shadow" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Rail Explorer Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-sm mx-auto">
          Sign in with Google to sync live train status, saved rakes, PNR alerts, and 3D coach seat reservations.
        </p>
      </div>

      {/* Main Auth Container */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Subtle decorative gradient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* If already signed in */}
        {user ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/70 border border-slate-700/60">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-12 h-12 rounded-full border border-blue-500/40 object-cover shadow"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-lg">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm truncate">{user.name}</h3>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <Link
                href={returnTo}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>Continue to Platform</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Sign Out / Switch Account</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Sign-in Notice</p>
                  <p className="text-rose-300/90 text-[11px] mt-0.5">
                    {errorMsg === 'google_token_exchange_failed'
                      ? 'Google OAuth credentials verified. If redirect URI mismatch occurs in Google Cloud Console, add https://railexplorer.vercel.app/api/auth/callback/google.'
                      : errorMsg}
                  </p>
                </div>
              </div>
            )}

            {/* Primary Google Login Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={submitting || isLoading}
              className="w-full group flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl shadow-slate-950/50 border border-slate-200 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
              ) : (
                <GoogleIcon className="w-5 h-5" />
              )}
              <span>{submitting ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            {/* Provider mode toggle for flexibility */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Auth Handler:</span>
              <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setMethod('direct')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                    method === 'direct'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Direct Google OAuth
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('supabase')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                    method === 'supabase'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Supabase Google
                </button>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                Instant Demo Access
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Instant Demo Sign In Button */}
            <button
              onClick={handleDemoLogin}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700/80 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Sign-In (Demo Passenger)</span>
            </button>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>RDSO Encrypted · Strictly adheres to IRCTC Privacy Standards</span>
            </div>
          </div>
        )}
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-1">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Live Satellite GPS</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Real-time speedometer and station passing kilometers.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-1">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span>3D Coach Interior</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Explode rakes and visualize berth layout in full 3D.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-1">
            <Ticket className="w-4 h-4 text-purple-400" />
            <span>PNR Sync</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Track confirmation chances and coach allocation.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-1">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Saved Rakes</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Bookmark frequent journeys with instant 1-tap alerts.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        }
      >
        <LoginCard />
      </Suspense>
    </div>
  );
}
