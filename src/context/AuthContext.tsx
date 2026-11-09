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
        // 1. Check localStorage first
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

        // 2. Check Supabase session
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            const provider = (session.user.app_metadata?.provider as any) || 'supabase';
            const sbUser: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              name:
                session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                session.user.user_metadata?.user_name ||
                session.user.email?.split('@')[0] ||
                'Passenger',
              avatarUrl:
                session.user.user_metadata?.avatar_url ||
                session.user.user_metadata?.picture ||
                '',
              provider: provider === 'github' ? 'github' : provider === 'google' ? 'google' : 'supabase',
              createdAt: session.user.created_at,
            };
            persistSession(sbUser);
            setIsLoading(false);
            return;
          }

          // Listen for Supabase auth state change events
          supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              const provider = (session.user.app_metadata?.provider as any) || 'supabase';
              const sbUser: UserProfile = {
                id: session.user.id,
                email: session.user.email || '',
                name:
                  session.user.user_metadata?.full_name ||
                  session.user.user_metadata?.name ||
                  session.user.user_metadata?.user_name ||
                  session.user.email?.split('@')[0] ||
                  'Passenger',
                avatarUrl:
                  session.user.user_metadata?.avatar_url ||
                  session.user.user_metadata?.picture ||
                  '',
                provider: provider === 'github' ? 'github' : provider === 'google' ? 'google' : 'supabase',
                createdAt: session.user.created_at,
              };
              persistSession(sbUser);
            } else if (_event === 'SIGNED_OUT') {
              persistSession(null);
            }
          });
        }

        // 3. Fallback to /api/auth/me
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

  // Google OAuth via Supabase
  const loginWithGoogle = useCallback(async (redirectTo?: string) => {
    if (!supabase) {
      console.error('[Auth] Supabase client is not available');
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://railexplorer.vercel.app';
    const callbackUrl = `${origin}/auth/callback?returnTo=${encodeURIComponent(redirectTo || '/')}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    if (error) {
      console.error('[Supabase Google Error]', error.message);
      throw error;
    }
    if (data?.url) {
      window.location.href = data.url;
    }
  }, []);

  // GitHub OAuth via Supabase
  const loginWithGitHub = useCallback(async (redirectTo?: string) => {
    if (!supabase) {
      console.error('[Auth] Supabase client is not available');
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://railexplorer.vercel.app';
    const callbackUrl = `${origin}/auth/callback?returnTo=${encodeURIComponent(redirectTo || '/')}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: callbackUrl,
      },
    });
    if (error) {
      console.error('[Supabase GitHub Error]', error.message);
      throw error;
    }
    if (data?.url) {
      window.location.href = data.url;
    }
  }, []);

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
        // Ignore
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
        loginWithGitHub,
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
