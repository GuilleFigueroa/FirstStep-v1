import { Button } from '../../../ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/components/ui/card';
import { Badge } from '../../../ui/components/ui/badge';
import { Separator } from '../../../ui/components/ui/separator';
import { ArrowLeft, Save, CheckCircle, Star, Calendar, Wrench, Brain, AlertTriangle, Sparkles, ChevronRight } from 'lucide-react';
import type { JobProfile } from '../../../app/App';

interface ProfileSummaryProps {
  profile: JobProfile;
  onBack: () => void;
  onSaveAsTemplate: () => void;
  onContinue: () => void;
}

export function ProfileSummary({ profile, onBack, onSaveAsTemplate, onContinue }: ProfileSummaryProps) {
  const getCategoryIcon = (category: string) => {
    const icons = {
      experience: Calendar,
      tools: Wrench,
      technical: Brain,
      'other-skills': Star
    };
    return icons[category as keyof typeof icons] || Star;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      experience: 'bg-blue-100 text-blue-800 border-blue-200',
      tools: 'bg-green-100 text-green-800 border-green-200',
      technical: 'bg-purple-100 text-purple-800 border-purple-200',
      'other-skills': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      experience: 'Experiencia',
      tools: 'Herramientas',
      technical: 'Conocimientos Técnicos',
      'other-skills': 'Otras Habilidades'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const groupedRequirements = profile.requirements.reduce((acc, req) => {
    if (!acc[req.category]) {
      acc[req.category] = [];
    }
    acc[req.category].push(req);
    return acc;
  }, {} as Record<string, typeof profile.requirements>);

  const formatRequirementText = (req: typeof profile.requirements[0]) => {
    let text = req.title;
    if (req.level) {
      text += ` (${req.level})`;
    }
    if (req.years) {
      text += ` - ${req.years} años`;
    }
    return text;
  };

  const totalRequirements = profile.requirements.length;
  const obligatoryRequirements = profile.requirements.filter(req => req.required).length;
  const optionalRequirements = totalRequirements - obligatoryRequirements;
  const hasRequirements = totalRequirements > 0;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a configuración
        </Button>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {hasRequirements ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            )}
            <h2 className="text-2xl">
              {hasRequirements ? 'Perfil Configurado' : 'Perfil Sin Requisitos'}
            </h2>
          </div>
          <p className="text-muted-foreground">
            {hasRequirements 
              ? 'Revisa el resumen del perfil ideal antes de continuar con la configuración de la postulación'
              : 'Este perfil no tiene requisitos configurados'
            }
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              {profile.title}
            </CardTitle>
            <CardDescription>
              {hasRequirements ? (
                <>
                  Se han configurado {totalRequirements} requisitos: {obligatoryRequirements} obligatorios y {optionalRequirements} opcionales
                  {profile.customPrompt && " • Incluye instrucciones personalizadas para la IA"}
                </>
              ) : (
                <>Este perfil no tiene requisitos configurados. Vuelve atrás para agregar requisitos.</>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        {profile.customPrompt && (
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-purple-100">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <CardTitle className="text-purple-800">Instrucciones Personalizadas para la IA</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-white/70 p-4 rounded-lg border border-purple-200">
                <p className="text-purple-900 leading-relaxed">
                  "{profile.customPrompt}"
                </p>
              </div>
              <p className="text-sm text-purple-600 mt-3">
                Estas instrucciones se aplicarán durante el análisis automático de candidatos junto con los requisitos configurados.
              </p>
            </CardContent>
          </Card>
        )}

        {hasRequirements ? (
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Candidato Ideal</CardTitle>
              <CardDescription>
                Estos son los criterios que se utilizarán para evaluar los CVs. Los requisitos obligatorios tendrán mayor peso en la puntuación.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedRequirements).map(([category, requirements]) => {
                const IconComponent = getCategoryIcon(category);
                const obligatory = requirements.filter(req => req.required);
                const optional = requirements.filter(req => !req.required);
                
                return (
                  <div key={category}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-muted">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <h4>{getCategoryLabel(category)}</h4>
                      <div className="ml-auto flex gap-2">
                        {obligatory.length > 0 && (
                          <Badge variant="default" className="bg-red-100 text-red-800">
                            {obligatory.length} obligatorio{obligatory.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {optional.length > 0 && (
                          <Badge variant="outline">
                            {optional.length} opcional{optional.length !== 1 ? 'es' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="pl-11 space-y-3">
                      {obligatory.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-red-800 mb-2">Requisitos Obligatorios:</p>
                          <div className="flex flex-wrap gap-2">
                            {obligatory.map((req) => (
                              <Badge 
                                key={req.id} 
                                variant="secondary" 
                                className="bg-red-100 text-red-800 border-red-200 px-3 py-1.5"
                              >
                                {formatRequirementText(req)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {optional.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Requisitos Opcionales:</p>
                          <div className="flex flex-wrap gap-2">
                            {optional.map((req) => (
                              <Badge 
                                key={req.id} 
                                variant="outline" 
                                className="px-3 py-1.5"
                              >
                                {formatRequirementText(req)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Sin requisitos configurados
              </CardTitle>
            </CardHeader>
            <CardContent className="text-yellow-700">
              <p className="mb-3">
                Este perfil no tiene requisitos configurados. Sin requisitos, todos los CVs 
                tendrán una evaluación muy básica.
              </p>
              <ul className="space-y-1 text-sm">
                <li>• Agrega requisitos para mejorar la evaluación de candidatos</li>
                <li>• Los requisitos obligatorios tendrán mayor peso en la puntuación</li>
                <li>• Los requisitos opcionales suman puntos adicionales</li>
              </ul>
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">¿Cómo funciona la evaluación?</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                <span>
                  <strong>Requisitos obligatorios:</strong> Fundamentales para el puesto, tienen mayor peso en la puntuación
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                <span>
                  <strong>Requisitos opcionales:</strong> Agregan valor al perfil pero no son indispensables
                </span>
              </li>
              {profile.customPrompt && (
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                  <span>
                    <strong>Instrucciones personalizadas:</strong> La IA aplicará criterios específicos adicionales durante la evaluación
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                <span>Los candidatos recibirán una puntuación basada en qué tan bien cumplan con estos criterios</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex gap-4 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            {hasRequirements ? 'Modificar requisitos' : 'Agregar requisitos'}
          </Button>
          <Button 
            variant="outline"
            onClick={onSaveAsTemplate} 
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Guardar como Plantilla
          </Button>
          <Button 
            onClick={onContinue}
            disabled={!hasRequirements}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            Continuar
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}