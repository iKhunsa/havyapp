import { useEffect, useState, type ReactNode } from 'react';
import type { User, AuthResponse } from '@/types/auth';
import { AuthContext, type AuthContextValue } from '@/contexts/auth-context';
import { AppError } from '@/lib/app-error';
import { getApiUrl } from '@/lib/api-url';

const TOKEN_KEY = 'auth_token';
const API_URL = getApiUrl();
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
};

async function requestAuth<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/auth${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = 'Authentication request failed';
    try {
      const payload = await response.json();
      if (payload?.error) message = payload.error;
    } catch {
      // no-op
    }

    throw new AppError({
      code: 'UNKNOWN',
      message,
      userMessage: 'No pudimos completar la autenticacion.',
      action: 'Verifica tus credenciales o vuelve a intentar.',
    });
  }

  return response.json() as Promise<T>;
}

function useProvideAuth(): AuthContextValue {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (!storedToken) {
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    const hydrate = async () => {
      try {
        const response = await requestAuth<{ user: User }>('/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        setToken(storedToken);
        setUser(response.user);
      } catch {
        clearSession();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void hydrate();
  }, []);

  const signUp = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      throw new AppError({
        code: 'INVALID_EMAIL',
        message: 'Invalid email format',
        userMessage: 'El email no tiene un formato valido.',
        action: 'Usa un formato como nombre@dominio.com.',
      });
    }
    if (password.length < 6) {
      throw new AppError({
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 6 characters',
        userMessage: 'La contrasena debe tener al menos 6 caracteres.',
        action: 'Prueba con una contrasena mas larga.',
      });
    }

    const response = await requestAuth<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    localStorage.setItem(TOKEN_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
    return response;
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      throw new AppError({
        code: 'INVALID_EMAIL',
        message: 'Invalid email format',
        userMessage: 'El email no tiene un formato valido.',
        action: 'Verifica el email antes de continuar.',
      });
    }

    const response = await requestAuth<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    localStorage.setItem(TOKEN_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
  };

  const signOut = async () => {
    if (token) {
      try {
        await requestAuth<{ message: string }>('/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // best effort
      }
    }

    try {
      clearSession();
    } catch (error) {
      throw new AppError({
        code: 'STORAGE_WRITE_FAILED',
        message: 'Unable to clear auth session from storage',
        userMessage: 'No pudimos cerrar la sesion correctamente.',
        action: 'Recarga la pagina y vuelve a intentarlo.',
        cause: error,
      });
    }

    setToken(null);
    setUser(null);
  };

  return {
    user,
    token,
    loading,
    signUp,
    signIn,
    signOut,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
