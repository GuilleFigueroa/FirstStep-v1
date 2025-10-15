import { Button } from '../../ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/components/ui/card';
import { Clock, Mail } from 'lucide-react';

interface AccountPendingProps {
  onLogout: () => void;
  userEmail?: string;
}

export function AccountPending({ onLogout, userEmail }: AccountPendingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-12 h-12 text-yellow-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Cuenta Pendiente de Aprobación</CardTitle>
          <CardDescription className="text-base mt-2">
            Tu registro fue exitoso
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-blue-900 font-medium">
                  ¿Qué significa esto?
                </p>
                <p className="text-sm text-blue-800">
                  Tu cuenta está siendo revisada por nuestro equipo. Esto es un proceso normal de seguridad para garantizar la calidad de nuestra plataforma.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Próximos pasos:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Revisaremos tu solicitud en las próximas 24-48 horas</li>
              <li>Recibirás un email a <span className="font-medium text-gray-900">{userEmail || 'tu correo'}</span> cuando tu cuenta sea aprobada</li>
              <li>Una vez aprobada, podrás acceder a todas las funcionalidades</li>
            </ol>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              ¿Tienes preguntas? Contáctanos y te ayudaremos.
            </p>
            <Button
              onClick={onLogout}
              variant="outline"
              className="w-full"
            >
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
