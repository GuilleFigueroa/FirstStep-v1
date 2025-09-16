import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Zap, Mail, User, AlertCircle } from 'lucide-react';

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
}

interface AuthScreenProps {
  onAuthenticate: (userData: UserData) => void;
}

export function AuthScreen({ onAuthenticate }: AuthScreenProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  const [errors, setErrors] = useState<Partial<UserData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<UserData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Por favor ingresa un email válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof UserData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate authentication
    await new Promise(resolve => setTimeout(resolve, 1000));

    onAuthenticate(formData);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#7572FF] rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <span className="text-[#7572FF] text-2xl font-semibold">FirstStep</span>
          </div>
          <h1 className="text-2xl mb-2">Panel de Reclutador</h1>
          <p className="text-muted-foreground">
            Ingresa tus datos para acceder a tu panel de gestión
          </p>
        </div>

        {/* Auth Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Datos del Reclutador
            </CardTitle>
            <CardDescription>
              Completa la información para acceder al sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    Nombre *
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Tu nombre"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      {errors.firstName}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Apellido *
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Tu apellido"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      {errors.lastName}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Corporativo *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu.email@empresa.com"
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#7572FF] hover:bg-[#6863E8] text-white mt-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Validando...
                  </>
                ) : (
                  'Acceder al Panel'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            FirstStep - Panel de Reclutamiento • Versión Demo
          </p>
        </div>
      </div>
    </div>
  );
}