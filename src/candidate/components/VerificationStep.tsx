import { useState, useEffect } from 'react';
import { loadCaptchaEnginge, LoadCanvasTemplate, validateCaptcha } from 'react-simple-captcha';
import { Button } from '../../ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/components/ui/card';
import { Badge } from '../../ui/components/ui/badge';
import { ArrowLeft, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface VerificationStepProps {
  onVerified: () => void;
  onBack: () => void;
}

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'failed';

export function VerificationStep({ onVerified, onBack }: VerificationStepProps) {
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [attempts, setAttempts] = useState(0);
  const [userInput, setUserInput] = useState('');
  const maxAttempts = 3;

  useEffect(() => {
    loadCaptchaEnginge(6); // Generate captcha with 6 characters
  }, []);

  const handleVerify = async () => {
    if (!userInput.trim()) {
      return;
    }

    setStatus('verifying');

    // Simulate small delay for UX
    await new Promise(resolve => setTimeout(resolve, 800));

    if (validateCaptcha(userInput)) {
      setStatus('success');
      setTimeout(() => {
        onVerified();
      }, 1500);
    } else {
      setStatus('failed');
      setAttempts(prev => prev + 1);
      setUserInput('');

      setTimeout(() => {
        if (attempts + 1 < maxAttempts) {
          setStatus('idle');
          loadCaptchaEnginge(6); // Reload captcha
        }
      }, 2000);
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setAttempts(0);
    setUserInput('');
    loadCaptchaEnginge(6);
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
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-[#7572FF] font-semibold">Verificación de Seguridad</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                status === 'success'
                  ? 'bg-green-100'
                  : status === 'failed'
                    ? 'bg-red-100'
                    : 'bg-[#7572FF]/10'
              }`}>
                {status === 'success' ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : status === 'failed' ? (
                  <AlertCircle className="w-8 h-8 text-red-600" />
                ) : (
                  <Shield className="w-8 h-8 text-[#7572FF]" />
                )}
              </div>
            </div>

            <CardTitle className="text-2xl">
              {status === 'success' ? 'Verificación Exitosa' : 'Verificación de Seguridad'}
            </CardTitle>

            <CardDescription className="text-base mt-2">
              {status === 'success'
                ? 'Has verificado que eres humano. Redirigiendo...'
                : 'Desliza el rompecabezas para continuar con tu postulación'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Status Messages */}
            {status === 'failed' && attempts < maxAttempts && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    Verificación fallida
                  </span>
                </div>
                <p className="text-sm text-red-700">
                  Intenta nuevamente. Te quedan {maxAttempts - attempts - 1} intentos.
                </p>
              </div>
            )}

            {attempts >= maxAttempts && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    Máximo de intentos alcanzado
                  </span>
                </div>
                <p className="text-sm text-red-700 mb-3">
                  Has excedido el número máximo de intentos. Intenta más tarde.
                </p>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="text-red-700 border-red-300 hover:bg-red-50"
                >
                  Intentar nuevamente
                </Button>
              </div>
            )}

            {/* Captcha Component */}
            {status !== 'success' && attempts < maxAttempts && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    Ingresa el código para verificar
                  </Badge>
                </div>

                <div className="space-y-4">
                  {/* Captcha Image */}
                  <div className="flex justify-center">
                    <div className="border-2 border-gray-300 rounded-lg p-4 bg-white shadow-sm">
                      <LoadCanvasTemplate />
                    </div>
                  </div>

                  {/* Input Field */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 text-center">
                      Ingresa el código que ves arriba
                    </label>
                    <div className="flex flex-col items-center space-y-3">
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Ingresa el código"
                        className="w-48 px-4 py-3 text-center text-lg font-mono border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7572FF] focus:border-[#7572FF] transition-colors"
                        disabled={status === 'verifying'}
                        maxLength={6}
                      />
                      <Button
                        onClick={handleVerify}
                        disabled={status === 'verifying' || !userInput.trim()}
                        className="bg-[#7572FF] hover:bg-[#6863E8] text-white px-8 py-2.5 text-sm font-medium"
                      >
                        Verificar
                      </Button>
                    </div>
                  </div>

                  {status === 'verifying' && (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-4 h-4 border-2 border-[#7572FF]/30 border-t-[#7572FF] rounded-full animate-spin" />
                        Verificando...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-800 font-medium">
                  ¡Verificación exitosa!
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Redirigiendo automáticamente...
                </p>
              </div>
            )}

            {/* Help Text */}
            <div className="text-xs text-gray-500 text-center">
              Esta verificación nos ayuda a mantener la seguridad de la plataforma
              y garantizar que solo usuarios reales completen las postulaciones.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}