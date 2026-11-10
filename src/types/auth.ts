export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'google' | 'github' | 'linkedin' | 'supabase';
  createdAt?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  loginWithGoogle: (redirectTo?: string) => Promise<void>;
  loginWithGitHub: (redirectTo?: string) => Promise<void>;
  loginWithLinkedIn: (redirectTo?: string) => Promise<void>;
  logout: () => Promise<void>;
}
