import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Zap, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface AuthScreenProps {
  onAuthenticate: (userData: { firstName: string; lastName: string; email: string }) => void;
}

export function AuthScreen({ onAuthenticate }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuthenticate({
      firstName: formData.firstName || 'Usuario',
      lastName: formData.lastName || 'Demo',
      email: formData.email || 'demo@firststep.com'
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDemoAccess = () => {
    onAuthenticate({
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@firststep.com'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-[#7572FF] rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
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

        {/* Formulario */}
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

              {/* Botón principal */}
              <Button 
                type="submit" 
                className="w-full bg-[#7572FF] hover:bg-[#6863E8] text-white"
                size="lg"
              >
                {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </Button>
            </form>

            {/* Demo button */}
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleDemoAccess}
            >
              🚀 Acceso Demo Rápido
            </Button>

            {/* Cambiar modo */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Crear cuenta nueva' : 'Iniciar sesión'}
            </Button>
          </CardContent>
        </Card>

        {/* Footer simple */}
        <div className="text-center text-xs text-muted-foreground">
          <p>FirstStep - Plataforma de reclutamiento inteligente</p>
        </div>
      </div>
    </div>
  );
}