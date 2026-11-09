'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Train,
  ShieldCheck,
  Radio,
  MapPin,
  Ticket,
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

function GitHubIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function LoginCard() {
  const searchParams = useSearchParams();
  const { user, loginWithGoogle, loginWithGitHub, logout, isLoading } = useAuth();

  const [submittingGoogle, setSubmittingGoogle] = useState(false);
  const [submittingGitHub, setSubmittingGitHub] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(searchParams.get('error') || null);

  const returnTo = searchParams.get('returnTo') || searchParams.get('redirect') || '/';

  const handleGitHubSignIn = async () => {
    try {
      setSubmittingGitHub(true);
      setErrorMsg(null);
      await loginWithGitHub(returnTo);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect with GitHub');
      setSubmittingGitHub(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setSubmittingGoogle(true);
      setErrorMsg(null);
      await loginWithGoogle(returnTo);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect with Google');
      setSubmittingGoogle(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/60 mb-4 ring-2 ring-blue-400/40 bg-slate-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.svg" alt="Rail Explorer Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Rail Explorer Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-sm mx-auto">
          Sign in to sync live train status, saved rakes, PNR alerts, and 3D coach seat reservations.
        </p>
      </div>

      {/* Main Auth Container */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Decorative subtle background blur */}
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
                    {user.provider}
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
          <div className="space-y-3.5">
            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Sign-in Notice</p>
                  <p className="text-rose-300/90 text-[11px] mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* 1. Continue with GitHub Button */}
            <button
              onClick={handleGitHubSignIn}
              disabled={submittingGitHub || submittingGoogle || isLoading}
              className="w-full group flex items-center justify-center gap-3 py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-sm border border-slate-700 shadow-lg hover:border-slate-600 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {submittingGitHub ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
              ) : (
                <GitHubIcon className="w-5 h-5 text-white" />
              )}
              <span>{submittingGitHub ? 'Connecting to GitHub...' : 'Continue with GitHub'}</span>
            </button>

            {/* 2. Continue with Google Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={submittingGoogle || submittingGitHub || isLoading}
              className="w-full group flex items-center justify-center gap-3 py-3 px-5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl shadow-slate-950/50 border border-slate-200 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {submittingGoogle ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
              ) : (
                <GoogleIcon className="w-5 h-5" />
              )}
              <span>{submittingGoogle ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-3">
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
