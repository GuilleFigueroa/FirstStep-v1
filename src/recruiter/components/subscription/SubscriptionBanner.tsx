import { useState } from 'react'
import { AlertCircle, Clock, Crown } from 'lucide-react'
import { Alert, AlertDescription } from '../../../ui/components/ui/alert'
import type { SubscriptionStatus } from '../../services/subscriptionService'
import type { Profile } from '../../../shared/services/supabase'
import { PricingModal } from './PricingModal'

interface SubscriptionBannerProps {
  status: SubscriptionStatus
  userProfile?: Profile | null
}

export function SubscriptionBanner({ status, userProfile }: SubscriptionBannerProps) {
  const [showPricingModal, setShowPricingModal] = useState(false)
  const { subscriptionStatus, currentPlan, daysRemaining } = status

  // No mostrar nada si no hay información relevante
  if (subscriptionStatus === 'none' || subscriptionStatus === 'active') {
    return null
  }

  // Banner de trial activo
  if (subscriptionStatus === 'trialing' && daysRemaining !== null) {
    const isUrgent = daysRemaining <= 3
    const variant = isUrgent ? 'destructive' : 'default'

    return (
      <>
        <div className="px-6 pt-4">
          <Alert variant={variant} className="border-l-4">
            <Clock className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {isUrgent ? (
                  <strong>¡Tu trial finaliza en {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'}!</strong>
                ) : (
                  <>Trial activo - {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'} restantes</>
                )}
              </span>
              <button
                onClick={() => setShowPricingModal(true)}
                className="text-sm underline font-medium hover:no-underline"
              >
                Ver planes
              </button>
            </AlertDescription>
          </Alert>
        </div>
        {showPricingModal && userProfile && (
          <PricingModal
            userProfile={userProfile}
            onClose={() => setShowPricingModal(false)}
          />
        )}
      </>
    )
  }

  // Banner de trial expirado
  if (subscriptionStatus === 'expired') {
    return (
      <div className="px-6 pt-4">
        <Alert variant="destructive" className="border-l-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span>
              <strong>Tu trial ha finalizado.</strong> Suscríbete para continuar usando FirstStep.
            </span>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Banner de plan activo (no trial)
  if (subscriptionStatus === 'active' && currentPlan !== 'trial') {
    return (
      <div className="px-6 pt-4">
        <Alert className="border-l-4 border-purple-500 bg-purple-50">
          <Crown className="h-4 w-4 text-purple-600" />
          <AlertDescription>
            <span className="text-purple-900">
              Plan <strong>{currentPlan}</strong> activo
            </span>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return null
}
