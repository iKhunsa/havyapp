import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../useAuth';
import type { ReactNode } from 'react';

describe('useAuth local mode', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    localStorage.clear();
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
    expect(localStorage.getItem('auth_token')).toContain('local-');
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
