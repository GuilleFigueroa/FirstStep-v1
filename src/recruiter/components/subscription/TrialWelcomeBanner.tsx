import { Sparkles, ArrowRight, Check } from 'lucide-react';
import type { Profile } from '../../../shared/services/supabase';

interface TrialWelcomeBannerProps {
  userProfile: Profile;
  onClose: () => void;
}

export function TrialWelcomeBanner({ userProfile, onClose }: TrialWelcomeBannerProps) {
  const calculateDaysRemaining = () => {
    if (!userProfile.trial_ends_at) return 7;
    const trialEnd = new Date(userProfile.trial_ends_at);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = calculateDaysRemaining();

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="max-w-md w-full">
          <div className="relative bg-card border border-purple-500/20 rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_4px_8px_rgba(0,0,0,0.1),0_16px_32px_rgba(0,0,0,0.12)]">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>

            <div className="relative z-10">
              <div className="mb-4 inline-flex items-center justify-center p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <Sparkles className="h-5 w-5 text-purple-500" strokeWidth={1.5} />
              </div>

              <h2 className="text-2xl mb-2">¡Bienvenido a FirstStep! 🎉</h2>

              <p className="text-muted-foreground leading-relaxed mb-6 text-sm">
                Tu período de prueba de <span className="font-semibold text-purple-600">{daysRemaining} días</span> ha comenzado.
                Disfruta de acceso completo a todas las funcionalidades sin restricciones.
              </p>

              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6"></div>

              <div className="space-y-2.5 mb-6">
                <div className="flex items-start gap-3 text-sm">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-foreground/80">Crea procesos de reclutamiento ilimitados</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-foreground/80">Acceso completo a todas las funcionalidades</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-foreground/80">Sin tarjeta de crédito requerida durante el trial</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-foreground/80">Puedes cancelar en cualquier momento</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full group relative overflow-hidden bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 hover:shadow-xl hover:shadow-purple-600/30 active:scale-[0.98]"
              >
                <span>Continuar</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            El trial vence el{' '}
            <span className="text-foreground font-medium">
              {userProfile.trial_ends_at ? new Date(userProfile.trial_ends_at).toLocaleDateString('es-AR') : 'en 7 días'}
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
