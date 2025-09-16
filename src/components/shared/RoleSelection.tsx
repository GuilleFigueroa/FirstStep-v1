import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Zap, Users, Search, Target, ArrowRight } from 'lucide-react';

interface RoleSelectionProps {
  onRoleSelect: (role: 'recruiter' | 'candidate') => void;
}

export function RoleSelection({ onRoleSelect }: RoleSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Logo y título principal */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 bg-[#7572FF] rounded-2xl flex items-center justify-center">
              <Zap className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[#7572FF]">FirstStep</h1>
              <p className="text-lg text-muted-foreground">Reclutamiento Inteligente con IA</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl">¿Cómo quieres usar FirstStep?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Selecciona tu rol para acceder a las herramientas diseñadas específicamente para ti
            </p>
          </div>
        </div>

        {/* Selección de roles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Opción Reclutador */}
          <Card className="relative overflow-hidden border-2 hover:border-[#7572FF] transition-all duration-300 hover:shadow-lg group">
            <div className="absolute top-4 right-4">
              <Badge variant="default" className="bg-[#7572FF] text-white">
                Completamente Funcional
              </Badge>
            </div>
            
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-[#7572FF]/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-[#7572FF]" />
              </div>
              <CardTitle className="text-xl">Soy Reclutador</CardTitle>
              <CardDescription className="text-base">
                Gestiona procesos de selección, configura perfiles y evalúa candidatos
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-[#7572FF] rounded-full"></div>
                  <span>Configuración inteligente de perfiles de puesto</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-[#7572FF] rounded-full"></div>
                  <span>Simulación de candidatos con IA</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-[#7572FF] rounded-full"></div>
                  <span>Dashboard completo de gestión</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-[#7572FF] rounded-full"></div>
                  <span>Análisis de postulaciones en tiempo real</span>
                </div>
              </div>
              
              <Button 
                onClick={() => onRoleSelect('recruiter')}
                className="w-full bg-[#7572FF] hover:bg-[#6863E8] text-white group-hover:shadow-md transition-all"
                size="lg"
              >
                Acceder como Reclutador
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Opción Candidato */}
          <Card className="relative overflow-hidden border-2 hover:border-blue-500 transition-all duration-300 hover:shadow-lg group">
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                En Development
              </Badge>
            </div>
            
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Soy Candidato</CardTitle>
              <CardDescription className="text-base">
                Encuentra oportunidades laborales y postúlate de forma inteligente
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Proceso de postulación simplificado</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Búsqueda inteligente de empleos</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Seguimiento de aplicaciones</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Recomendaciones personalizadas</span>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Demo Disponible</p>
                    <p className="text-xs text-blue-700">
                      Puedes probar el proceso de registro y ver las funcionalidades planeadas
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => onRoleSelect('candidate')}
                variant="outline"
                className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 group-hover:shadow-md transition-all"
                size="lg"
              >
                Explorar como Candidato
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Información adicional */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>100% Gratuito</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Tecnología IA</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Versión Demo</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            FirstStep • Plataforma de reclutamiento inteligente • 2024
          </p>
        </div>
      </div>
    </div>
  );
}