import { useState } from 'react';
import { CandidateRegistration } from './CandidateRegistration';
import { VerificationStep } from './VerificationStep';
import { CVUploadStep } from './CVUploadStep';
import { AIQuestionsStep } from './AIQuestionsStep';
import { Button } from '../../ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/components/ui/card';
import { Badge } from '../../ui/components/ui/badge';
import type { Process } from '../../shared/services/supabase';
import { CandidateService } from '../../shared/services/candidateService';
import {
  ArrowLeft,
  CheckCircle,
  Zap,
  User,
  FileText,
  MessageSquare,
  Send,
  Shield
} from 'lucide-react';

interface JobInfo {
  title: string;
  company: string;
  description?: string;
  processId: string;
}

interface CandidateFlowProps {
  jobInfo: JobInfo;
  process: Process;
  onBack: () => void;
}

interface CandidateData {
  firstName: string;
  lastName: string;
  email: string;
  linkedin: string;
}

type FlowStep = 'registration' | 'verification' | 'profile' | 'questions' | 'confirmation';

export function CandidateFlow({ jobInfo, process, onBack }: CandidateFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('registration');
  const [candidateData, setCandidateData] = useState<CandidateData | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const handleRegistrationComplete = async (data: CandidateData) => {
    setLoading(true);
    setCandidateData(data);
    setDuplicateError(null);

    try {
      // Verificar duplicados primero
      const duplicateCheck = await CandidateService.checkDuplicateCandidate(
        process.id,
        data.email,
        data.linkedin
      );

      if (duplicateCheck.isDuplicate) {
        setDuplicateError(duplicateCheck.reason || 'Ya te registraste en este proceso');
        setLoading(false);
        return;
      }

      // Crear candidato en base de datos
      const candidate = await CandidateService.createCandidate({
        process_id: process.id,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        linkedin_url: data.linkedin
      });

      if (candidate) {
        setCandidateId(candidate.id);
        setCurrentStep('verification');
      } else {
        setDuplicateError('Error al registrarte. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error creating candidate:', error);
      setDuplicateError('Error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationComplete = () => {
    setCurrentStep('profile');
  };

  const handleCVUploadComplete = () => {
    setCurrentStep('questions');
  };

  const handleQuestionsComplete = () => {
    setCurrentStep('confirmation');
  };

  const handleBackToRegistration = () => {
    setCurrentStep('registration');
  };

  const handleBackToVerification = () => {
    setCurrentStep('verification');
  };

  const handleBackToProfile = () => {
    setCurrentStep('profile');
  };

  // Placeholder screens for next steps
  const PlaceholderScreen = ({ 
    step, 
    title, 
    description, 
    icon: Icon 
  }: { 
    step: FlowStep;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
  }) => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button 
              onClick={step === 'profile' ? handleBackToRegistration : onBack}
              variant="ghost"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#7572FF] rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-[#7572FF] font-semibold">FirstStep</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-sm font-medium text-green-600">Registro</span>
            </div>

            <div className="w-6 h-px bg-gray-300"></div>

            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'verification'
                  ? 'bg-[#7572FF] text-white'
                  : step === 'profile' || step === 'questions' || step === 'confirmation'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {step === 'profile' || step === 'questions' || step === 'confirmation' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step === 'verification' || step === 'profile' || step === 'questions' || step === 'confirmation'
                  ? 'text-[#7572FF]'
                  : 'text-gray-500'
              }`}>
                Verificación
              </span>
            </div>

            <div className="w-6 h-px bg-gray-300"></div>

            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'profile'
                  ? 'bg-[#7572FF] text-white'
                  : step === 'questions' || step === 'confirmation'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {step === 'questions' || step === 'confirmation' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step === 'profile' || step === 'questions' || step === 'confirmation'
                  ? 'text-[#7572FF]'
                  : 'text-gray-500'
              }`}>
                Perfil
              </span>
            </div>

            <div className="w-6 h-px bg-gray-300"></div>

            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'questions'
                  ? 'bg-[#7572FF] text-white'
                  : step === 'confirmation'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {step === 'confirmation' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <MessageSquare className="w-5 h-5" />
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step === 'questions' || step === 'confirmation'
                  ? 'text-[#7572FF]'
                  : 'text-gray-500'
              }`}>
                Preguntas
              </span>
            </div>

            <div className="w-6 h-px bg-gray-300"></div>

            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'confirmation'
                  ? 'bg-[#7572FF] text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                <Send className="w-5 h-5" />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step === 'confirmation' ? 'text-[#7572FF]' : 'text-gray-500'
              }`}>
                Envío
              </span>
            </div>
          </div>
        </div>

        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#7572FF]/10 rounded-full flex items-center justify-center">
                <Icon className="w-8 h-8 text-[#7572FF]" />
              </div>
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="text-base mt-2">
              {description}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    En Desarrollo
                  </Badge>
                </div>
                <p className="text-sm text-yellow-800">
                  Esta funcionalidad está siendo desarrollada. Pronto podrás completar 
                  todo el proceso de postulación de forma fluida.
                </p>
              </div>

              {candidateData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-green-800 mb-2">
                    Registro Completado ✓
                  </h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>Nombre:</strong> {candidateData.firstName} {candidateData.lastName}</p>
                    <p><strong>Email:</strong> {candidateData.email}</p>
                    <p><strong>LinkedIn:</strong> {candidateData.linkedin}</p>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button 
                  onClick={onBack}
                  className="bg-[#7572FF] hover:bg-[#6863E8] text-white"
                >
                  Volver al Panel de Reclutador
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render appropriate screen based on current step
  switch (currentStep) {
    case 'registration':
      return (
        <CandidateRegistration
          jobInfo={jobInfo}
          onBack={onBack}
          onContinue={handleRegistrationComplete}
          loading={loading}
          error={duplicateError}
        />
      );

    case 'verification':
      return (
        <VerificationStep
          onVerified={handleVerificationComplete}
          onBack={handleBackToRegistration}
        />
      );

    case 'profile':
      return (
        <CVUploadStep
          onContinue={handleCVUploadComplete}
          onBack={handleBackToVerification}
          candidateId={candidateId}
        />
      );

    case 'questions':
      return (
        <AIQuestionsStep
          onContinue={handleQuestionsComplete}
          onBack={handleBackToProfile}
          candidateId={candidateId || ''}
        />
      );
    
    case 'confirmation':
      return (
        <PlaceholderScreen
          step="confirmation"
          title="Postulación Enviada"
          description="Tu postulación ha sido enviada exitosamente. Te contactaremos pronto"
          icon={Send}
        />
      );
    
    default:
      return null;
  }
}