import { useState, useEffect } from 'react';
import { Button } from '../../../ui/components/ui/button';
import { Input } from '../../../ui/components/ui/input';
import { Label } from '../../../ui/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../ui/components/ui/popover';
import { AlertCircle } from 'lucide-react';

interface ModifyLimitPopoverProps {
  currentLimit: number | null | undefined;
  currentApplicants: number;
  onConfirm: (newLimit: number | null) => Promise<void>;
  children?: React.ReactNode;
  // Props para mantener compatibilidad con uso anterior (Dialog)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  processTitle?: string;
}

export function ModifyLimitDialog({
  currentLimit,
  currentApplicants,
  onConfirm,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: ModifyLimitPopoverProps) {
  // Si se pasa children, usar Popover (nuevo comportamiento)
  // Si NO se pasa children, usar estado controlado para backward compatibility
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;

  const [newLimit, setNewLimit] = useState<string>('');
  const [noLimit, setNoLimit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar valores cuando se abre el popover
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
        setOpen(false);
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
      setError('Debe ser un número positivo');
      return;
    }

    if (limit < currentApplicants) {
      setError(`Mínimo: ${currentApplicants}`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(limit);
      setOpen(false);
    } catch (err) {
      setError('Error al actualizar');
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

  const content = (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3">
        <div className="space-y-1">
          <h4 className="font-medium text-sm">Modificar límite</h4>
          <p className="text-xs text-gray-500">Mínimo: {currentApplicants} candidatos</p>
        </div>

        {/* Input de nuevo límite */}
        <div className="space-y-1.5">
          <Input
            id="limit"
            type="number"
            min={currentApplicants}
            placeholder={`Ej: ${currentApplicants + 5}`}
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
            disabled={noLimit || isSubmitting}
            className={`h-9 text-sm ${error ? 'border-red-500' : ''}`}
          />
          {error && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3 h-3" />
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
            className="w-3.5 h-3.5 text-[#7572FF] border-gray-300 rounded focus:ring-[#7572FF]"
          />
          <Label htmlFor="no-limit" className="text-xs font-normal cursor-pointer">
            Sin límite
          </Label>
        </div>

        {/* Botones */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
            className="flex-1 h-8 text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            className="flex-1 h-8 text-xs bg-[#7572FF] hover:bg-[#6863E8] text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </form>
  );

  // Si se pasa children, renderizar como Popover
  if (children) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  // Si NO se pasa children, renderizar solo el contenido (para backward compatibility con dialog controlado)
  // En este caso el padre es responsable de envolver en Dialog/Modal
  if (open) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
        <div className="relative bg-white rounded-lg shadow-lg p-6 w-72 z-50">
          {content}
        </div>
      </div>
    );
  }

  return null;
}
