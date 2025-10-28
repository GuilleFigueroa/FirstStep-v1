import { useState } from 'react';
import { Button } from '../../ui/components/ui/button';
import { Input } from '../../ui/components/ui/input';
import { Label } from '../../ui/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/components/ui/card';
import { 
  ArrowLeft,
  Zap,
  Linkedin,
  Mail,
  User,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface JobInfo {
  title: string;
  company: string;
  description?: string;
  processId: string;
}

interface CandidateData {
  firstName: string;
  lastName: string;
  email: string;
  linkedin: string;
}

interface CandidateRegistrationProps {
  jobInfo: JobInfo;
  onBack: () => void;
  onContinue: (candidateData: CandidateData) => void;
  loading?: boolean;
  error?: string | null;
}

export function CandidateRegistration({ jobInfo, onBack, onContinue, loading = false, error }: CandidateRegistrationProps) {
  const [formData, setFormData] = useState<CandidateData>({
    firstName: '',
    lastName: '',
    email: '',
    linkedin: ''
  });

  const [errors, setErrors] = useState<Partial<CandidateData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<CandidateData> = {};

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

    if (!formData.linkedin.trim()) {
      newErrors.linkedin = 'El LinkedIn es obligatorio';
    } else if (!isValidLinkedInUrl(formData.linkedin)) {
      newErrors.linkedin = 'Por favor ingresa una URL de LinkedIn válida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidLinkedInUrl = (url: string): boolean => {
    const linkedInRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|profile)\/[a-zA-Z0-9-]+\/?$/;
    return linkedInRegex.test(url) || url.startsWith('linkedin.com/in/') || url.includes('linkedin.com/in/');
  };

  const handleInputChange = (field: keyof CandidateData, value: string) => {
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

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    onContinue(formData);
    setIsSubmitting(false);
  };

  const formatLinkedInUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('linkedin.com')) return `https://${url}`;
    if (url.startsWith('www.linkedin.com')) return `https://${url}`;
    return `https://linkedin.com/in/${url.replace(/^\/+/, '')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <img
                src="/firststep-logo.png"
                alt="FirstStep"
                className="h-10"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-2xl">Postulación</h1>
            <div className="space-y-1">
              <h2 className="text-xl">{jobInfo.title}</h2>
              <p className="text-muted-foreground">{jobInfo.company}</p>
            </div>
          </div>

          {/* Registration Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Datos del Candidato
                </CardTitle>
                <CardDescription>
                  Completa tus datos para continuar con la postulación
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
                      Email *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu.email@ejemplo.com"
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

                  <div className="space-y-2">
                    <Label htmlFor="linkedin">
                      LinkedIn *
                    </Label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="linkedin"
                        type="url"
                        placeholder="linkedin.com/in/tu-perfil"
                        className={`pl-10 ${errors.linkedin ? 'border-red-500' : ''}`}
                        value={formData.linkedin}
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                      />
                    </div>
                    {errors.linkedin && (
                      <div className="flex items-center gap-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {errors.linkedin}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Ingresa el link de tu perfil así nos podemos contactar con vos.
                    </p>
                  </div>

                  {/* Error de duplicado */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Button
                      type="submit"
                      className="w-full bg-[#7572FF] hover:bg-[#6863E8] text-white"
                      disabled={isSubmitting || loading}
                    >
                      {isSubmitting || loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          {loading ? 'Verificando...' : 'Registrando...'}
                        </>
                      ) : (
                        <>
                          Continuar
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}