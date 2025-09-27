import { Button } from '../../ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/components/ui/card';
import { Badge } from '../../ui/components/ui/badge';
import { 
  Zap, 
  Users, 
  UserCheck, 
  ArrowRight,
  Building2,
  FileUser,
  Target,
  Search
} from 'lucide-react';

interface RoleSelectionProps {
  onRoleSelect: (role: 'recruiter' | 'candidate') => void;
}

export function RoleSelection({ onRoleSelect }: RoleSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#7572FF] rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-[#7572FF] text-2xl font-semibold">FirstStep</span>
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                Demo
              </Badge>
            </div>
          </div>

          <div>
            <h1 className="text-3xl mb-3">
              Bienvenido a FirstStep
            </h1>
            <p className="text-muted-foreground text-lg">
              Selecciona tu rol para acceder a la plataforma de reclutamiento inteligente
            </p>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Reclutador Card */}
          <Card className="relative overflow-hidden border-2 hover:border-[#7572FF] transition-all duration-200 hover:shadow-lg group cursor-pointer">
            <div className="absolute top-4 right-4">
              <div className="w-10 h-10 bg-[#7572FF]/10 rounded-full flex items-center justify-center group-hover:bg-[#7572FF]/20 transition-colors">
                <Users className="w-5 h-5 text-[#7572FF]" />
              </div>
            </div>
            
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-6 h-6 text-[#7572FF]" />
                <CardTitle className="text-xl">Panel de Reclutador</CardTitle>
              </div>
              <CardDescription className="text-base">
                Gestiona procesos de selección, evalúa candidatos y optimiza tu reclutamiento con IA
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#7572FF] rounded-full"></div>
                  <span className="text-sm text-gray-600">Configuración de perfiles ideales</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#7572FF] rounded-full"></div>
                  <span className="text-sm text-gray-600">Análisis automático de CVs</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#7572FF] rounded-full"></div>
                  <span className="text-sm text-gray-600">Dashboard de candidatos</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#7572FF] rounded-full"></div>
                  <span className="text-sm text-gray-600">Gestión de postulaciones activas</span>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={() => onRoleSelect('recruiter')}
                  className="w-full bg-[#7572FF] hover:bg-[#6863E8] text-white group"
                  size="lg"
                >
                  <span>Acceder como Reclutador</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Candidato Card */}
          <Card className="relative overflow-hidden border-2 hover:border-[#7572FF] transition-all duration-200 hover:shadow-lg group cursor-pointer">
            <div className="absolute top-4 right-4">
              <div className="w-10 h-10 bg-[#7572FF]/10 rounded-full flex items-center justify-center group-hover:bg-[#7572FF]/20 transition-colors">
                <UserCheck className="w-5 h-5 text-[#7572FF]" />
              </div>
            </div>
            
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <FileUser className="w-6 h-6 text-[#7572FF]" />
                <CardTitle className="text-xl">Portal del Candidato</CardTitle>
              </div>
              <CardDescription className="text-base">
                Encuentra oportunidades ideales, postúlate a empleos y gestiona tu proceso de selección
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#7572FF] rounded-full"></div>
                  <span className="text-sm text-gray-600">Búsqueda inteligente de empleos</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#7572FF] rounded-full"></div>
                  <span className="text-sm text-gray-600">Postulación simplificada</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#7572FF] rounded-full"></div>
                  <span className="text-sm text-gray-600">Seguimiento de aplicaciones</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#7572FF] rounded-full"></div>
                  <span className="text-sm text-gray-600">Match personalizado con ofertas</span>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={() => onRoleSelect('candidate')}
                  variant="outline"
                  className="w-full border-[#7572FF] text-[#7572FF] hover:bg-[#7572FF] hover:text-white group"
                  size="lg"
                >
                  <span>Acceder como Candidato</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="flex justify-center items-center gap-8 text-center">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#7572FF]" />
            <div>
              <p className="font-medium text-gray-900">95%</p>
              <p className="text-xs text-gray-500">Precisión IA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#7572FF]" />
            <div>
              <p className="font-medium text-gray-900">50k+</p>
              <p className="text-xs text-gray-500">Candidatos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#7572FF]" />
            <div>
              <p className="font-medium text-gray-900">70%</p>
              <p className="text-xs text-gray-500">Más rápido</p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            🚀 Esta es una versión demo para desarrollo. El flujo del candidato estará disponible próximamente.
          </p>
        </div>
      </div>
    </div>
  );
}