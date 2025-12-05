export interface SubscriptionPlan {
  id: string
  plan_name: string
  display_name: string
  description: string | null
  price_usd: number
  max_active_processes: number | null
  features: Record<string, any> | null
  is_active: boolean
  is_custom: boolean
  requires_contact: boolean
  sort_order: number | null
}

export interface SubscriptionStatus {
  currentPlan: string
  subscriptionStatus: string
  trialEndsAt: string | null
  processesLimit: number | null
  daysRemaining: number | null
}

export interface SubscriptionStatusResponse {
  success: boolean
  data?: SubscriptionStatus
  error?: string
}

export interface PlansResponse {
  success: boolean
  plans?: SubscriptionPlan[]
  error?: string
}

/**
 * Obtiene el estado actual de la suscripción del recruiter
 */
export async function getSubscriptionStatus(recruiterId: string): Promise<SubscriptionStatusResponse> {
  try {
    const response = await fetch(`/api/subscription?recruiterId=${recruiterId}`)
    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Error al obtener estado de suscripción'
      }
    }

    return data
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return {
      success: false,
      error: 'Error de conexión al obtener estado de suscripción'
    }
  }
}

/**
 * Obtiene todos los planes de suscripción disponibles
 */
export async function getSubscriptionPlans(): Promise<PlansResponse> {
  try {
    const response = await fetch('/api/subscription')
    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Error al obtener planes'
      }
    }

    return data
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return {
      success: false,
      error: 'Error de conexión al obtener planes'
    }
  }
}
