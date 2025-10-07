import { useState, useEffect } from 'react';
import { Button } from '../../ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/components/ui/card';
import { ArrowLeft, MessageSquare, AlertCircle, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Process, RecruiterQuestion } from '../../shared/services/supabase';
import { supabase } from '../../shared/services/supabase';
import { RecruiterQuestionsService } from '../../shared/services/recruiterQuestionsService';

interface RecruiterQuestionsStepProps {
  onContinue: () => void;
  onBack: () => void;
  process: Process;
  candidateId: string;
}

export function RecruiterQuestionsStep({ onContinue, onBack, process, candidateId }: RecruiterQuestionsStepProps) {
  const [questions, setQuestions] = useState<RecruiterQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar preguntas desde recruiter_questions
  const loadQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('recruiter_questions')
        .select('*')
        .eq('process_id', process.id)
        .order('question_order', { ascending: true });

      if (error) throw error;

      setQuestions(data || []);
    } catch (err) {
      console.error('Error loading recruiter questions:', err);
      setError('Error al cargar las preguntas');
    } finally {
      setLoading(false);
    }
  };

  // Cargar preguntas al montar el componente
  useEffect(() => {
    loadQuestions();
  }, [process.id]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) || '' : '';
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  // Validación de respuesta según tipo de pregunta
  const isCurrentAnswerValid = currentQuestion
    ? currentAnswer.trim().length > 0
    : false;

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

    try {
      // Preparar respuestas con IDs de recruiter_questions
      const formattedAnswers = Array.from(answers.entries()).map(([questionId, answerText]) => ({
        questionId,
        answerText
      }));

      // Guardar respuestas en la BD
      const result = await RecruiterQuestionsService.saveRecruiterAnswers(
        candidateId,
        formattedAnswers
      );

      if (!result.success) {
        setError(result.error || 'Error al guardar respuestas');
        return;
      }

      // Continuar al siguiente paso
      onContinue();
    } catch (err) {
      console.error('Error submitting answers:', err);
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // Mostrar loading mientras se cargan las preguntas
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#7572FF]/30 border-t-[#7572FF] rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">Cargando preguntas...</p>
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
                <span className="text-[#7572FF] font-semibold">Formulario</span>
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

  // Si no hay preguntas, continuar automáticamente
  if (!loading && questions.length === 0) {
    onContinue();
    return null;
  }

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
              <span className="text-[#7572FF] font-semibold">Formulario</span>
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
              Completa el formulario del reclutador
            </CardTitle>

            <CardDescription className="text-base mt-2">
              Responde las siguientes preguntas para finalizar tu postulación
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900">
                    {currentQuestion.question_text}
                  </h3>
                </div>

                {currentQuestion.question_type === 'open' ? (
                  <div>
                    <textarea
                      value={currentAnswer}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Escribe tu respuesta aquí..."
                      className="w-full min-h-[150px] p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7572FF] focus:border-transparent resize-none"
                      disabled={submitting}
                    />
                  </div>
                ) : currentQuestion.question_type === 'multiple-choice' && currentQuestion.question_options ? (
                  <div className="space-y-2">
                    {currentQuestion.question_options.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name={currentQuestion.id}
                          value={option}
                          checked={currentAnswer === option}
                          onChange={(e) => handleAnswerChange(e.target.value)}
                          disabled={submitting}
                          className="w-4 h-4 text-[#7572FF] border-gray-300 focus:ring-[#7572FF]"
                        />
                        <span className="ml-3 text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                ) : null}
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
                      Enviando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Enviar Postulación
                      <Send className="w-4 h-4" />
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
