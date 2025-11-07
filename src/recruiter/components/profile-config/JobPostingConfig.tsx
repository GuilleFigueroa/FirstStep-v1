import { useState } from 'react';
import { Button } from '../../../ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/components/ui/card';
import { Input } from '../../../ui/components/ui/input';
import { Label } from '../../../ui/components/ui/label';
import { Badge } from '../../../ui/components/ui/badge';
import { Separator } from '../../../ui/components/ui/separator';
import {
  ArrowLeft,
  Building2,
  Briefcase,
  CheckCircle,
  Copy,
  Eye,
  ExternalLink,
  Star,
  Calendar,
  Wrench,
  Brain,
  Sparkles,
  Users,
  Info,
  Loader2,
  Check
} from 'lucide-react';
import type { JobProfile, JobPosting } from '../../../app/App';
import type { Profile } from '../../../shared/services/supabase';
import { createProcess } from '../../services/processService';

interface JobPostingConfigProps {
  profile: JobProfile;
  onBack: () => void;
  onCreatePosting: (jobPosting: JobPosting) => void;
  onStartSimulation?: () => void;
  userProfile: Profile;
}

export function JobPostingConfig({ profile, onBack, onCreatePosting, onStartSimulation, userProfile }: JobPostingConfigProps) {
  const [companyName, setCompanyName] = useState(userProfile.company_name || '');
  const [jobTitle, setJobTitle] = useState(profile.title);
  const [candidateLimit, setCandidateLimit] = useState<number | undefined>(undefined);
  const [isPostingCreated, setIsPostingCreated] = useState(false);
  const [postingLink, setPostingLink] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCreatePosting = async () => {
    if (!companyName.trim() || !jobTitle.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      // Crear proceso en la base de datos
      const result = await createProcess({
        profile,
        companyName: companyName.trim(),
        jobTitle: jobTitle.trim(),
        candidateLimit: candidateLimit,
        recruiterId: userProfile.id
      });

      if (result.success && result.process) {
        // Mostrar el link real generado
        setPostingLink(result.process.unique_link);
        setIsPostingCreated(true);

        // Crear JobPosting para compatibilidad con el flujo existente
        const jobPosting: JobPosting = {
          profile,
          companyName: companyName.trim(),
          jobTitle: jobTitle.trim(),
          candidateLimit: candidateLimit
        };

        onCreatePosting(jobPosting);
      } else {
        setError(result.error || 'Error desconocido al crear el proceso');
      }
    } catch (error) {
      setError('Error inesperado al crear el proceso');
      console.error('Error creating process:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      // Intentar usar la API moderna del Clipboard primero
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(postingLink);
        setLinkCopied(true);
        return;
      }
    } catch (err) {
      console.log('Clipboard API no disponible, usando método fallback');
    }

    // Método fallback: crear un elemento temporal y copiarlo
    try {
      const textArea = document.createElement('textarea');
      textArea.value = postingLink;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        setLinkCopied(true);
      } else {
        throw new Error('execCommand failed');
      }
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      // Como último recurso, mostrar el enlace para copia manual
      prompt('No se pudo copiar automáticamente. Copia manualmente este enlace:', postingLink);
    }
  };

  const handleViewSimulation = () => {
    if (onStartSimulation) {
      onStartSimulation();
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      experience: Calendar,
      tools: Wrench,
      technical: Brain,
      'other-skills': Star
    };
    return icons[category as keyof typeof icons] || Star;
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

  const allRequirements = [...profile.mandatoryRequirements, ...profile.optionalRequirements];
  const groupedRequirements = allRequirements.reduce((acc, req) => {
    if (!acc[req.category]) {
      acc[req.category] = [];
    }
    acc[req.category].push(req);
    return acc;
  }, {} as Record<string, typeof allRequirements>);

  const mandatoryCount = profile.mandatoryRequirements.length;
  const optionalCount = profile.optionalRequirements.length;
  const totalRequirements = mandatoryCount + optionalCount;

  const isFormValid = companyName.trim() && jobTitle.trim();

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al resumen
        </Button>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Briefcase className="w-6 h-6 text-primary" />
            <h2 className="text-2xl">
              {isPostingCreated ? 'Postulación Creada' : 'Crear Postulación'}
            </h2>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-sm text-gray-600">Paso 4 de 4</span>
            </div>
          </div>
          <p className="text-muted-foreground">
            {isPostingCreated 
              ? 'Tu postulación ha sido creada exitosamente y está lista para recibir candidatos'
              : 'Completa la información de la empresa, puesto y límite de candidatos para crear la postulación'
            }
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {!isPostingCreated ? (
          <>
            {/* Formulario de configuración */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Información de la Postulación
                </CardTitle>
                <CardDescription>
                  Esta información aparecerá en la postulación pública y será visible para los candidatos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Nombre de la empresa</Label>
                  <Input
                    id="company"
                    placeholder="Ej: TechCorp Inc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="job-title">Título del puesto</Label>
                  <Input
                    id="job-title"
                    placeholder="Ej: Desarrollador Frontend Senior"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="candidate-limit" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Límite de candidatos
                    <Badge variant="outline" className="text-xs">Opcional</Badge>
                  </Label>
                  <Input
                    id="candidate-limit"
                    type="number"
                    min="1"
                    max="1000"
                    placeholder="Ej: 50"
                    value={candidateLimit || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCandidateLimit(value ? parseInt(value, 10) : undefined);
                    }}
                    className="w-32"
                    autoFocus
                  />
                  <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                      Si configuras un límite, la postulación se cerrará automáticamente al alcanzar ese número de candidatos. 
                      Si no especificas un límite, la postulación permanecerá abierta indefinidamente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vista previa del perfil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Vista Previa del Perfil
                </CardTitle>
                <CardDescription>
                  Resumen de los requisitos que se aplicarán a esta postulación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">{profile.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {totalRequirements} requisitos configurados: {mandatoryCount} obligatorios, {optionalCount} opcionales
                  </p>
                </div>

                {profile.customPrompt && (
                  <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Instrucciones Personalizadas</span>
                    </div>
                    <p className="text-sm text-purple-700">"{profile.customPrompt}"</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(groupedRequirements).map(([category, requirements]) => {
                    const IconComponent = getCategoryIcon(category);
                    return (
                      <div key={category} className="text-center">
                        <div className="p-3 bg-muted rounded-lg mb-2">
                          <IconComponent className="w-5 h-5 mx-auto text-muted-foreground" />
                        </div>
                        <p className="text-xs font-medium">{getCategoryLabel(category)}</p>
                        <p className="text-xs text-muted-foreground">{requirements.length} requisitos</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Mostrar error si lo hay */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <p className="text-red-700 text-sm">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Botones de acción */}
            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={onBack} className="flex-1" disabled={isCreating}>
                Modificar perfil
              </Button>
              <Button
                onClick={handleCreatePosting}
                disabled={!isFormValid || isCreating}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando proceso...
                  </>
                ) : (
                  'Crear Postulación'
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Postulaci��n creada exitosamente */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <CardTitle className="text-green-800">¡Postulación Creada Exitosamente!</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-green-700">
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">Empresa: {companyName}</p>
                    <p className="font-medium">Puesto: {jobTitle}</p>
                    {candidateLimit && (
                      <p className="font-medium">Límite de candidatos: {candidateLimit}</p>
                    )}
                  </div>
                  <p>
                    Tu postulación está ahora activa y lista para recibir candidatos. 
                    Los CVs serán evaluados automáticamente según los criterios configurados.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Enlace de la postulación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Enlace de la Postulación
                </CardTitle>
                <CardDescription>
                  Comparte este enlace para que los candidatos puedan aplicar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input 
                    value={postingLink} 
                    readOnly 
                    className="font-mono text-sm bg-muted"
                  />
                  <Button
                    variant="outline"
                    onClick={handleCopyLink}
                    className={`flex items-center gap-2 ${linkCopied ? 'bg-green-50 border-green-500 text-green-700 hover:bg-green-100' : ''}`}
                  >
                    {linkCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Enlace copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar enlace
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Los candidatos podrán subir sus CVs a través de este enlace y recibirás una evaluación automática.
                  {candidateLimit && ` La postulación se cerrará automáticamente después de recibir ${candidateLimit} candidatos.`}
                  {!candidateLimit && ' Esta postulación permanecerá abierta indefinidamente.'}
                </p>
              </CardContent>
            </Card>

            {/* Próximos pasos */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">Próximos Pasos</CardTitle>
              </CardHeader>
              <CardContent className="text-blue-700">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                    <span>Comparte el enlace en plataformas de empleo, redes sociales o tu sitio web</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                    <span>Los candidatos subirán sus CVs y recibirás evaluaciones automáticas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                    <span>Los candidatos aparecerán en tu dashboard con sus perfiles completos para que puedas revisarlos y contactarlos</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Botones finales */}
            <div className="flex gap-4 pt-4">
              <Button 
                variant="outline" 
                onClick={handleViewSimulation}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Ver Simulación
              </Button>
              <Button
                onClick={handleCopyLink}
                className={`flex-1 flex items-center gap-2 ${linkCopied ? 'bg-green-600 hover:bg-green-700' : 'bg-primary'} text-primary-foreground`}
                size="lg"
              >
                {linkCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    ¡Compártelo con candidatos!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar enlace
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}