import { createContext } from 'react';
import type { User, AuthResponse } from '@/types/auth';

export type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
