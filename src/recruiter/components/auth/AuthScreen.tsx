import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../../ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/components/ui/card';
import { Input } from '../../../ui/components/ui/input';
import { Label } from '../../../ui/components/ui/label';
import { Zap, User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signIn, signUp, requestPasswordReset } from '../../services/authService';
import type { Profile } from '../../../shared/services/supabase';

interface AuthScreenProps {
  onAuthenticate?: (userData: Profile) => void;
}

export function AuthScreen({ onAuthenticate }: AuthScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Derivar el modo de la URL (única fuente de verdad)
  const mode: 'login' | 'register' | 'forgot-password' =
    location.pathname === '/register' ? 'register' : 'login';

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'forgot-password') {
        const result = await requestPasswordReset(formData.email);
        if (result.success) {
          setResetEmailSent(true);
          setError(null);
        } else {
          setError(result.error || 'Error al solicitar recuperación');
        }
        setLoading(false);
        return;
      }

      if (mode === 'register') {
        const result = await signUp({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyName: formData.companyName
        });

        if (result.success && result.user) {
          if (onAuthenticate) {
            onAuthenticate(result.user);
          } else {
            navigate('/');
          }
        } else {
          setError(result.error || 'Error during registration');
        }
      } else {
        const result = await signIn({
          email: formData.email,
          password: formData.password
        });

        if (result.success && result.user) {
          if (onAuthenticate) {
            onAuthenticate(result.user);
          } else {
            navigate('/');
          }
        } else {
          setError(result.error || 'Error during login');
        }
      }
    } catch (err) {
      setError('Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      companyName: '',
      email: '',
      password: ''
    });
    setError(null);
    setResetEmailSent(false);
  };

  const switchMode = () => {
    if (mode === 'login') {
      navigate('/register');
    } else {
      navigate('/login');
    }
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#353535' }}>
            <img src="/Icono-rayo-firststep.png" alt="FirstStep" className="w-10 h-10 object-contain" />
          </div>
          <span className="text-[#7572FF] text-xl font-semibold">FirstStep</span>
        </div>

        {/* Encabezado */}
        <div className="text-center">
          <h2 className="text-2xl mb-2">
            {mode === 'forgot-password' ? '¿Olvidaste tu contraseña?' : (mode === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta nueva')}
          </h2>
          <p className="text-muted-foreground">
            {mode === 'forgot-password'
              ? 'Ingresa tu email y te enviaremos un enlace para recuperar tu contraseña'
              : (mode === 'login'
                ? 'Ingresa a tu cuenta para continuar'
                : 'Únete a FirstStep para revolucionar tu reclutamiento')
            }
          </p>
        </div>

        {/* Mensaje de email de recuperación enviado */}
        {resetEmailSent && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-900">Email enviado</h3>
                <p className="text-sm text-green-700">
                  Hemos enviado un enlace de recuperación a <strong>{formData.email}</strong>
                </p>
                <p className="text-xs text-green-600">
                  Revisa tu bandeja de entrada y haz clic en el enlace para resetear tu contraseña.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setResetEmailSent(false); navigate('/login'); }}
                  className="mt-4"
                >
                  Volver al login
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulario */}
        {!resetEmailSent && (
          <Card>
            <CardHeader>
              <CardTitle>
                {mode === 'forgot-password' ? 'Recuperar Contraseña' : (mode === 'login' ? 'Iniciar Sesión' : 'Registrarse')}
              </CardTitle>
              <CardDescription>
                {mode === 'forgot-password'
                  ? 'Ingresa tu correo electrónico'
                  : (mode === 'login'
                    ? 'Ingresa tus credenciales para acceder'
                    : 'Completa tus datos para comenzar')
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campos de registro */}
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="firstName"
                        placeholder="Juan"
                        className="pl-10"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="lastName"
                        placeholder="Pérez"
                        className="pl-10"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Empresa (solo registro) */}
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="companyName">Empresa (opcional)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="companyName"
                      placeholder="Mi Empresa"
                      className="pl-10"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan@empresa.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              {/* Contraseña */}
              {mode !== 'forgot-password' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              {/* Botón principal */}
              <Button
                type="submit"
                className="w-full bg-[#7572FF] hover:bg-[#6863E8] text-white"
                size="lg"
                disabled={loading || !formData.email || (mode !== 'forgot-password' && !formData.password) || (mode === 'register' && (!formData.firstName || !formData.lastName))}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'forgot-password' ? 'Enviando...' : (mode === 'login' ? 'Iniciando...' : 'Creando cuenta...')}
                  </>
                ) : (
                  mode === 'forgot-password' ? 'Enviar enlace de recuperación' : (mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')
                )}
              </Button>
            </form>

            {/* Cambiar modo */}
            <div className="text-center">
              {mode === 'forgot-password' ? (
                <Button
                  type="button"
                  variant="link"
                  className="text-[#7572FF] font-medium p-0 h-auto"
                  onClick={() => navigate('/login')}
                  disabled={loading}
                >
                  Volver al login
                </Button>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">
                    {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                  </span>
                  <Button
                    type="button"
                    variant="link"
                    className="text-[#7572FF] font-medium ml-1 p-0 h-auto"
                    onClick={switchMode}
                    disabled={loading}
                  >
                    {mode === 'login' ? 'Crear cuenta nueva' : 'Iniciar sesión'}
                  </Button>
                </>
              )}
            </div>

            {/* Link ¿Olvidaste tu contraseña? */}
            {mode === 'login' && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-[#7572FF] font-medium p-0 h-auto"
                  onClick={() => setMode('forgot-password')}
                  disabled={loading}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Footer simple */}
        <div className="text-center text-xs text-muted-foreground">
          <p>FirstStep - Plataforma de reclutamiento inteligente</p>
        </div>
      </div>
    </div>
  );
}