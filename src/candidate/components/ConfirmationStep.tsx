import { useState, useEffect } from 'react';
import { Button } from '../../ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/components/ui/card';
import { Textarea } from '../../ui/components/ui/textarea';
import { Badge } from '../../ui/components/ui/badge';
import { CheckCircle, AlertCircle, Mail, Linkedin, Loader2 } from 'lucide-react';
import { supabase } from '../../shared/services/supabase';
import { CandidateService } from '../../shared/services/candidateService';

interface ConfirmationStepProps {
  candidateId: string;
  candidateEmail: string;
  candidateLinkedIn?: string;
}

interface RequirementEvaluation {
  requirement: string;
  meets: boolean;
  evidence: string;
}

interface ScoringDetails {
  mandatory_evaluation?: RequirementEvaluation[];
  optional_evaluation?: RequirementEvaluation[];
  score?: number;
  summary?: string;
}

export function ConfirmationStep({ candidateId, candidateEmail, candidateLinkedIn }: ConfirmationStepProps) {
  const [loading, setLoading] = useState(true);
  const [scoringDetails, setScoringDetails] = useState<ScoringDetails | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadScoringDetails() {
      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('scoring_details')
          .eq('id', candidateId)
          .single();

        if (error) throw error;

        setScoringDetails(data?.scoring_details || null);
      } catch (err) {
        console.error('Error loading scoring details:', err);
        setError('No se pudo cargar el análisis de tu perfil');
      } finally {
        setLoading(false);
      }
    }

    loadScoringDetails();
  }, [candidateId]);
  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    
    const success = await CandidateService.saveFeedback(candidateId, feedback.trim());
    
    if (success) {
      setFeedbackSubmitted(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#7572FF] animate-spin mx-auto" />
          <p className="text-gray-600">Cargando tu evaluación...</p>
        </div>
      </div>
    );
  }

  const mandatoryRequirements = scoringDetails?.mandatory_evaluation || [];
  const optionalRequirements = scoringDetails?.optional_evaluation || [];
  const optionalMet = optionalRequirements.filter(r => r.meets).length;
  const optionalTotal = optionalRequirements.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-green-600 font-semibold">Postulación Completada</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Success Card */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-3xl text-green-600">
              ¡Felicitaciones! Has completado tu postulación
            </CardTitle>
            <CardDescription className="text-base mt-3">
              Tu perfil cumple con los requisitos indispensables para este puesto.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Mandatory Requirements */}
        {mandatoryRequirements.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Requisitos Obligatorios Cumplidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mandatoryRequirements.map((req, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900">{req.requirement}</p>
                      {req.evidence && (
                        <p className="text-sm text-green-700 mt-1">{req.evidence}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Optional Requirements */}
        {optionalRequirements.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {optionalMet} de {optionalTotal}
                </Badge>
                Requisitos Deseables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {optionalRequirements.map((req, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 border rounded-lg ${
                      req.meets
                        ? 'bg-green-50 border-green-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    {req.meets ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${req.meets ? 'text-green-900' : 'text-amber-900'}`}>
                        {req.requirement}
                      </p>
                      {req.evidence && (
                        <p className={`text-sm mt-1 ${req.meets ? 'text-green-700' : 'text-amber-700'}`}>
                          {req.evidence}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error fallback */}
        {error && (
          <Card className="mb-6">
            <CardContent className="py-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <p className="text-sm text-amber-800">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">🔍 Próximos Pasos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              El reclutador revisará tu CV junto con tus respuestas y se pondrá en contacto
              contigo en los próximos días.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <p className="font-medium text-blue-900">Te contactaremos por:</p>

              <div className="flex items-center gap-2 text-blue-800">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{candidateEmail}</span>
              </div>

              {candidateLinkedIn && (
                <div className="flex items-center gap-2 text-blue-800">
                  <Linkedin className="w-4 h-4" />
                  <span className="text-sm">{candidateLinkedIn}</span>
                </div>
              )}
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                💡 <strong>Tip:</strong> Mantén tu email y LinkedIn activos para no perderte la comunicación.
              </p>
            </div>

            <div className="pt-4 text-center">

            {/* Sección de Feedback */}
            <div className="border-t pt-6 mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                ¿Qué te pareció este proceso de aplicación?
              </h3>
              
              {!feedbackSubmitted ? (
                <div className="space-y-3">
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Comparte tu experiencia (opcional)"
                    maxLength={500}
                    className="resize-none h-24 max-w-2xl"
                  />
                  <div className="flex items-center justify-between max-w-2xl">
                    <span className="text-sm text-gray-500">
                      {feedback.length}/500 caracteres
                    </span>
                    <Button
                      onClick={handleSubmitFeedback}
                      disabled={!feedback.trim()}
                      className="bg-[#7572FF] hover:bg-[#6863E8]"
                      size="sm"
                    >
                      Enviar feedback
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-w-2xl">
                  <p className="text-sm text-green-800">
                    ✓ Gracias por tu feedback
                  </p>
                </div>
              )}
            </div>
              <p className="text-gray-600">
                Gracias por tu tiempo y por completar el proceso de postulación.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
