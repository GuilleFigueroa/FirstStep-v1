import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_utils/supabase';

/**
 * GET /api/subscription/status?recruiterId={recruiterId}
 *
 * Devuelve el estado actual de la suscripción del reclutador
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
    // 1. Validar input
    const { recruiterId } = req.query;

    if (!recruiterId || typeof recruiterId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'recruiterId es requerido'
      });
    }

    // 2. Obtener perfil con info de suscripción
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

    // 3. Calcular días restantes de trial (si aplica)
    let daysRemaining = null;
    if (profile.trial_ends_at) {
      const trialEndDate = new Date(profile.trial_ends_at);
      const now = new Date();
      const diffTime = trialEndDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysRemaining = diffDays > 0 ? diffDays : 0;
    }

    // 4. Retornar respuesta
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

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener estado de suscripción'
    });
  }
}
