import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { LoginPage } from '../Login';

const signInMock = vi.fn();
const signUpMock = vi.fn();
const toastMock = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: signInMock,
    signUp: signUpMock,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'es',
    setLanguage: vi.fn(),
    toggleLanguage: vi.fn(),
    text: (spanish: string, _english: string) => spanish,
    locale: 'es-ES',
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    signInMock.mockReset();
    signUpMock.mockReset();
    toastMock.mockReset();
  });

  it('submits login with valid credentials', async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Contrasena'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesion' }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('blocks register submit with invalid form', async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Registrate' }));
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'correo-invalido' },
    });
    fireEvent.change(screen.getByLabelText('Contrasena'), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar contrasena'), {
      target: { value: '321' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => {
      expect(signUpMock).not.toHaveBeenCalled();
    });
  });
});
