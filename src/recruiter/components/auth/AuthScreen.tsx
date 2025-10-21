import { useState } from 'react';
import { Button } from '../../../ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/components/ui/card';
import { Input } from '../../../ui/components/ui/input';
import { Label } from '../../../ui/components/ui/label';
import { Zap, User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signIn, signUp } from '../../services/authService';
import type { Profile } from '../../../shared/services/supabase';

interface AuthScreenProps {
  onAuthenticate: (userData: Profile) => void;
}

export function AuthScreen({ onAuthenticate }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailVerificationNeeded, setEmailVerificationNeeded] = useState(false);
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
      if (mode === 'register') {
        const result = await signUp({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyName: formData.companyName
        });

        if (result.success && result.user) {
          onAuthenticate(result.user);
        } else if (result.needsEmailVerification) {
          setEmailVerificationNeeded(true);
          setError(null);
        } else {
          setError(result.error || 'Error during registration');
        }
      } else {
        const result = await signIn({
          email: formData.email,
          password: formData.password
        });

        if (result.success && result.user) {
          onAuthenticate(result.user);
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
    setEmailVerificationNeeded(false);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
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
            {mode === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta nueva'}
          </h2>
          <p className="text-muted-foreground">
            {mode === 'login' 
              ? 'Ingresa a tu cuenta para continuar' 
              : 'Únete a FirstStep para revolucionar tu reclutamiento'
            }
          </p>
        </div>

        {/* Mensaje de verificación de email */}
        {emailVerificationNeeded && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-blue-900">¡Verifica tu email!</h3>
                <p className="text-sm text-blue-700">
                  Te hemos enviado un email de verificación a <strong>{formData.email}</strong>
                </p>
                <p className="text-xs text-blue-600">
                  Haz clic en el enlace del email para activar tu cuenta y luego podrás iniciar sesión.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEmailVerificationNeeded(false)}
                  className="mt-4"
                >
                  Entendido
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulario */}
        {!emailVerificationNeeded && (
          <Card>
            <CardHeader>
              <CardTitle>
                {mode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
              </CardTitle>
              <CardDescription>
                {mode === 'login'
                  ? 'Ingresa tus credenciales para acceder'
                  : 'Completa tus datos para comenzar'
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
                disabled={loading || !formData.email || !formData.password || (mode === 'register' && (!formData.firstName || !formData.lastName))}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'login' ? 'Iniciando...' : 'Creando cuenta...'}
                  </>
                ) : (
                  mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'
                )}
              </Button>
            </form>

            {/* Cambiar modo */}
            <div className="text-center">
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
            </div>
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