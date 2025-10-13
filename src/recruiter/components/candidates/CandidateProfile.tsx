import { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Heart,
  Download,
  FileText,
  User,
  Briefcase,
  Calendar,
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
  Star,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Linkedin,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { CandidateService } from '../../../shared/services/candidateService';
import { Button } from '../../../ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/components/ui/card';
import { Badge } from '../../../ui/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../ui/components/ui/avatar';
import { Progress } from '../../../ui/components/ui/progress';
import { Separator } from '../../../ui/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../ui/components/ui/collapsible';


interface CandidateProfileProps {
  candidate: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    linkedin_url?: string;
    cv_url?: string;
    score: number;
    status: string; // 'completed' | 'rejected'
    created_at: string;
    process_title: string;
    process_company: string;
    process_status: string;
    actionStatus?: 'reviewed' | 'contacted' | 'sent' | 'none';
    isFavorite?: boolean;
  };
  recruiterId: string;
  onClose: () => void;
  onAction: (action: string) => void;
}


export function CandidateProfile({ candidate, recruiterId, onClose, onAction }: CandidateProfileProps) {
  const [isFavorite, setIsFavorite] = useState(candidate.isFavorite || false);
  const [answersExpanded, setAnswersExpanded] = useState(false);
  const [compatibilityExpanded, setCompatibilityExpanded] = useState(true);

  // Estados para datos del análisis
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar análisis del candidato
  useEffect(() => {
    const loadCandidateAnalysis = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await CandidateService.getCandidateAnalysis(candidate.id, recruiterId);

        if (!result.success || !result.data) {
          setError(result.error || 'Error al cargar análisis del candidato');
          return;
        }

        setAnalysisData(result.data);
      } catch (err) {
        console.error('Error loading candidate analysis:', err);
        setError('Error al cargar análisis del candidato');
      } finally {
        setLoading(false);
      }
    };

    loadCandidateAnalysis();
  }, [candidate.id, recruiterId]);

  const handleRetry = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await CandidateService.getCandidateAnalysis(candidate.id, recruiterId);

      if (!result.success || !result.data) {
        setError(result.error || 'Error al cargar análisis del candidato');
        return;
      }

      setAnalysisData(result.data);
    } catch (err) {
      console.error('Error loading candidate analysis:', err);
      setError('Error al cargar análisis del candidato');
    } finally {
      setLoading(false);
    }
  };


  const handleAction = (action: string) => {
    if (action === 'favorite') {
      setIsFavorite(!isFavorite);
      onAction('mark-favorite');
    } else {
      onAction(action);
    }
  };

  const getFitColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFitBgColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-600';
    if (percentage >= 80) return 'bg-blue-600';
    if (percentage >= 70) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  // Estado del candidato (aprobado/rechazado)
  const isApproved = candidate.status === 'completed';
  const isRejected = candidate.status === 'rejected';

  return (
    <>
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback>
                  {candidate.first_name[0]}{candidate.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold">{candidate.first_name} {candidate.last_name}</h1>
                  {/* Badge Aprobado/Rechazado */}
                  {isApproved && (
                    <Badge className="bg-green-600 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      APROBADO
                    </Badge>
                  )}
                  {isRejected && (
                    <Badge className="bg-red-600 text-white">
                      <XCircle className="w-3 h-3 mr-1" />
                      RECHAZADO
                    </Badge>
                  )}
                  {candidate.linkedin_url && (
                    <a
                      href={candidate.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span className="font-medium">LinkedIn</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-gray-600">Postulante a {candidate.process_title}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-4">
              <span className={`font-semibold ${getFitColor(candidate.score)}`}>
                {candidate.score}% Fit
              </span>
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getFitBgColor(candidate.score)}`}
                  style={{ width: `${candidate.score}%` }}
                />
              </div>
            </div>
            
            <Button
              variant={isFavorite ? "default" : "outline"}
              size="sm"
              onClick={() => handleAction('favorite')}
              className={isFavorite ? "bg-yellow-500 hover:bg-yellow-600" : ""}
            >
              <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? 'Favorito' : 'Marcar favorito'}
            </Button>
            
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleAction('delete')}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-[#7572FF] animate-spin mb-4" />
              <p className="text-gray-600">Cargando análisis del candidato...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-900 mb-2 text-center">Error al cargar análisis</h3>
                <p className="text-red-700 text-center mb-4">{error}</p>
                <Button
                  onClick={handleRetry}
                  className="w-full bg-[#7572FF] hover:bg-[#6863E8]"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {/* Content - Solo si cargó correctamente */}
          {!loading && !error && analysisData && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* CV Visual - Lado Izquierdo */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Curriculum Vitae
                </h3>
                {candidate.cv_url && (
                  <a
                    href={candidate.cv_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar PDF
                    </Button>
                  </a>
                )}
              </div>

              {/* CV PDF Embed */}
              {candidate.cv_url ? (
                <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
                  <iframe
                    src={candidate.cv_url}
                    className="w-full aspect-[8.5/11]"
                    title="Curriculum Vitae"
                    style={{ minHeight: '800px' }}
                  />
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay CV disponible</p>
                </div>
              )}
            </div>

            {/* Análisis y Opciones - Lado Derecho */}
            <div className="space-y-4">
              {/* Análisis de Compatibilidad - Desplegable */}
              <Card>
                <Collapsible open={compatibilityExpanded} onOpenChange={setCompatibilityExpanded}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50">
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          Análisis de Compatibilidad
                        </span>
                        {compatibilityExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Fit General</span>
                            <span className={`font-semibold ${getFitColor(candidate.score)}`}>
                              {candidate.score}%
                            </span>
                          </div>
                          <Progress value={candidate.score} className="h-2" />
                        </div>

                        {analysisData?.requirements && (
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Requisitos Cumplidos
                              </h4>
                              <div className="space-y-2">
                                {analysisData.requirements
                                  .filter((req: any) => req.is_met)
                                  .map((req: any, index: number) => (
                                    <div key={`met-${index}`} className="flex items-center justify-between text-sm">
                                      <span>{req.requirement_text}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {req.is_mandatory ? 'Obligatorio' : 'Deseable'}
                                      </Badge>
                                    </div>
                                  ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-gray-600 mb-2 flex items-center gap-2">
                                <XCircle className="w-4 h-4" />
                                Requisitos Faltantes
                              </h4>
                              <div className="space-y-2">
                                {analysisData.requirements
                                  .filter((req: any) => !req.is_met)
                                  .map((req: any, index: number) => (
                                    <div key={`unmet-${index}`} className="flex items-center justify-between text-sm text-gray-500">
                                      <span>{req.requirement_text}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {req.is_mandatory ? 'Obligatorio' : 'Deseable'}
                                      </Badge>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Respuestas del Proceso - Desplegable */}
              <Card>
                <Collapsible open={answersExpanded} onOpenChange={setAnswersExpanded}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50">
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <MessageCircle className="w-5 h-5 text-blue-600" />
                          Respuestas del Proceso
                        </span>
                        {answersExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        Respuestas y mejoras durante la postulación
                      </CardDescription>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Preguntas de IA */}
                        {analysisData?.aiQuestions && analysisData.aiQuestions.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <MessageCircle className="w-4 h-4 text-purple-600" />
                              Preguntas de IA
                            </h3>
                            <div className="space-y-4">
                              {analysisData.aiQuestions.map((qa: any) => (
                                <div key={qa.id} className="border border-gray-200 rounded-lg p-4">
                                  <h4 className="font-medium text-purple-600 mb-2">{qa.question_text}</h4>
                                  <p className="text-gray-700 mb-3 text-sm">{qa.answer_text || 'Sin respuesta'}</p>
                                  {qa.analysis_feedback && (
                                    <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded">
                                      <p className="text-sm text-purple-800">
                                        <strong>Análisis:</strong> {qa.analysis_feedback}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Preguntas del Formulario */}
                        {analysisData?.recruiterQuestions && analysisData.recruiterQuestions.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              Preguntas del Formulario
                            </h3>
                            <div className="space-y-4">
                              {analysisData.recruiterQuestions.map((qa: any) => (
                                <div key={qa.id} className="border border-gray-200 rounded-lg p-4">
                                  <h4 className="font-medium text-blue-600 mb-2">{qa.question_text}</h4>
                                  <p className="text-gray-700 text-sm">{qa.answer_text || 'Sin respuesta'}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

            </div>
          </div>
          )}
          {/* Fin del contenido condicional */}
        </div>
      </div>


    </>
  );
}