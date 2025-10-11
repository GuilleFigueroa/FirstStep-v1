import { useState, useEffect } from 'react';
import { Button } from '../../../ui/components/ui/button';
import { Input } from '../../../ui/components/ui/input';
import { Label } from '../../../ui/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../ui/components/ui/dialog';
import { AlertCircle, Users } from 'lucide-react';

interface ModifyLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLimit: number | null | undefined;
  currentApplicants: number;
  processTitle: string;
  onConfirm: (newLimit: number | null) => Promise<void>;
}

export function ModifyLimitDialog({
  open,
  onOpenChange,
  currentLimit,
  currentApplicants,
  processTitle,
  onConfirm
}: ModifyLimitDialogProps) {
  const [newLimit, setNewLimit] = useState<string>('');
  const [noLimit, setNoLimit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar valores cuando se abre el modal
  useEffect(() => {
    if (open) {
      if (currentLimit === null || currentLimit === undefined) {
        setNoLimit(true);
        setNewLimit('');
      } else {
        setNoLimit(false);
        setNewLimit(currentLimit.toString());
      }
      setError(null);
    }
  }, [open, currentLimit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar si no hay límite
    if (noLimit) {
      try {
        setIsSubmitting(true);
        await onConfirm(null);
        onOpenChange(false);
      } catch (err) {
        setError('Error al actualizar límite');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Validar número
    const limit = parseInt(newLimit);

    if (isNaN(limit) || limit <= 0) {
      setError('El límite debe ser un número positivo');
      return;
    }

    if (limit < currentApplicants) {
      setError(`El límite no puede ser menor a ${currentApplicants} (candidatos actuales)`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(limit);
      onOpenChange(false);
    } catch (err) {
      setError('Error al actualizar límite');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNoLimitChange = (checked: boolean) => {
    setNoLimit(checked);
    setError(null);
    if (checked) {
      setNewLimit('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Modificar límite de candidatos
          </DialogTitle>
          <DialogDescription>
            Proceso: <span className="font-medium">{processTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Estado actual */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Candidatos actuales:</span> {currentApplicants}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Límite actual:</span>{' '}
                {currentLimit ? currentLimit : 'Sin límite'}
              </p>
            </div>

            {/* Input de nuevo límite */}
            <div className="space-y-2">
              <Label htmlFor="limit">Nuevo límite de candidatos</Label>
              <Input
                id="limit"
                type="number"
                min={currentApplicants}
                placeholder={`Mínimo: ${currentApplicants}`}
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                disabled={noLimit || isSubmitting}
                className={error ? 'border-red-500' : ''}
              />
              {error && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>

            {/* Checkbox sin límite */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="no-limit"
                checked={noLimit}
                onChange={(e) => handleNoLimitChange(e.target.checked)}
                disabled={isSubmitting}
                className="w-4 h-4 text-[#7572FF] border-gray-300 rounded focus:ring-[#7572FF]"
              />
              <Label htmlFor="no-limit" className="text-sm font-normal cursor-pointer">
                Sin límite (aceptar candidatos ilimitados)
              </Label>
            </div>

            {/* Advertencia */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Nota:</strong> El límite debe ser igual o mayor al número de candidatos actuales ({currentApplicants}).
                {currentLimit && currentLimit <= currentApplicants && (
                  <span className="block mt-1">
                    El proceso ya alcanzó su límite actual.
                  </span>
                )}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#7572FF] hover:bg-[#6863E8] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Actualizando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
