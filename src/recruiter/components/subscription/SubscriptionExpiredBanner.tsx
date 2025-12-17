import { useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import type { Profile } from '../../../shared/services/supabase';
import { PricingModal } from './PricingModal';

interface SubscriptionExpiredBannerProps {
  userProfile: Profile;
}

export function SubscriptionExpiredBanner({ userProfile }: SubscriptionExpiredBannerProps) {
  const [showPricingModal, setShowPricingModal] = useState(false);
  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="max-w-md w-full">
          <div className="relative bg-card border border-purple-500/20 rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_4px_8px_rgba(0,0,0,0.1),0_16px_32px_rgba(0,0,0,0.12)]">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 via-transparent to-destructive/5 pointer-events-none"></div>

            <div className="relative z-10">
              <div className="mb-4 inline-flex items-center justify-center p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <Clock className="h-5 w-5 text-purple-500" strokeWidth={1.5} />
              </div>

              <h2 className="text-2xl mb-2">Tu período de prueba ha terminado</h2>

              <p className="text-muted-foreground leading-relaxed mb-6 text-sm">
                Han pasado 7 días desde que comenzaste tu prueba gratuita. Suscríbete ahora para continuar disfrutando de todas las funcionalidades de FirstStep.
              </p>

              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6"></div>

              <div className="space-y-2.5 mb-6">
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-purple-600 flex-shrink-0">•</span>
                  <span className="text-foreground/80">Los procesos se cerraron temporalmente</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-purple-600 flex-shrink-0">•</span>
                  <span className="text-foreground/80">Los candidatos que aplicaron se guardan en base de datos en caso de suscribirse</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <span className="text-purple-600 flex-shrink-0">•</span>
                  <span className="text-foreground/80">Los procesos se pueden reabrir una vez suscripto</span>
                </div>
              </div>

              <button
                onClick={() => setShowPricingModal(true)}
                className="w-full group relative overflow-hidden bg-destructive hover:bg-destructive/90 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-destructive/20 hover:shadow-xl hover:shadow-destructive/30 active:scale-[0.98]"
              >
                <span>Ver planes</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPricingModal && (
        <PricingModal
          userProfile={userProfile}
          onClose={() => setShowPricingModal(false)}
        />
      )}
    </>
  );
}
