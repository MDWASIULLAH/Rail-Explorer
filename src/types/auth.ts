export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'google' | 'github' | 'supabase';
  createdAt?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  loginWithGoogle: (redirectTo?: string) => Promise<void>;
  loginWithGitHub: (redirectTo?: string) => Promise<void>;
  logout: () => Promise<void>;
}
