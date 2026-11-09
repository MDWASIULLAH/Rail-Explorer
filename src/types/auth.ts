export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'google' | 'github' | 'supabase' | 'demo';
  createdAt?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  loginWithGoogle: (redirectTo?: string) => void;
  loginWithGitHub: (redirectTo?: string) => void;
  loginWithSupabaseGoogle: (redirectTo?: string) => Promise<{ error?: string }>;
  loginWithSupabaseGitHub: (redirectTo?: string) => Promise<{ error?: string }>;
  loginAsDemo: () => void;
  logout: () => Promise<void>;
}
