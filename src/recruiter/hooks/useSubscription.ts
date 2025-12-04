import { useState, useEffect } from 'react'
import { getSubscriptionStatus, type SubscriptionStatus } from '../services/subscriptionService'

interface UseSubscriptionResult {
  status: SubscriptionStatus | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook para obtener y manejar el estado de suscripción del recruiter
 */
export function useSubscription(recruiterId: string | undefined): UseSubscriptionResult {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    if (!recruiterId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await getSubscriptionStatus(recruiterId)

      if (response.success && response.data) {
        setStatus(response.data)
      } else {
        setError(response.error || 'Error al obtener estado de suscripción')
      }
    } catch (err) {
      setError('Error inesperado al obtener estado de suscripción')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [recruiterId])

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus
  }
}
