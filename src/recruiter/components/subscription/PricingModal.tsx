import { X, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import type { Profile } from '../../../shared/services/supabase';

interface PricingModalProps {
  userProfile: Profile;
  onClose: () => void;
}

export function PricingModal({ userProfile, onClose }: PricingModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (variantId: string, planName: string) => {
    setLoadingPlan(planName);

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

      // Abrir checkout de Lemon Squeezy en nueva pestaña
      window.open(data.checkoutUrl, '_blank');
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Error al procesar el pago. Intenta nuevamente.');
    } finally {
      setLoadingPlan(null);
    }
  };

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
      <div
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="w-full" style={{ maxWidth: '880px' }}>
          <div className="relative bg-card border border-purple-500/20 rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_4px_8px_rgba(0,0,0,0.1),0_16px_32px_rgba(0,0,0,0.12)]">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>

            <div className="relative z-10">
              {/* Botón X */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-semibold mb-2">Planes de FirstStep</h2>
                <p className="text-muted-foreground">
                  Elige el plan que mejor se adapte a tus necesidades
                </p>
              </div>

              {/* Cards de Planes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Plan Starter */}
                <div className="relative bg-card border border-purple-500/20 rounded-xl p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_4px_8px_rgba(0,0,0,0.1)]">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 via-transparent to-transparent pointer-events-none"></div>

                  <div className="relative z-10">
                    <h3 className="text-xl font-semibold mb-2">Starter</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-purple-600">US$ 15</span>
                      <span className="text-muted-foreground">/mes</span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      Para freelancers que quieren mejorar su productividad
                    </p>

                    <div className="space-y-2 mb-6 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">✓</span>
                        <span className="text-foreground">5 procesos activos</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">✓</span>
                        <span className="text-foreground">Candidatos ilimitados</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">✓</span>
                        <span className="text-foreground">Scoring de alineación preciso</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">✓</span>
                        <span className="text-foreground">Gestión de procesos</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCheckout(import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_STARTER, 'Starter')}
                      disabled={loadingPlan !== null}
                      className="w-full group relative overflow-hidden bg-destructive hover:bg-destructive/90 text-white px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-destructive/20 hover:shadow-xl hover:shadow-destructive/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <span>{loadingPlan === 'Starter' ? 'Procesando...' : 'Suscribirse'}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>

                {/* Plan Pro */}
                <div className="relative bg-card border border-purple-500/20 rounded-xl p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_4px_8px_rgba(0,0,0,0.1)]">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>

                  <div className="relative z-10">
                    <h3 className="text-xl font-semibold mb-2">Pro</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-purple-600">US$ 35</span>
                      <span className="text-muted-foreground">/mes</span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      Para reclutadores con más volumen y agencias en crecimiento
                    </p>

                    <div className="space-y-2 mb-6 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">✓</span>
                        <span className="text-foreground">10 procesos activos</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">✓</span>
                        <span className="text-foreground">Todo lo del Starter +</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">✓</span>
                        <span className="text-foreground">Reportes ampliados</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">✓</span>
                        <span className="text-foreground">Soporte prioritario</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCheckout(import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_PRO, 'Pro')}
                      disabled={loadingPlan !== null}
                      className="w-full group relative overflow-hidden bg-destructive hover:bg-destructive/90 text-white px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-destructive/20 hover:shadow-xl hover:shadow-destructive/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <span>{loadingPlan === 'Pro' ? 'Procesando...' : 'Suscribirse'}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>

                {/* Plan Corporate */}
                <div className="relative bg-card border border-purple-500/20 rounded-xl p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_4px_8px_rgba(0,0,0,0.1)]">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>

                  <div className="relative z-10">
                    <h3 className="text-xl font-semibold mb-2">Corporate</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-purple-600">Personalizado</span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      Para equipos o empresas con necesidades avanzadas
                    </p>

                    <div className="space-y-2 mb-6 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">✓</span>
                        <span className="text-foreground">Procesos ilimitados</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">✓</span>
                        <span className="text-foreground">Personalización completa</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">✓</span>
                        <span className="text-foreground">Soporte dedicado</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">✓</span>
                        <span className="text-foreground">Integraciones personalizadas</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        window.open('https://www.linkedin.com/company/firststep-app/', '_blank');
                      }}
                      disabled={loadingPlan !== null}
                      className="w-full group relative overflow-hidden bg-destructive hover:bg-destructive/90 text-white px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-destructive/20 hover:shadow-xl hover:shadow-destructive/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <span>Contactar</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer con info del trial */}
              {userProfile.subscription_status === 'trialing' && (
                <div className="text-center text-sm text-muted-foreground">
                  💡 Estás en período de prueba ({daysRemaining} días restantes)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
