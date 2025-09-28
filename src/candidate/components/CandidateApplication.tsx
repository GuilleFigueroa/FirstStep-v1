import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CandidateFlow } from './CandidateFlow';
import { getProcessByUniqueId } from '../../recruiter/services/processService';
import type { Process } from '../../shared/services/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/components/ui/card';
import { Button } from '../../ui/components/ui/button';
import { Zap, AlertCircle, ArrowLeft } from 'lucide-react';

export function CandidateApplication() {
  const { processId } = useParams<{ processId: string }>();
  const navigate = useNavigate();
  const [process, setProcess] = useState<Process | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setProcess(response.process);
        } else {
          setError(response.error || 'Proceso no encontrado');
        }
      } catch (err) {
        setError('Error al cargar el proceso');
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={handleBackToHome}
                variant="ghost"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Inicio
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

        <div className="max-w-2xl mx-auto px-6 py-16">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <CardTitle className="text-2xl text-red-700">
                Proceso no disponible
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {error || 'El proceso de postulación no fue encontrado o ya no está activo.'}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    Esto puede suceder si:
                  </p>
                  <ul className="text-sm text-red-700 mt-2 space-y-1 text-left list-disc list-inside">
                    <li>El enlace ha expirado</li>
                    <li>El proceso de reclutamiento fue cerrado</li>
                    <li>Se alcanzó el límite de candidatos</li>
                    <li>El enlace no es válido</li>
                  </ul>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleBackToHome}
                    className="bg-[#7572FF] hover:bg-[#6863E8] text-white"
                  >
                    Volver al Inicio
                  </Button>
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