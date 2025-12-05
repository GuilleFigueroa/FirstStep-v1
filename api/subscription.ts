import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_utils/supabase';

/**
 * GET /api/subscription
 *
 * Endpoint combinado para suscripciones:
 * - Sin query params: Retorna planes disponibles
 * - Con ?recruiterId=X: Retorna estado de suscripción del recruiter
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Solo GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recruiterId } = req.query;

    // Si hay recruiterId → retornar estado de suscripción
    if (recruiterId) {
      return await handleSubscriptionStatus(recruiterId as string, res);
    }

    // Si no hay recruiterId → retornar planes disponibles
    return await handleSubscriptionPlans(res);

  } catch (error) {
    console.error('Subscription endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Maneja la obtención del estado de suscripción del recruiter
 */
async function handleSubscriptionStatus(
  recruiterId: string,
  res: VercelResponse
) {
  // Validar recruiterId
  if (typeof recruiterId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'recruiterId es requerido'
    });
  }

  // Obtener perfil con info de suscripción
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('current_plan, subscription_status, trial_ends_at, processes_limit')
    .eq('id', recruiterId)
    .single();

  if (profileError || !profile) {
    return res.status(404).json({
      success: false,
      error: 'Perfil no encontrado'
    });
  }

  // Calcular días restantes de trial (si aplica)
  let daysRemaining = null;
  if (profile.trial_ends_at) {
    const trialEndDate = new Date(profile.trial_ends_at);
    const now = new Date();
    const diffTime = trialEndDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    daysRemaining = diffDays > 0 ? diffDays : 0;
  }

  // Retornar respuesta
  return res.status(200).json({
    success: true,
    data: {
      currentPlan: profile.current_plan || 'none',
      subscriptionStatus: profile.subscription_status || 'none',
      trialEndsAt: profile.trial_ends_at,
      processesLimit: profile.processes_limit,
      daysRemaining
    }
  });
}

/**
 * Maneja la obtención de planes de suscripción disponibles
 */
async function handleSubscriptionPlans(res: VercelResponse) {
  // Obtener planes activos ordenados por precio
  const { data: plans, error: plansError } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price_usd', { ascending: true });

  if (plansError) {
    console.error('Error fetching plans:', plansError);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener planes'
    });
  }

  // Retornar planes
  return res.status(200).json({
    success: true,
    plans: plans || []
  });
}
