import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { getErrorFeedback } from '@/lib/app-error';

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Mínimo 6 caracteres' }),
});

const registerSchema = loginSchema.extend({
  confirmPassword: z.string().min(6, { message: 'Mínimo 6 caracteres' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export function LoginPage() {
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const { text, language, toggleLanguage } = useLanguage();
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const schema = isRegister ? registerSchema : loginSchema;
    const result = schema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast({
        title: text('Formulario invalido', 'Invalid form'),
        description: text('Revisa los campos marcados antes de continuar.', 'Please review highlighted fields before continuing.'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        await signUp(formData.email.trim(), formData.password);
        toast({
          title: text('Cuenta creada', 'Account created'),
          description: text('Ya puedes iniciar sesion con tus credenciales.', 'You can now sign in with your credentials.'),
        });
        setIsRegister(false);
        setFormData({ email: formData.email, password: '', confirmPassword: '' });
      } else {
        await signIn(formData.email.trim(), formData.password);
        toast({
          title: text('Sesion iniciada', 'Signed in'),
          description: text('Bienvenido de nuevo.', 'Welcome back.'),
        });
      }
    } catch (error: unknown) {
      const fallback = isRegister
        ? text('No pudimos crear la cuenta.', 'Could not create your account.')
        : text('No pudimos iniciar sesion.', 'Could not sign you in.');
      const feedback = getErrorFeedback(error, fallback);

      toast({
        title: isRegister
          ? text('No se pudo crear la cuenta', 'Account creation failed')
          : text('No se pudo iniciar sesion', 'Sign in failed'),
        description: feedback.action ? `${feedback.message} ${feedback.action}` : feedback.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <img src="/logo.svg" alt="DinoFit" className="w-56 sm:w-64 mx-auto object-contain" />
          <p className="text-muted-foreground text-sm">
            {isRegister ? text('Crea tu cuenta', 'Create your account') : text('Inicia sesion para continuar', 'Sign in to continue')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
              <Label htmlFor="email">{text('Email', 'Email')}</Label>
            <Input
              id="email"
              type="email"
                placeholder={text('tu@email.com', 'you@email.com')}
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isLoading}
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{text('Contrasena', 'Password')}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isLoading}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          {isRegister && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{text('Confirmar contrasena', 'Confirm password')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isRegister ? (
              text('Crear cuenta', 'Create account')
            ) : (
              text('Iniciar sesion', 'Sign in')
            )}
          </Button>
        </form>

        {/* Toggle mode */}
        <p className="text-sm text-center text-muted-foreground">
          {isRegister ? text('Ya tienes cuenta?', 'Already have an account?') : text('No tienes cuenta?', "Don't have an account?")}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrors({});
              setFormData({ email: '', password: '', confirmPassword: '' });
            }}
            className="text-primary hover:underline font-medium"
          >
            {isRegister ? text('Inicia sesion', 'Sign in') : text('Registrate', 'Sign up')}
          </button>
        </p>

        <p className="text-xs text-center text-muted-foreground">
          {text('Tus datos estan protegidos y solo tu puedes verlos.', 'Your data is protected and only you can see it.')}
        </p>

        <button
          type="button"
          onClick={toggleLanguage}
          className="mx-auto block text-xs text-muted-foreground hover:text-foreground"
        >
          {text('Idioma', 'Language')}: {language.toUpperCase()}
        </button>
      </div>
    </div>
  );
}
