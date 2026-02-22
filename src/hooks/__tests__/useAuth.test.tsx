import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../useAuth';
import type { ReactNode } from 'react';

describe('useAuth backend mode', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  const users = new Map<string, { id: string; email: string; password: string }>();
  const sessions = new Map<string, string>();

  const makeResponse = (status: number, body: unknown) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

  const parseBody = (init?: RequestInit) => {
    if (!init?.body || typeof init.body !== 'string') return {};
    try {
      return JSON.parse(init.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  };

  const nextId = () => `u_${Math.random().toString(36).slice(2, 10)}`;

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const payload = parseBody(init);
    const authHeader = (init?.headers as Record<string, string> | undefined)?.Authorization;

    if (url.endsWith('/api/auth/register') && method === 'POST') {
      const email = String(payload.email ?? '').toLowerCase();
      const password = String(payload.password ?? '');
      if (users.has(email)) {
        return makeResponse(400, { error: 'User already exists' });
      }
      const id = nextId();
      users.set(email, { id, email, password });
      const token = `test-token-${id}`;
      sessions.set(token, id);
      return makeResponse(201, { user: { id, email }, token });
    }

    if (url.endsWith('/api/auth/login') && method === 'POST') {
      const email = String(payload.email ?? '').toLowerCase();
      const password = String(payload.password ?? '');
      const user = users.get(email);
      if (!user || user.password !== password) {
        return makeResponse(401, { error: 'Invalid credentials' });
      }
      const token = `test-token-${user.id}`;
      sessions.set(token, user.id);
      return makeResponse(200, { user: { id: user.id, email: user.email }, token });
    }

    if (url.endsWith('/api/auth/me') && method === 'GET') {
      const token = authHeader?.replace('Bearer ', '') ?? '';
      const userId = sessions.get(token);
      if (!userId) return makeResponse(401, { error: 'Invalid token' });
      const user = Array.from(users.values()).find((item) => item.id === userId);
      if (!user) return makeResponse(401, { error: 'Invalid token' });
      return makeResponse(200, { user: { id: user.id, email: user.email } });
    }

    if (url.endsWith('/api/auth/logout') && method === 'POST') {
      return makeResponse(200, { message: 'Logged out successfully' });
    }

    return makeResponse(404, { error: 'Not found' });
  });

  beforeEach(() => {
    users.clear();
    sessions.clear();
    localStorage.clear();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('initializes unauthenticated when no session exists', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('registers and then logs in a user in local auth store', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let register;
    await act(async () => {
      register = await result.current.signUp('new@example.com', 'password123');
    });
    expect(register?.user.email).toBe('new@example.com');

    await act(async () => {
      await result.current.signIn('new@example.com', 'password123');
    });

    expect(result.current.user?.email).toBe('new@example.com');
    expect(localStorage.getItem('auth_token')).toContain('test-token-');
  });

  it('rejects duplicate registrations', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signUp('dup@example.com', 'password123');
    });

    await expect(result.current.signUp('dup@example.com', 'password123')).rejects.toThrow('User already exists');
  });

  it('rejects invalid credentials on sign in', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signUp('auth@example.com', 'password123');
    });
    await expect(result.current.signIn('auth@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
  });

  it('restores session from local storage', async () => {
    const first = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(first.result.current.loading).toBe(false);
    });

    await act(async () => {
      await first.result.current.signUp('restore@example.com', 'password123');
      await first.result.current.signIn('restore@example.com', 'password123');
    });
    first.unmount();

    const second = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(second.result.current.loading).toBe(false);
    });

    expect(second.result.current.user?.email).toBe('restore@example.com');
  });

  it('signs out and clears session', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signUp('logout@example.com', 'password123');
      await result.current.signIn('logout@example.com', 'password123');
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});
