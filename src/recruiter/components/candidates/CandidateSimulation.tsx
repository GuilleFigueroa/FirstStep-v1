import { useState } from 'react';
import { Button } from '../../../ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/components/ui/card';
import { Input } from '../../../ui/components/ui/input';
import { Label } from '../../../ui/components/ui/label';
import { Textarea } from '../../../ui/components/ui/textarea';
import { Badge } from '../../../ui/components/ui/badge';
import { Progress } from '../../../ui/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../../../ui/components/ui/avatar';
import { Separator } from '../../../ui/components/ui/separator';
import { 
  ArrowLeft, 
  ArrowRight,
  Building2, 
  Briefcase, 
  Clock, 
  User, 
  Mail, 
  MessageCircle, 
  Linkedin,
  Upload,
  FileText,
  CheckCircle,
  Star,
  Send,
  Award,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Download
} from 'lucide-react';
import type { JobPosting } from '../App';

type SimulationStep = 
  | 'welcome'
  | 'contact-info'
  | 'cv-upload'
  | 'analysis'
  | 'filter-question'
  | 'rejection'
  | 'questions'
  | 'results'
  | 'final-message';

interface ContactMethod {
  id: 'email' | 'whatsapp' | 'linkedin';
  label: string;
  icon: React.ComponentType<any>;
  placeholder: string;
}

interface CandidateInfo {
  firstName: string;
  lastName: string;
  contactMethod: 'email' | 'whatsapp' | 'linkedin';
  contactValue: string;
}

interface Question {
  id: string;
  question: string;
  category: string;
  answered?: boolean;
  answer?: string;
}

interface CandidateSimulationProps {
  jobPosting: JobPosting;
  onBack: () => void;
}

export function CandidateSimulation({ jobPosting, onBack }: CandidateSimulationProps) {
  const [currentStep, setCurrentStep] = useState<SimulationStep>('welcome');
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo>({
    firstName: '',
    lastName: '',
    contactMethod: 'email',
    contactValue: ''
  });
  const [uploadedCV, setUploadedCV] = useState<File | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [finalMessage, setFinalMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [filterQuestion, setFilterQuestion] = useState<string>('');
  const [passedFilter, setPassedFilter] = useState<boolean | null>(null);

  const contactMethods: ContactMethod[] = [
    { id: 'email', label: 'Email', icon: Mail, placeholder: 'tu@email.com' },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, placeholder: '+1 234 567 8900' },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'linkedin.com/in/tuperfil' }
  ];

  // Generar pregunta filtro basada en requisitos imprescindibles
  const generateFilterQuestion = () => {
    const mandatoryRequirements = jobPosting.profile.requirements.filter(req => req.required);
    if (mandatoryRequirements.length > 0) {
      const firstMandatory = mandatoryRequirements[0];
      let question = '';
      
      switch (firstMandatory.category) {
        case 'experience':
          question = `Este puesto requiere ${firstMandatory.title}${firstMandatory.years ? ` de al menos ${firstMandatory.years} años` : ''}. ¿Tienes esta experiencia?`;
          break;
        case 'tools':
          question = `Es imprescindible tener experiencia trabajando con ${firstMandatory.title}. ¿Has trabajado con esta herramienta?`;
          break;
        case 'technical':
          question = `Este puesto requiere conocimientos en ${firstMandatory.title}. ¿Tienes experiencia en este área?`;
          break;
        case 'other-skills':
          question = `Es necesario contar con ${firstMandatory.title}. ¿Cumples con este requisito?`;
          break;
        default:
          question = `Es imprescindible contar con ${firstMandatory.title}. ¿Cumples con este requisito?`;
      }
      
      setFilterQuestion(question);
    }
  };

  // Generar preguntas basadas en los requisitos del perfil
  const generateQuestions = () => {
    const mockQuestions: Question[] = [
      {
        id: '1',
        question: `¿Podrías detallar tu experiencia específica con ${jobPosting.profile.requirements.find(r => r.category === 'tools')?.title || 'las herramientas mencionadas'}?`,
        category: 'Herramientas'
      },
      {
        id: '2',
        question: `Veo que mencionas experiencia en desarrollo. ¿Cuántos años específicamente has trabajado en proyectos similares al puesto de ${jobPosting.jobTitle}?`,
        category: 'Experiencia'
      },
      {
        id: '3',
        question: `¿Podrías explicar un proyecto específico donde hayas aplicado las habilidades técnicas requeridas para este rol?`,
        category: 'Conocimientos Técnicos'
      },
      {
        id: '4',
        question: `¿Tienes disponibilidad para trabajar en el horario que requiere ${jobPosting.companyName}? ¿Hay alguna restricción que debamos conocer?`,
        category: 'Disponibilidad'
      }
    ];

    // Agregar pregunta personalizada si existe
    if (jobPosting.profile.customQuestion) {
      mockQuestions.push({
        id: 'custom',
        question: jobPosting.profile.customQuestion,
        category: 'Pregunta Personalizada'
      });
    }

    setQuestions(mockQuestions);
  };

  const handleCVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.pdf') || 
          file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) {
        setUploadedCV(file);
      } else {
        alert('Por favor, sube un archivo PDF o Word válido.');
      }
    }
    // Reset input para permitir subir el mismo archivo de nuevo
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Solo ocultar si realmente salimos del área
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.pdf') || 
          file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) {
        setUploadedCV(file);
      } else {
        alert('Por favor, sube un archivo PDF o Word válido.');
      }
    }
  };

  const startAnalysis = () => {
    if (!uploadedCV) return;
    
    setCurrentStep('analysis');
    generateFilterQuestion();
    generateQuestions();
    
    // Simular progreso de análisis
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setAnalysisProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setCurrentStep('filter-question');
        }, 1000);
      }
    }, 800);
  };

  const handleFilterQuestionAnswer = (passed: boolean) => {
    setPassedFilter(passed);
    if (passed) {
      setCurrentStep('questions');
    } else {
      setCurrentStep('rejection');
    }
  };

  const handleQuestionAnswer = (answer: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = {
      ...updatedQuestions[currentQuestionIndex],
      answered: true,
      answer
    };
    setQuestions(updatedQuestions);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Todas las preguntas respondidas
      setTimeout(() => {
        setCurrentStep('results');
      }, 500);
    }
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('contact-info');
        break;
      case 'contact-info':
        if (candidateInfo.firstName && candidateInfo.lastName && candidateInfo.contactValue) {
          setCurrentStep('cv-upload');
        }
        break;
      case 'cv-upload':
        if (uploadedCV) {
          startAnalysis();
        }
        break;
      case 'results':
        setCurrentStep('final-message');
        break;
      case 'final-message':
        alert('¡Gracias por tu postulación! El reclutador revisará tu perfil y se pondrá en contacto contigo.');
        break;
    }
  };

  const getStepProgress = () => {
    const steps = ['welcome', 'contact-info', 'cv-upload', 'analysis', 'filter-question', 'questions', 'results', 'final-message'];
    const stepIndex = steps.indexOf(currentStep);
    // Si es rejection, mostrar progreso de filter-question
    if (currentStep === 'rejection') {
      return ((steps.indexOf('filter-question') + 1) / steps.length) * 100;
    }
    return ((stepIndex + 1) / steps.length) * 100;
  };

  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 'contact-info':
        return candidateInfo.firstName && candidateInfo.lastName && candidateInfo.contactValue;
      case 'cv-upload':
        return uploadedCV !== null;
      case 'final-message':
        return finalMessage.trim().length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de la simulación */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al panel de reclutador
          </Button>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Simulación de postulación
            </div>
            <div className="w-32">
              <Progress value={getStepProgress()} className="h-2" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {/* Paso 1: Bienvenida */}
        {currentStep === 'welcome' && (
          <Card className="text-center">
            <CardHeader>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl mb-2">
                ¡Bienvenido al proceso de {jobPosting.jobTitle}!
              </CardTitle>
              <CardDescription className="text-lg">
                {jobPosting.companyName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">¿En qué consiste este proceso?</h3>
                <p className="text-blue-800 text-sm leading-relaxed">
                  Vamos a analizar tu CV y realizarte algunas preguntas específicas para completar 
                  información y aclarar puntos clave según lo que requiere el puesto.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="/placeholder-recruiter.jpg" />
                    <AvatarFallback>AM</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">Reclutador a cargo</p>
                    <p className="text-gray-600 text-sm">Arlene McCoy</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-10 h-10 text-gray-600 p-2 bg-white rounded-full" />
                  <div>
                    <p className="font-medium text-sm">Duración estimada</p>
                    <p className="text-gray-600 text-sm">5 minutos</p>
                  </div>
                </div>
              </div>

              <Button onClick={handleNextStep} size="lg" className="w-full">
                Comenzar proceso
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Paso 2: Información de contacto */}
        {currentStep === 'contact-info' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información de contacto
              </CardTitle>
              <CardDescription>
                ¿Cómo prefieres que te contactemos y cuál es tu nombre?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    placeholder="Juan"
                    value={candidateInfo.firstName}
                    onChange={(e) => setCandidateInfo(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    placeholder="Pérez"
                    value={candidateInfo.lastName}
                    onChange={(e) => setCandidateInfo(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Medio de contacto preferido</Label>
                <div className="grid grid-cols-3 gap-3">
                  {contactMethods.map((method) => {
                    const IconComponent = method.icon;
                    const isSelected = candidateInfo.contactMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setCandidateInfo(prev => ({ ...prev, contactMethod: method.id, contactValue: '' }))}
                        className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <IconComponent className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactValue">
                  {contactMethods.find(m => m.id === candidateInfo.contactMethod)?.label}
                </Label>
                <Input
                  id="contactValue"
                  placeholder={contactMethods.find(m => m.id === candidateInfo.contactMethod)?.placeholder}
                  value={candidateInfo.contactValue}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, contactValue: e.target.value }))}
                />
              </div>

              <Button 
                onClick={handleNextStep} 
                disabled={!isCurrentStepValid()}
                size="lg" 
                className="w-full"
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Paso 3: Subida de CV */}
        {currentStep === 'cv-upload' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Sube tu CV
              </CardTitle>
              <CardDescription>
                Sube tu currículum en formato PDF o Word para que podamos analizarlo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? 'border-blue-400 bg-blue-50' 
                    : uploadedCV 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {uploadedCV ? (
                  <div className="space-y-3">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                    <div>
                      <p className="font-medium text-green-800">{uploadedCV.name}</p>
                      <p className="text-sm text-green-600">
                        CV subido correctamente ({Math.round(uploadedCV.size / 1024)} KB)
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setUploadedCV(null)}>
                      Cambiar archivo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {isDragOver ? (
                      <>
                        <Download className="w-12 h-12 text-blue-500 mx-auto animate-bounce" />
                        <div>
                          <p className="font-medium text-blue-700">¡Suelta el archivo aquí!</p>
                          <p className="text-sm text-blue-600">Archivo listo para subir</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                        <div>
                          <p className="font-medium">Arrastra tu CV aquí o haz clic para seleccionar</p>
                          <p className="text-sm text-gray-500">PDF o Word (máx. 10MB)</p>
                        </div>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleCVUpload}
                      className="hidden"
                      id="cv-upload"
                    />
                    <label htmlFor="cv-upload">
                      <Button variant="outline" className="cursor-pointer" asChild>
                        <span>Seleccionar archivo</span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {uploadedCV && (
                  <div className="text-center text-sm text-gray-600">
                    Archivo listo para análisis: <span className="font-medium">{uploadedCV.name}</span>
                  </div>
                )}
                <Button 
                  onClick={handleNextStep} 
                  disabled={!uploadedCV}
                  size="lg" 
                  className="w-full"
                >
                  {uploadedCV ? (
                    <>
                      Analizar CV
                      <Sparkles className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Selecciona un archivo para continuar
                      <Upload className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paso 4: Análisis en progreso */}
        {currentStep === 'analysis' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Analizando tu perfil
              </CardTitle>
              <CardDescription>
                Estamos comparando tu CV con los requisitos del puesto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="animate-spin w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
                <div className="space-y-2">
                  <Progress value={analysisProgress} className="w-full" />
                  <p className="text-sm text-gray-600">{analysisProgress}% completado</p>
                </div>
                <p className="text-gray-600">
                  Preparando preguntas personalizadas basadas en tu experiencia...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paso 5: Pregunta filtro */}
        {currentStep === 'filter-question' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Verificación de requisito imprescindible
              </CardTitle>
              <CardDescription>
                Antes de continuar, necesitamos confirmar que cumples con un requisito esencial para este puesto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="destructive" className="text-xs">IMPRESCINDIBLE</Badge>
                  <span className="font-medium text-orange-900">Requisito obligatorio</span>
                </div>
                <p className="text-orange-900 font-medium">
                  {filterQuestion}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="destructive"
                  onClick={() => handleFilterQuestionAnswer(false)}
                  className="flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  No, no cumplo con esto
                </Button>
                <Button 
                  onClick={() => handleFilterQuestionAnswer(true)}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Sí, cumplo con este requisito
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paso de rechazo */}
        {currentStep === 'rejection' && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-6 h-6 text-red-600" />
                Proceso finalizado
              </CardTitle>
              <CardDescription className="text-red-700">
                Lamentablemente, no puedes continuar con este proceso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-red-800">
                <p className="mb-4">
                  El requisito que acabamos de verificar es <strong>imprescindible</strong> para este puesto 
                  en {jobPosting.companyName}. Sin cumplir con este requisito, no es posible continuar 
                  con el proceso de selección.
                </p>
                
                <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Requisito no cumplido:</h3>
                  <p className="text-sm">{filterQuestion}</p>
                </div>

                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold">Te recomendamos:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Adquirir la experiencia o habilidad necesaria</li>
                    <li>Buscar otros puestos que se ajusten mejor a tu perfil actual</li>
                    <li>Considerar programas de capacitación en esta área</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={onBack} className="flex-1">
                  Volver al panel de reclutador
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('https://www.linkedin.com/jobs/', '_blank')}
                  className="flex-1"
                >
                  Buscar otros empleos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paso 6: Preguntas */}
        {currentStep === 'questions' && questions.length > 0 && (
          <div className="space-y-6">
            {/* Panel de CV (simulado) */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Tu CV - {uploadedCV?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-4 rounded border text-sm">
                  <p className="font-semibold">{candidateInfo.firstName} {candidateInfo.lastName}</p>
                  <p className="text-gray-600 mb-3">{candidateInfo.contactValue}</p>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Experiencia:</strong> Desarrollador con 3+ años de experiencia...</p>
                    <p><strong>Habilidades:</strong> React, JavaScript, TypeScript, Node.js...</p>
                    <p><strong>Educación:</strong> Ingeniería en Sistemas...</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pregunta actual */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Pregunta {currentQuestionIndex + 1} de {questions.length}
                  </CardTitle>
                  <Badge variant={questions[currentQuestionIndex].id === 'custom' ? 'default' : 'outline'}>
                    {questions[currentQuestionIndex].category}
                    {questions[currentQuestionIndex].id === 'custom' && ' ✨'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {questions[currentQuestionIndex].id === 'custom' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                    <p className="text-purple-900 text-sm font-medium">
                      ✨ Pregunta personalizada del reclutador
                    </p>
                  </div>
                )}
                <div className={`p-4 rounded-lg ${
                  questions[currentQuestionIndex].id === 'custom' 
                    ? 'bg-purple-50 border border-purple-200' 
                    : 'bg-blue-50'
                }`}>
                  <p className={`font-medium ${
                    questions[currentQuestionIndex].id === 'custom' 
                      ? 'text-purple-900' 
                      : 'text-blue-900'
                  }`}>
                    {questions[currentQuestionIndex].question}
                  </p>
                </div>

                <QuestionForm
                  onSubmit={handleQuestionAnswer}
                  placeholder="Escribe tu respuesta aquí..."
                />

                <div className="flex justify-center">
                  <Progress 
                    value={((currentQuestionIndex) / questions.length) * 100} 
                    className="w-32" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Paso 7: Resultados */}
        {currentStep === 'results' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Análisis completado
              </CardTitle>
              <CardDescription>
                Resultados de tu postulación para {jobPosting.jobTitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mejora con las preguntas */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Cómo mejoraron tus chances
                </h3>
                <div className="space-y-2 text-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm">Tus respuestas aclararon tu experiencia específica con las herramientas clave</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm">Confirmaste tu disponibilidad y flexibilidad horaria</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm">Demostraste conocimiento aplicado en proyectos reales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm">Completaste información que no estaba clara en tu CV</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Requisitos que cumple */}
              <div className="space-y-4">
                <h3 className="font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Requisitos que cumples
                </h3>
                
                {/* Requisitos imprescindibles */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">IMPRESCINDIBLE</Badge>
                    <span className="text-sm font-medium">Requisitos obligatorios</span>
                  </div>
                  <ul className="space-y-2 ml-4">
                    {jobPosting.profile.requirements
                      .filter(req => req.required)
                      .slice(0, 3) // Mostrar solo algunos para simular que los cumple
                      .map(req => (
                        <li key={req.id} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <span className="text-sm">{req.title} {req.level && `(${req.level})`}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Requisitos deseables que cumple */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">DESEABLE</Badge>
                    <span className="text-sm font-medium">Requisitos adicionales que tienes</span>
                  </div>
                  <ul className="space-y-2 ml-4">
                    {jobPosting.profile.requirements
                      .filter(req => !req.required)
                      .slice(0, 2) // Mostrar solo algunos para simular que los cumple
                      .map(req => (
                        <li key={req.id} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <span className="text-sm">{req.title} {req.level && `(${req.level})`}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              <Separator />

              {/* Requisitos que le faltan */}
              <div className="space-y-4">
                <h3 className="font-semibold text-orange-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Requisitos deseables que te faltan
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">DESEABLE</Badge>
                    <span className="text-sm font-medium">Oportunidades de crecimiento</span>
                  </div>
                  <ul className="space-y-2 ml-4">
                    {jobPosting.profile.requirements
                      .filter(req => !req.required)
                      .slice(2) // Mostrar los restantes como que no los cumple
                      .map(req => (
                        <li key={req.id} className="flex items-start gap-2">
                          <div className="w-4 h-4 border-2 border-orange-400 rounded-full mt-0.5"></div>
                          <span className="text-sm text-orange-700">{req.title} {req.level && `(${req.level})`}</span>
                        </li>
                      ))}
                    {/* Agregar algunos ejemplos si no hay suficientes */}
                    {jobPosting.profile.requirements.filter(req => !req.required).length <= 2 && (
                      <>
                        <li className="flex items-start gap-2">
                          <div className="w-4 h-4 border-2 border-orange-400 rounded-full mt-0.5"></div>
                          <span className="text-sm text-orange-700">Certificaciones específicas del sector</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-4 h-4 border-2 border-orange-400 rounded-full mt-0.5"></div>
                          <span className="text-sm text-orange-700">Experiencia en metodologías ágiles avanzadas</span>
                        </li>
                      </>
                    )}
                  </ul>
                  <p className="text-sm text-orange-600 ml-4 mt-2">
                    <em>Estos requisitos no son eliminatorios, pero podrían fortalecer tu candidatura.</em>
                  </p>
                </div>
              </div>

              <Button onClick={handleNextStep} size="lg" className="w-full">
                Continuar al mensaje final
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Paso 8: Mensaje final */}
        {currentStep === 'final-message' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Mensaje para el reclutador
              </CardTitle>
              <CardDescription>
                ¿Hay algo más que te gustaría que el reclutador sepa sobre ti? (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Textarea
                placeholder="Ejemplo: Estoy muy interesado en esta oportunidad porque... o tengo experiencia adicional en..."
                value={finalMessage}
                onChange={(e) => setFinalMessage(e.target.value)}
                rows={4}
              />

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => setCurrentStep('results')}>
                  Volver a resultados
                </Button>
                <Button onClick={handleNextStep} size="lg" className="bg-green-600 hover:bg-green-700">
                  Aplicar al puesto
                  <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Componente auxiliar para formulario de preguntas
interface QuestionFormProps {
  onSubmit: (answer: string) => void;
  placeholder: string;
}

function QuestionForm({ onSubmit, placeholder }: QuestionFormProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmit(answer.trim());
      setAnswer('');
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder={placeholder}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={4}
      />
      <Button 
        onClick={handleSubmit} 
        disabled={!answer.trim()}
        className="w-full"
      >
        Responder y continuar
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}