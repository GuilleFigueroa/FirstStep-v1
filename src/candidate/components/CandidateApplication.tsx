import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CandidateFlow } from './CandidateFlow';
import { getProcessByUniqueId } from '../../recruiter/services/processService';
import type { Process } from '../../shared/services/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/components/ui/card';
import { Button } from '../../ui/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export function CandidateApplication() {
  const { processId } = useParams<{ processId: string }>();
  const navigate = useNavigate();
  const [process, setProcess] = useState<Process | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar proceso al montar el componente
  useEffect(() => {
    const fetchProcess = async () => {
      if (!processId) {
        setError('ID de proceso no válido');
        setLoading(false);
        return;
      }

      try {
        const response = await getProcessByUniqueId(processId);

        if (response.success && response.process) {
          // Verificar estado del proceso
          if (response.process.status === 'closed') {
            setError('closed');
          } else if (response.process.status === 'paused') {
            setError('paused');
          } else {
            setProcess(response.process);
          }
        } else {
          setError(response.error || 'Proceso no encontrado');
        }
      } catch (err) {
        setError('Error al cargar el proceso');
        console.error('Error fetching process:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProcess();
  }, [processId]);

  const handleBackToHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#7572FF]/30 border-t-[#7572FF] rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">Cargando proceso de postulación...</p>
        </div>
      </div>
    );
  }

  if (error || !process) {
    // Determinar el tipo de error
    const isPaused = error === 'paused';
    const isClosed = error === 'closed';
    const isGenericError = !isPaused && !isClosed;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2">
                <img
                  src="/firststep-logo.png"
                  alt="FirstStep"
                  className="h-10"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-16">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isPaused ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <AlertCircle className={`w-8 h-8 ${
                    isPaused ? 'text-yellow-500' : 'text-red-500'
                  }`} />
                </div>
              </div>
              <CardTitle className={`text-2xl ${
                isPaused ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {isPaused && 'Proceso pausado temporalmente'}
                {isClosed && 'Proceso cerrado'}
                {isGenericError && 'Proceso no disponible'}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {isPaused && 'Este proceso de selección está pausado temporalmente. Intenta nuevamente más tarde.'}
                {isClosed && 'Este proceso de selección ha sido cerrado y ya no acepta nuevas postulaciones.'}
                {isGenericError && (error || 'El proceso de postulación no fue encontrado o ya no está activo.')}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className={`border rounded-lg p-4 ${
                  isPaused ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
                }`}>
                  <p className={`text-sm ${
                    isPaused ? 'text-yellow-800' : 'text-red-800'
                  }`}>
                    {isPaused ? 'Estado del proceso:' : 'Esto puede suceder si:'}
                  </p>
                  <ul className={`text-sm mt-2 space-y-1 text-left list-disc list-inside ${
                    isPaused ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {isPaused ? (
                      <>
                        <li>El reclutador pausó temporalmente las postulaciones</li>
                        <li>El proceso puede reactivarse en cualquier momento</li>
                        <li>Te recomendamos volver a intentar más tarde</li>
                      </>
                    ) : (
                      <>
                        <li>El enlace ha expirado</li>
                        <li>El proceso de reclutamiento fue cerrado</li>
                        <li>Se alcanzó el límite de candidatos</li>
                        <li>El enlace no es válido</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Si tenemos el proceso, renderizar el flujo con datos reales
  const jobInfo = {
    title: process.title,
    company: process.company_name,
    description: process.description,
    processId: process.id
  };

  return (
    <CandidateFlow
      jobInfo={jobInfo}
      process={process}
      onBack={handleBackToHome}
    />
  );
}