import { useContext } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthContext } from '@/contexts/auth-context';

export { AuthProvider };

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
