import { useState, useEffect } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import type { Profile } from '../../../shared/services/supabase';

interface SubscriptionExpiredBannerProps {
  userProfile: Profile;
}

export function SubscriptionExpiredBanner({ userProfile }: SubscriptionExpiredBannerProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Listener para cerrar checkout con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (window as any).LemonSqueezy) {
        (window as any).LemonSqueezy.Refresh();
        setLoadingPlan(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleCheckout = async (variantId: string, planName: string) => {
    setLoadingPlan(planName);

    // Debug: verificar que las variables existen
    console.log('Checkout params:', {
      variantId,
      recruiterId: userProfile.id,
      email: userProfile.email,
      planName
    });

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId,
          recruiterId: userProfile.id,
          email: userProfile.email,
          planName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear checkout');
      }

      // Abrir checkout de Lemon Squeezy
      if (data.checkoutUrl && typeof window !== 'undefined' && (window as any).LemonSqueezy) {
        (window as any).LemonSqueezy.Url.Open(data.checkoutUrl);
      } else {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Error al procesar el pago. Intenta nuevamente.');
    } finally {
      setLoadingPlan(null);
    }
  };
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
                onClick={() => handleCheckout(import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_STARTER, 'Starter')}
                disabled={loadingPlan !== null}
                className="w-full group relative overflow-hidden bg-destructive hover:bg-destructive/90 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-destructive/20 hover:shadow-xl hover:shadow-destructive/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loadingPlan === 'Starter' ? 'Procesando...' : 'Plan Starter - $15/mes (5 procesos)'}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                onClick={() => handleCheckout(import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_PRO, 'Pro')}
                disabled={loadingPlan !== null}
                className="w-full mt-3 group relative overflow-hidden bg-destructive hover:bg-destructive/90 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-destructive/20 hover:shadow-xl hover:shadow-destructive/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loadingPlan === 'Pro' ? 'Procesando...' : 'Plan Pro - $35/mes (10 procesos)'}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                onClick={() => {
                  window.location.href = 'mailto:contacto@firststep.com?subject=Consulta Plan Corporate';
                }}
                disabled={loadingPlan !== null}
                className="w-full mt-3 group relative overflow-hidden bg-destructive hover:bg-destructive/90 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-destructive/20 hover:shadow-xl hover:shadow-destructive/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Plan Corporate - Contactar</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            ¿Tienes alguna duda? <button className="text-foreground hover:text-purple-500 transition-colors underline underline-offset-2">Contáctanos</button>
          </p>
        </div>
      </div>
    </>
  );
}
