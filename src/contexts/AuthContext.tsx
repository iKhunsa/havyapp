import { useEffect, useState, type ReactNode } from 'react';
import type { User, AuthResponse } from '@/types/auth';
import { AuthContext, type AuthContextValue } from '@/contexts/auth-context';
import { AppError, isAppError } from '@/lib/app-error';

const TOKEN_KEY = 'auth_token';
const LOCAL_USERS_KEY = 'local_auth_users_v1';
const LOCAL_SESSION_KEY = 'local_auth_session_v1';

type LocalUser = User & { password: string; createdAt: string };

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LOCAL_SESSION_KEY);
};

const readUsers = (): LocalUser[] => {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new AppError({
        code: 'STORAGE_READ_FAILED',
        message: 'Stored users data is malformed',
        userMessage: 'No pudimos leer tus usuarios guardados.',
        action: 'Recarga la app. Si persiste, borra datos locales del sitio.',
      });
    }
    return parsed as LocalUser[];
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw new AppError({
      code: 'STORAGE_READ_FAILED',
      message: 'Unable to read local users from storage',
      userMessage: 'No pudimos acceder al almacenamiento local.',
      action: 'Revisa permisos del navegador y vuelve a intentar.',
      cause: error,
    });
  }
};

const writeUsers = (users: LocalUser[]) => {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (error) {
    throw new AppError({
      code: 'STORAGE_WRITE_FAILED',
      message: 'Unable to persist local users',
      userMessage: 'No pudimos guardar la cuenta en este dispositivo.',
      action: 'Libera espacio en el navegador e intenta nuevamente.',
      cause: error,
    });
  }
};

const createToken = (userId: string) => `local-${userId}-${Date.now().toString(36)}`;

const createUserId = () => `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function useProvideAuth(): AuthContextValue {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const sessionRaw = localStorage.getItem(LOCAL_SESSION_KEY);

    if (!storedToken || !sessionRaw) {
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const session = JSON.parse(sessionRaw) as { token: string; userId: string };
      const users = readUsers();
      const localUser = users.find((item) => item.id === session.userId);

      if (!localUser || session.token !== storedToken) {
        clearSession();
        setToken(null);
        setUser(null);
      } else {
        setToken(storedToken);
        setUser({ id: localUser.id, email: localUser.email });
      }
    } catch {
      clearSession();
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
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

    const users = readUsers();
    const exists = users.some((item) => item.email === normalizedEmail);
    if (exists) {
      throw new AppError({
        code: 'USER_EXISTS',
        message: 'User already exists',
        userMessage: 'Este email ya esta registrado.',
        action: 'Inicia sesion o usa otro email.',
      });
    }

    const newUser: LocalUser = {
      id: createUserId(),
      email: normalizedEmail,
      password,
      createdAt: new Date().toISOString(),
    };

    writeUsers([...users, newUser]);

    return {
      user: { id: newUser.id, email: newUser.email },
      token: '',
    };
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

    const users = readUsers();
    const localUser = users.find((item) => item.email === normalizedEmail);

    if (!localUser || localUser.password !== password) {
      throw new AppError({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
        userMessage: 'Email o contrasena incorrectos.',
        action: 'Verifica tus credenciales e intenta de nuevo.',
      });
    }

    const authToken = createToken(localUser.id);
    const authUser: User = { id: localUser.id, email: localUser.email };

    try {
      localStorage.setItem(TOKEN_KEY, authToken);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ token: authToken, userId: localUser.id }));
    } catch (error) {
      throw new AppError({
        code: 'STORAGE_WRITE_FAILED',
        message: 'Unable to write auth session into storage',
        userMessage: 'No pudimos guardar tu sesion.',
        action: 'Revisa permisos del navegador y vuelve a intentar.',
        cause: error,
      });
    }

    setToken(authToken);
    setUser(authUser);
  };

  const signOut = async () => {
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
