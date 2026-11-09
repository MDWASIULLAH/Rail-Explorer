'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, AuthContextType } from '@/types/auth';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'rail_user_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync state with cookie/localStorage
  const persistSession = useCallback((profile: UserProfile | null) => {
    setUser(profile);
    if (typeof window !== 'undefined') {
      if (profile) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
        // Also set client-readable cookie so SSR/API knows
        document.cookie = `rail_session=${encodeURIComponent(JSON.stringify(profile))}; path=/; max-age=2592000; SameSite=Lax`;
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        document.cookie = `rail_session=; path=/; max-age=0; SameSite=Lax`;
      }
    }
  }, []);

  // Hydrate on mount
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // 1. Check localStorage first for instant UI response
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed?.email && mounted) {
                setUser(parsed);
              }
            } catch {
              localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
          }
        }

        // 2. Check Supabase session if initialized
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            const sbUser: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Passenger',
              avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
              provider: 'supabase',
              createdAt: session.user.created_at,
            };
            persistSession(sbUser);
            setIsLoading(false);
            return;
          }

          // Listen for Supabase auth events
          supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              const sbUser: UserProfile = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Passenger',
                avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
                provider: 'supabase',
                createdAt: session.user.created_at,
              };
              persistSession(sbUser);
            }
          });
        }

        // 3. Fallback to /api/auth/me to check HTTP cookie
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data?.user && mounted) {
            persistSession(data.user);
          }
        }
      } catch (err) {
        console.error('[Auth Init Error]', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, [persistSession]);

  // Standard Google OAuth redirect
  const loginWithGoogle = useCallback((redirectTo?: string) => {
    const target = redirectTo || (typeof window !== 'undefined' ? window.location.pathname : '/');
    window.location.href = `/api/auth/google/start?returnTo=${encodeURIComponent(target)}`;
  }, []);

  // Supabase Google OAuth
  const loginWithSupabaseGoogle = useCallback(async (redirectTo?: string) => {
    if (!supabase) {
      return { error: 'Supabase client is not configured' };
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://railexplorer.vercel.app';
    const callbackUrl = `${origin}/auth/callback?returnTo=${encodeURIComponent(redirectTo || '/')}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    });
    if (error) {
      return { error: error.message };
    }
    return {};
  }, []);

  // Demo user login for testing without Google Cloud Console hurdles
  const loginAsDemo = useCallback(() => {
    const demoUser: UserProfile = {
      id: 'demo_user_irctc',
      email: 'passenger@railexplorer.in',
      name: 'Mohammad Wasiullah',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      provider: 'demo',
      createdAt: new Date().toISOString(),
    };
    persistSession(demoUser);
  }, [persistSession]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors
    }
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore errors
      }
    }
    persistSession(null);
  }, [persistSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithGoogle,
        loginWithSupabaseGoogle,
        loginAsDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
