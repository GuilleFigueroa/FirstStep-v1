import { useState, useEffect } from 'react';
import { Button } from '../../ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/components/ui/card';
import { ArrowLeft, MessageSquare, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { AIQuestionsService, type AIQuestion, type AIAnswer } from '../../shared/services/aiQuestionsService';

interface AIQuestionsStepProps {
  onContinue: () => void;
  onBack: () => void;
  candidateId: string;
}

export function AIQuestionsStep({ onContinue, onBack, candidateId }: AIQuestionsStepProps) {
  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);

  // Cargar preguntas al montar el componente
  useEffect(() => {
    loadQuestions();
  }, [candidateId]);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const questionsData = await AIQuestionsService.getAIQuestions(candidateId);

      if (questionsData.length === 0) {
        setError('No se encontraron preguntas para este proceso. Contacta al reclutador.');
        setLoading(false);
        return;
      }

      setQuestions(questionsData);

      // Pre-cargar respuestas existentes (si las hay)
      const existingAnswers = new Map<string, string>();
      questionsData.forEach(q => {
        if (q.answer_text) {
          existingAnswers.set(q.id, q.answer_text);
        }
      });
      setAnswers(existingAnswers);

    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Error al cargar las preguntas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) || '' : '';
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isCurrentAnswerValid = currentAnswer.trim().length > 0;

  const handleAnswerChange = (value: string) => {
    if (!currentQuestion) return;

    const newAnswers = new Map(answers);

    // Si el texto está vacío, eliminar del Map para deshabilitar botón "Siguiente"
    if (value.trim().length === 0) {
      newAnswers.delete(currentQuestion.id);
    } else {
      newAnswers.set(currentQuestion.id, value);
    }

    setAnswers(newAnswers);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setRejectionMessage(null);

    try {
      // 1. Preparar respuestas
      const answersArray: AIAnswer[] = questions.map(q => ({
        questionId: q.id,
        answerText: answers.get(q.id) || ''
      }));

      // 2. Guardar respuestas
      setLoadingMessage('Guardando tus respuestas...');
      const saveResult = await AIQuestionsService.saveAIAnswers(candidateId, answersArray);

      if (!saveResult.success) {
        setError(saveResult.error || 'Error al guardar respuestas. Intenta de nuevo.');
        return;
      }

      // 3. Calcular scoring con filtro eliminatorio
      setLoadingMessage('Evaluando si se cumplen requisitos excluyentes...');
      const scoringResult = await AIQuestionsService.calculateScoring(candidateId);

      if (!scoringResult.approved) {
        // Candidato rechazado - mostrar mensaje y NO continuar
        setRejectionMessage(
          scoringResult.reason ||
          'Lamentablemente, tu perfil no cumple con todos los requisitos excluyentes para esta posición.'
        );
        return;
      }

      // 4. Candidato aprobado - continuar al siguiente paso
      onContinue();

    } catch (err) {
      console.error('Error submitting answers:', err);
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
      setLoadingMessage('');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Button onClick={onBack} variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#7572FF] rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <span className="text-[#7572FF] font-semibold">Preguntas</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-12">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7572FF] mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando preguntas...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error loading questions
  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Button onClick={onBack} variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#7572FF] rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <span className="text-[#7572FF] font-semibold">Preguntas</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-12">
          <Card>
            <CardContent className="py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Button onClick={loadQuestions} className="bg-[#7572FF] hover:bg-[#6863E8]">
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Rejection screen
  if (rejectionMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#7572FF] rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <span className="text-[#7572FF] font-semibold">Evaluación Completada</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-12">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Postulación No Aprobada</CardTitle>
              <CardDescription className="text-base mt-2">
                Gracias por tu interés en esta posición
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-900 leading-relaxed">
                  {rejectionMessage}
                </p>
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>Te animamos a seguir explorando otras oportunidades que se ajusten mejor a tu perfil.</p>
              </div>

              <div className="pt-2">
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="w-full border-gray-300"
                >
                  Volver al Inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main questions interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button onClick={onBack} variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#7572FF] rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-[#7572FF] font-semibold">Preguntas</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#7572FF]/10 rounded-full flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-[#7572FF]" />
              </div>
            </div>

            <CardTitle className="text-2xl">
              Responde las siguientes preguntas
            </CardTitle>

            <CardDescription className="text-base mt-2">
              Para mejorar la información de tu perfil
            </CardDescription>

            {/* Progress indicator */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Pregunta {currentQuestionIndex + 1} de {questions.length}</span>
                <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% completado</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-[#7572FF] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Current Question */}
            {currentQuestion && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-medium text-purple-900 mb-2">
                    {currentQuestion.question_text}
                  </h3>
                  {currentQuestion.question_reason && (
                    <p className="text-sm text-purple-700">
                      {currentQuestion.question_reason}
                    </p>
                  )}
                </div>

                <div>
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Escribe tu respuesta aquí..."
                    className="w-full min-h-[150px] p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7572FF] focus:border-transparent resize-none"
                    disabled={submitting}
                  />
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-2">
              <Button
                onClick={handlePrevious}
                disabled={isFirstQuestion || submitting}
                variant="outline"
                className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              {isLastQuestion ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!isCurrentAnswerValid || submitting}
                  className="flex-1 bg-[#7572FF] hover:bg-[#6863E8] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {loadingMessage || 'Procesando...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Continuar
                      <CheckCircle className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!isCurrentAnswerValid || submitting}
                  className="flex-1 bg-[#7572FF] hover:bg-[#6863E8] text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Help text */}
            {!submitting && (
              <div className="text-center text-sm pt-2">
                {!isCurrentAnswerValid ? (
                  <p className="text-amber-600">
                    * Debes responder esta pregunta para continuar
                  </p>
                ) : (
                  <p className="text-gray-500">
                    Puedes navegar entre preguntas usando los botones Anterior/Siguiente
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
