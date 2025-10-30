import { useState } from 'react';
import { Button } from '../../ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/components/ui/card';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, Download, Clock, MessageSquare, FileSearch } from 'lucide-react';
import { CandidateService } from '../../shared/services/candidateService';
import type { Process } from '../../shared/services/supabase';

interface CVUploadStepProps {
  onContinue: () => void;
  onBack: () => void;
  candidateId?: string;
  process?: Process;
}

export function CVUploadStep({ onContinue, onBack, candidateId, process }: CVUploadStepProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const validateFile = (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (validTypes.includes(file.type) ||
        file.name.toLowerCase().endsWith('.pdf') ||
        file.name.toLowerCase().endsWith('.doc') ||
        file.name.toLowerCase().endsWith('.docx')) {

      // Validar tamaño (5MB máximo)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('El archivo es demasiado grande. Máximo 5MB.');
        return false;
      }

      setSelectedFile(file);
      setError(null);
      return true;
    } else {
      setError('Por favor, sube un archivo PDF o Word válido.');
      return false;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateFile(file);
    }
    // Reset input para permitir subir el mismo archivo de nuevo
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateFile(files[0]);
    }
  };

  const handleContinue = async () => {
    if (!selectedFile) return;

    // Si no hay candidateId, seguir el flujo normal (sin persistencia)
    if (!candidateId) {
      onContinue();
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Subir CV
      setLoadingMessage('Subiendo tu CV...');
      const uploadSuccess = await CandidateService.updateCandidateCV(candidateId, selectedFile);

      if (!uploadSuccess) {
        setError('Error al subir el CV. Intenta de nuevo.');
        return;
      }

      // 2. Analizar CV con IA
      setLoadingMessage('Analizando tu CV...');

      // Obtener recruiterId del proceso
      if (!process?.recruiter_id) {
        setError('Error: no se pudo obtener información del proceso');
        return;
      }

      const analysisResult = await CandidateService.analyzeCVWithAI(candidateId, process.recruiter_id);

      if (!analysisResult.success) {
        setError(analysisResult.error || 'Error al analizar CV. Intenta de nuevo.');
        return;
      }

      // 3. Éxito - continuar al siguiente paso
      console.log('CV uploaded and analyzed successfully');
      onContinue();

    } catch (error) {
      console.error('Upload/Analysis error:', error);
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setUploading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={onBack}
              variant="ghost"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#7572FF] rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <span className="text-[#7572FF] font-semibold">Subir CV</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column: Process Explanation */}
          <div className="space-y-6">
            <Card style={{ backgroundColor: '#FDF5FA' }}>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <FileSearch className="w-6 h-6 text-[#7572FF]" />
                  ¿Cómo funciona el proceso?
                </CardTitle>
                {(process as any)?.recruiter_name && (
                  <CardDescription className="text-sm mt-2">
                    Proceso conducido por <strong>{(process as any).recruiter_name}</strong>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#7572FF] text-white rounded-full flex items-center justify-center font-semibold text-sm">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Análisis de tu CV</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Analizaremos tu CV en relación a los requisitos del puesto para identificar información que pueda ser mejorada o aclarada.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#7572FF] text-white rounded-full flex items-center justify-center font-semibold text-sm">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Preguntas personalizadas</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Generaremos preguntas específicas sobre los requisitos del puesto para que puedas complementar la información de tu CV.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#7572FF] text-white rounded-full flex items-center justify-center font-semibold text-sm">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Mejora tu perfil</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Tus respuestas ayudarán a construir un perfil más completo y preciso que el reclutador podrá evaluar.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Time estimate */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-purple-900">Tiempo estimado</p>
                      <p className="text-sm text-purple-700">Aproximadamente 5 minutos</p>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">¿Por qué este proceso?</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Destaca mejor tus habilidades y experiencia</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Aclara posibles malentendidos en tu CV</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Aumenta tus posibilidades de ser seleccionado</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: CV Upload */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-[#7572FF]/10 rounded-full flex items-center justify-center">
                    {selectedFile ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <FileText className="w-8 h-8 text-[#7572FF]" />
                    )}
                  </div>
                </div>

                <CardTitle className="text-2xl">
                  {selectedFile ? 'CV Seleccionado' : 'Sube tu CV'}
                </CardTitle>

                <CardDescription className="text-base mt-2">
                  {selectedFile
                    ? 'Tu CV ha sido seleccionado correctamente'
                    : 'Selecciona tu CV para comenzar el análisis'
                  }
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-50'
                      : selectedFile
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-[#7572FF] hover:bg-purple-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-4">
                    {selectedFile ? (
                      // File uploaded state
                      <div className="space-y-3">
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                        <div>
                          <p className="font-medium text-green-800">{selectedFile.name}</p>
                          <p className="text-sm text-green-600">
                            {Math.round(selectedFile.size / 1024)} KB
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedFile(null)}
                          className="border-green-500 text-green-700 hover:bg-green-100"
                        >
                          Cambiar archivo
                        </Button>
                      </div>
                    ) : (
                      // Upload area
                      <div className="space-y-4">
                        {isDragOver ? (
                          <>
                            <Download className="w-12 h-12 text-blue-500 mx-auto animate-bounce" />
                            <div>
                              <p className="font-medium text-blue-700">¡Suelta el archivo aquí!</p>
                              <p className="text-sm text-blue-600">Sube tu CV en formato PDF o Word</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                            <div>
                              <p className="font-medium text-gray-700">Arrastra y suelta tu CV aquí</p>
                              <p className="text-sm text-gray-500">o haz clic para seleccionar un archivo</p>
                            </div>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              onChange={handleFileSelect}
                              className="hidden"
                              id="cv-upload"
                            />
                            <label htmlFor="cv-upload">
                              <Button
                                variant="outline"
                                className="cursor-pointer border-[#7572FF] text-[#7572FF] hover:bg-[#7572FF] hover:text-white"
                                asChild
                              >
                                <span>Seleccionar archivo</span>
                              </Button>
                            </label>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {/* Help Text */}
                <div className="text-center bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Formatos aceptados
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX • Tamaño máximo: 5MB
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-2">
                  <Button
                    onClick={onBack}
                    variant="outline"
                    className="flex-1 border-gray-300"
                    disabled={uploading}
                  >
                    Volver
                  </Button>
                  <Button
                    onClick={handleContinue}
                    disabled={!selectedFile || uploading}
                    className={`flex-1 bg-[#7572FF] hover:bg-[#6863E8] text-white disabled:cursor-not-allowed ${
                      uploading ? '!opacity-60' : ''
                    }`}
                  >
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white opacity-100"></div>
                        {loadingMessage || 'Procesando...'}
                      </span>
                    ) : selectedFile ? (
                      candidateId ? 'Subir y Continuar' : 'Continuar'
                    ) : (
                      'Selecciona un archivo'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
