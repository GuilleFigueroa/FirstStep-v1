import { useState } from 'react';
import { Button } from '../../../ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/components/ui/card';
import { Input } from '../../../ui/components/ui/input';
import { Label } from '../../../ui/components/ui/label';
import { Badge } from '../../../ui/components/ui/badge';
import { Separator } from '../../../ui/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/components/ui/select';
import { Textarea } from '../../../ui/components/ui/textarea';
import {
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Plus,
  X,
  ListChecks,
  FileText,
  Settings,
  Info
} from 'lucide-react';
import type { JobProfile, FormQuestion } from '../App';

interface CustomQuestionConfigProps {
  profile: JobProfile;
  onBack: () => void;
  onContinue: (profile: JobProfile) => void;
}



export function CustomQuestionConfig({ profile, onBack, onContinue }: CustomQuestionConfigProps) {
  const [questions, setQuestions] = useState<FormQuestion[]>(
    profile.formQuestions || [
      {
        id: '1',
        question: '',
        type: 'open'
      },
      {
        id: '2',
        question: '',
        type: 'open'
      }
    ]
  );

  const updateQuestion = (id: string, updates: Partial<FormQuestion>) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const newOptions = [...(question.options || []), ''];
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = question.options.filter((_, index) => index !== optionIndex);
      updateQuestion(questionId, { options: newOptions });
    }
  };



  const handleContinue = () => {
    const validQuestions = questions.filter(q => q.question.trim());
    const updatedProfile: JobProfile = {
      ...profile,
      formQuestions: validQuestions.length > 0 ? validQuestions : undefined
    };
    onContinue(updatedProfile);
  };

  const handleSkip = () => {
    const updatedProfile: JobProfile = {
      ...profile,
      formQuestions: undefined
    };
    onContinue(updatedProfile);
  };

  return (
    <div className="space-y-6">
      {/* Navegación */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver al resumen
        </Button>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span>Paso 3 de 4</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Preguntas Adicionales
            <Badge variant="outline" className="ml-2 text-gray-500">Opcional</Badge>
          </CardTitle>
          <CardDescription>
            <strong>Este paso es completamente opcional.</strong> Puedes agregar hasta 2 preguntas personalizadas que serán presentadas como formulario a los candidatos, o simplemente continuar sin agregar ninguna pregunta adicional.
          </CardDescription>
          <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              <strong>Importante:</strong> Las respuestas a estas preguntas son solo informativas y no afectan la puntuación del candidato.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuración de preguntas */}
          <div className="space-y-6">
            {questions.map((question, index) => (
              <Card key={question.id} className="border-2 border-dashed border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-600" />
                    Pregunta {index + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Texto de la pregunta */}
                  <div className="space-y-2">
                    <Label htmlFor={`question-${question.id}`}>Texto de la pregunta</Label>
                    <Textarea
                      id={`question-${question.id}`}
                      placeholder={
                        index === 0
                          ? "Ej: ¿Cuál es tu salario pretendido?"
                          : "Ej: ¿Estás dispuesto a trabajar presencial 3 veces a la semana?"
                      }
                      value={question.question}
                      onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                      className="min-h-16"
                    />
                  </div>

                  {/* Tipo de pregunta */}
                  <div className="space-y-2">
                    <Label>Tipo de pregunta</Label>
                    <Select
                      value={question.type}
                      onValueChange={(value: 'open' | 'multiple-choice') =>
                        updateQuestion(question.id, {
                          type: value,
                          options: value === 'multiple-choice' ? (question.options || ['']) : undefined
                        })
                      }
                    >
                      <SelectTrigger className="w-fit pr-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Pregunta abierta (texto libre)
                          </div>
                        </SelectItem>
                        <SelectItem value="multiple-choice">
                          <div className="flex items-center gap-2">
                            <ListChecks className="w-4 h-4" />
                            Opciones múltiples
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Opciones para preguntas de selección múltiple */}
                  {question.type === 'multiple-choice' && (
                    <div className="space-y-2">
                      <Label>Opciones de respuesta</Label>
                      <div className="space-y-2">
                        {(question.options || ['']).map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <Input
                              placeholder={`Opción ${optionIndex + 1}`}
                              value={option}
                              onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                              className="flex-1"
                            />
                            {(question.options?.length || 0) > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(question.id, optionIndex)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(question.id)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar opción
                        </Button>
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>
            ))}
          </div>

          {/* Vista previa */}
          {questions.some(q => q.question.trim()) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">Vista previa del formulario:</h4>
              <div className="space-y-4">
                {questions.filter(q => q.question.trim()).map((question, index) => (
                  <div key={question.id} className="bg-white border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-sm font-medium">
                        {index + 1}. {question.question}
                      </span>
                    </div>
                    {question.type === 'open' ? (
                      <div className="text-xs text-gray-500 italic">
                        [Campo de texto libre]
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {question.options?.filter(opt => opt.trim()).map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 border border-gray-300 rounded-full"></div>
                            <span>{option}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-3">
                Estas preguntas aparecerán después de las preguntas automáticas basadas en los requisitos del perfil
              </p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              Omitir y continuar sin preguntas adicionales
            </Button>
            <Button onClick={handleContinue} className="flex-1">
              {questions.some(q => q.question.trim()) ? 'Continuar con preguntas adicionales' : 'Continuar al siguiente paso'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}