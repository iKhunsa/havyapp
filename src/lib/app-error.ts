export type AppErrorCode =
  | 'INVALID_EMAIL'
  | 'WEAK_PASSWORD'
  | 'USER_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'NOT_AUTHENTICATED'
  | 'SESSION_INVALID'
  | 'STORAGE_READ_FAILED'
  | 'STORAGE_WRITE_FAILED'
  | 'RECORD_NOT_FOUND'
  | 'INVALID_INPUT'
  | 'UNKNOWN';

type AppErrorConfig = {
  code: AppErrorCode;
  message: string;
  userMessage: string;
  action?: string;
  cause?: unknown;
};

export class AppError extends Error {
  code: AppErrorCode;
  userMessage: string;
  action?: string;
  cause?: unknown;

  constructor(config: AppErrorConfig) {
    super(config.message);
    this.name = 'AppError';
    this.code = config.code;
    this.userMessage = config.userMessage;
    this.action = config.action;
    this.cause = config.cause;
  }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;

type ErrorFeedback = {
  code: AppErrorCode;
  message: string;
  action?: string;
};

const fromKnownMessage = (message: string): ErrorFeedback | null => {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials') || normalized.includes('invalid credentials')) {
    return {
      code: 'INVALID_CREDENTIALS',
      message: 'Email o contrasena incorrectos.',
      action: 'Verifica tus datos e intenta de nuevo.',
    };
  }

  if (normalized.includes('user already registered') || normalized.includes('user already exists')) {
    return {
      code: 'USER_EXISTS',
      message: 'Este email ya esta registrado.',
      action: 'Inicia sesion o usa otro email.',
    };
  }

  if (normalized.includes('email not confirmed')) {
    return {
      code: 'SESSION_INVALID',
      message: 'Tu email aun no esta confirmado.',
      action: 'Revisa tu bandeja y confirma la cuenta.',
    };
  }

  if (normalized.includes('not authenticated')) {
    return {
      code: 'NOT_AUTHENTICATED',
      message: 'Tu sesion no es valida para esta accion.',
      action: 'Inicia sesion nuevamente.',
    };
  }

  if (normalized.includes('quota') || normalized.includes('storage')) {
    return {
      code: 'STORAGE_WRITE_FAILED',
      message: 'No se pudieron guardar los cambios en este dispositivo.',
      action: 'Libera espacio o revisa permisos del navegador.',
    };
  }

  return null;
};

export const getErrorFeedback = (error: unknown, fallbackMessage: string): ErrorFeedback => {
  if (isAppError(error)) {
    return {
      code: error.code,
      message: error.userMessage,
      action: error.action,
    };
  }

  if (error instanceof Error) {
    const known = fromKnownMessage(error.message);
    if (known) return known;
    return {
      code: 'UNKNOWN',
      message: fallbackMessage,
      action: 'Intenta nuevamente en unos segundos.',
    };
  }

  return {
    code: 'UNKNOWN',
    message: fallbackMessage,
    action: 'Intenta nuevamente en unos segundos.',
  };
};
