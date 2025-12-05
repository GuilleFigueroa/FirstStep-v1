import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_utils/supabase';

/**
 * GET /api/validate-process-limit?recruiterId={recruiterId}
 *
 * Valida si el reclutador puede crear un nuevo proceso según su plan y límites
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
      .select('subscription_status, current_plan, processes_limit')
      .eq('id', recruiterId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        error: 'Perfil no encontrado'
      });
    }

    // 3. Evaluar según estado de suscripción
    const { subscription_status, current_plan, processes_limit } = profile;

    // Trial expirado → BLOQUEADO
    if (subscription_status === 'expired') {
      return res.status(200).json({
        success: true,
        canCreate: false,
        reason: 'trial_expired',
        message: 'Tu período de prueba ha finalizado. Suscríbete para continuar usando FirstStep.',
        currentCount: 0,
        limit: 0
      });
    }

    // Trial activo → PERMITIR sin límites
    if (subscription_status === 'trialing') {
      return res.status(200).json({
        success: true,
        canCreate: true,
        reason: 'trialing',
        message: 'Trial activo - procesos ilimitados',
        currentCount: 0,
        limit: null
      });
    }

    // Plan pago activo → VALIDAR límites
    if (subscription_status === 'active') {
      // Si no hay límite (plan Corporate) → PERMITIR
      if (processes_limit === null) {
        return res.status(200).json({
          success: true,
          canCreate: true,
          reason: 'unlimited_plan',
          message: 'Plan con procesos ilimitados',
          currentCount: 0,
          limit: null
        });
      }

      // Contar procesos activos del recruiter
      const { count: activeProcessCount, error: countError } = await supabaseAdmin
        .from('processes')
        .select('*', { count: 'exact', head: true })
        .eq('recruiter_id', recruiterId)
        .eq('status', 'active');

      if (countError) {
        console.error('Error counting active processes:', countError);
        return res.status(500).json({
          success: false,
          error: 'Error al contar procesos activos'
        });
      }

      const currentCount = activeProcessCount || 0;

      // Verificar si alcanzó el límite
      if (currentCount >= processes_limit) {
        return res.status(200).json({
          success: true,
          canCreate: false,
          reason: 'limit_reached',
          message: `Has alcanzado el límite de ${processes_limit} procesos activos de tu plan ${current_plan}. Cierra procesos existentes o actualiza tu plan.`,
          currentCount,
          limit: processes_limit
        });
      }

      // Puede crear
      return res.status(200).json({
        success: true,
        canCreate: true,
        reason: 'within_limit',
        message: `Puedes crear procesos (${currentCount}/${processes_limit} usados)`,
        currentCount,
        limit: processes_limit
      });
    }

    // Estado desconocido
    return res.status(200).json({
      success: true,
      canCreate: false,
      reason: 'unknown_status',
      message: 'Estado de suscripción desconocido',
      currentCount: 0,
      limit: 0
    });

  } catch (error) {
    console.error('Error validating process limit:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al validar límite de procesos'
    });
  }
}
