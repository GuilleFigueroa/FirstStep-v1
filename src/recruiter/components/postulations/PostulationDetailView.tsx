import { useState, useEffect } from 'react';
import { Button } from '../../../ui/components/ui/button';
import { Badge } from '../../../ui/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/components/ui/select';
import { ModifyLimitDialog } from './ModifyLimitDialog';
import {
  ArrowLeft,
  Building2,
  Briefcase,
  FileText,
  CheckCircle2,
  Circle,
  MessageSquare,
  Users,
  Settings,
  ExternalLink
} from 'lucide-react';
import type { Process } from '../../../shared/services/supabase';
import { getProcessWithDetails, updateProcessStatus, updateProcessLimit } from '../../services/processService';
import { RecruiterQuestionsService, type RecruiterQuestion } from '../../../shared/services/recruiterQuestionsService';

interface PostulationDetailViewProps {
  processId: string;
  onBack: () => void;
  onNavigateToCandidates: (processId: string) => void;
}

type ProcessWithCount = Process & { candidate_count?: number };

export function PostulationDetailView({ processId, onBack, onNavigateToCandidates }: PostulationDetailViewProps) {
  const [process, setProcess] = useState<ProcessWithCount | null>(null);
  const [questions, setQuestions] = useState<RecruiterQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    loadProcessDetails();
  }, [processId]);

  const loadProcessDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar proceso con conteo de candidatos
      const processResult = await getProcessWithDetails(processId);
      if (!processResult.success || !processResult.process) {
        setError(processResult.error || 'Error al cargar proceso');
        return;
      }

      setProcess(processResult.process);

      // Cargar preguntas del reclutador
      const questionsResult = await RecruiterQuestionsService.getRecruiterQuestionsByProcess(processId);
      if (questionsResult.success && questionsResult.questions) {
        setQuestions(questionsResult.questions);
      }
    } catch (err) {
      console.error('Error loading process details:', err);
      setError('Error inesperado al cargar detalles del proceso');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'closed' | 'paused') => {
    if (!process) return;

    try {
      setChangingStatus(true);
      const result = await updateProcessStatus(processId, newStatus);

      if (result.success) {
        // Recargar detalles para reflejar cambio
        await loadProcessDetails();
      } else {
        alert(result.error || 'Error al actualizar estado');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error inesperado al actualizar estado');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleConfirmLimitChange = async (newLimit: number | null) => {
    if (!process) return;

    const result = await updateProcessLimit(processId, newLimit);
    if (result.success) {
      await loadProcessDetails();
    } else {
      throw new Error(result.error || 'Error al actualizar límite');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge style={{ backgroundColor: '#BE56C8', color: 'white' }}>Activa</Badge>;
      case 'closed':
        return <Badge style={{ backgroundColor: '#9E9C9E', color: 'white' }}>Cerrada</Badge>;
      case 'paused':
        return <Badge style={{ backgroundColor: '#FFA500', color: 'white' }}>Pausada</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const extractUniqueId = (uniqueLink: string): string => {
    const parts = uniqueLink.split('/apply/');
    return parts.length > 1 ? parts[1] : uniqueLink;
  };

  const openLinkInNewTab = () => {
    if (!process) return;
    const uniqueId = extractUniqueId(process.unique_link);
    const fullLink = `${window.location.origin}/apply/${uniqueId}`;
    window.open(fullLink, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p>Cargando detalles del proceso...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !process) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-700">{error || 'Proceso no encontrado'}</p>
          <Button onClick={onBack} className="mt-4">
            Volver
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Parsear requisitos (son arrays de objetos ProfileRequirement)
  let mandatoryReqs: any[] = [];
  let optionalReqs: any[] = [];

  try {
    mandatoryReqs = typeof process.mandatory_requirements === 'string'
      ? JSON.parse(process.mandatory_requirements)
      : process.mandatory_requirements || [];
    optionalReqs = typeof process.optional_requirements === 'string'
      ? JSON.parse(process.optional_requirements)
      : process.optional_requirements || [];
  } catch (e) {
    console.error('Error parsing requirements:', e);
  }

  return (
    <div className="space-y-6">
      {/* Header con botón volver */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Postulaciones
        </Button>

        <Button
          variant="outline"
          onClick={openLinkInNewTab}
          className="flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Abrir Link de Postulación
        </Button>
      </div>

      {/* Información Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{process.title}</CardTitle>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium text-sm">{process.company_name}</span>
                </div>
              </div>
              <Button
                onClick={() => onNavigateToCandidates(processId)}
                className="bg-[#7572FF] hover:bg-[#6863E8] text-white flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Ver Candidatos ({process.candidate_count || 0})
              </Button>
            </div>
            {getStatusBadge(process.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Descripción */}
          {process.description && (
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Descripción del Perfil</h3>
              <p className="text-gray-600 text-sm">{process.description}</p>
            </div>
          )}

          {/* Controles de Estado y Límite */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Estado del Proceso</label>
              <Select
                value={process.status}
                onValueChange={(value) => handleStatusChange(value as 'active' | 'closed' | 'paused')}
                disabled={changingStatus}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="paused">Pausada</SelectItem>
                  <SelectItem value="closed">Cerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Límite de Candidatos</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-white border rounded-md text-sm">
                  {process.candidate_limit ? `${process.candidate_count || 0} / ${process.candidate_limit}` : 'Sin límite'}
                </div>
                <ModifyLimitDialog
                  currentLimit={process.candidate_limit}
                  currentApplicants={process.candidate_count || 0}
                  onConfirm={handleConfirmLimitChange}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Settings className="w-4 h-4" />
                    Modificar
                  </Button>
                </ModifyLimitDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requisitos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-[#7572FF]" />
            Requisitos del Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Requisitos Obligatorios */}
          {mandatoryReqs.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Requisitos Obligatorios
              </h3>
              <ul className="space-y-2">
                {mandatoryReqs.map((req, index) => (
                  <li key={req.id || index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>
                      {req?.title || 'Requisito sin título'}
                      {req?.level && <span className="text-gray-500"> ({req.level})</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requisitos Deseables */}
          {optionalReqs.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                <Circle className="w-4 h-4 text-blue-600" />
                Requisitos Deseables
              </h3>
              <ul className="space-y-2">
                {optionalReqs.map((req, index) => (
                  <li key={req.id || index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>
                      {req?.title || 'Requisito sin título'}
                      {req?.level && <span className="text-gray-500"> ({req.level})</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mandatoryReqs.length === 0 && optionalReqs.length === 0 && (
            <p className="text-sm text-gray-500 italic">No se definieron requisitos para este proceso</p>
          )}
        </CardContent>
      </Card>

      {/* Prompt Personalizado */}
      {process.custom_prompt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="w-5 h-5 text-[#7572FF]" />
              Prompt Personalizado para IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{process.custom_prompt}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preguntas del Formulario */}
      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="w-5 h-5 text-[#7572FF]" />
              Preguntas del Formulario ({questions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-sm text-gray-700">
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 font-medium">{question.question_text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {question.question_type === 'text' && 'Texto libre'}
                          {question.question_type === 'single_choice' && 'Selección única'}
                          {question.question_type === 'multiple_choice' && 'Selección múltiple'}
                        </Badge>
                      </div>
                      {question.question_options && question.question_options.length > 0 && (
                        <div className="mt-2 pl-4">
                          <p className="text-xs text-gray-600 mb-1">Opciones:</p>
                          <ul className="space-y-1">
                            {question.question_options.map((option, optIdx) => (
                              <li key={optIdx} className="text-xs text-gray-600">
                                • {option}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
