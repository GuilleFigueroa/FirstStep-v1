import { supabaseAdmin } from './supabase';

/**
 * Valida si el recruiter puede tener un proceso activo adicional según su plan
 * Retorna { canProceed: true } si puede crear/reactivar
 * Retorna { canProceed: false, error, reason } si alcanzó el límite
 */
export async function validateProcessLimit(
  recruiterId: string,
  excludeProcessId?: string // Para excluir el proceso que se está reactivando del conteo
): Promise<{
  canProceed: boolean;
  error?: string;
  reason?: string;
  currentCount?: number;
  limit?: number;
}> {
  try {
    // 1. Obtener perfil con info de suscripción
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_status, current_plan, processes_limit')
      .eq('id', recruiterId)
      .single();

    if (profileError || !profile) {
      return {
        canProceed: false,
        error: 'Perfil no encontrado',
        reason: 'profile_not_found'
      };
    }

    const { subscription_status, current_plan, processes_limit } = profile;

    // 2. VALIDACIÓN: Trial expirado → BLOQUEAR
    if (subscription_status === 'expired') {
      return {
        canProceed: false,
        error: 'Tu período de prueba ha finalizado. Suscríbete para continuar usando FirstStep.',
        reason: 'trial_expired'
      };
    }

    // 3. VALIDACIÓN: Plan pago → verificar límites
    // Si processes_limit es null, significa sin límite (trial o corporate)
    if (subscription_status === 'active' && processes_limit !== null) {
      // Contar procesos activos actuales
      let query = supabaseAdmin
        .from('processes')
        .select('*', { count: 'exact', head: true })
        .eq('recruiter_id', recruiterId)
        .eq('status', 'active');

      // Si estamos reactivando un proceso, excluirlo del conteo
      // (porque aún tiene status 'closed' o 'paused')
      if (excludeProcessId) {
        query = query.neq('id', excludeProcessId);
      }

      const { count: activeProcessCount, error: countError } = await query;

      if (countError) {
        console.error('Error counting active processes:', countError);
        return {
          canProceed: false,
          error: 'Error al validar límite de procesos',
          reason: 'count_error'
        };
      }

      const currentCount = activeProcessCount || 0;

      // Si alcanzó el límite → BLOQUEAR
      if (currentCount >= processes_limit) {
        return {
          canProceed: false,
          error: `Has alcanzado el límite de ${processes_limit} procesos activos de tu plan ${current_plan}. Ve a Gestión de Procesos para cerrar o pausar procesos existentes, o actualiza tu plan.`,
          reason: 'limit_reached',
          currentCount,
          limit: processes_limit
        };
      }

      // Tiene espacio disponible
      return {
        canProceed: true,
        currentCount,
        limit: processes_limit
      };
    }

    // 4. Trial o Corporate (sin límite) → PERMITIR
    return {
      canProceed: true
    };

  } catch (error) {
    console.error('Error validating process limit:', error);
    return {
      canProceed: false,
      error: 'Error al validar límite de procesos',
      reason: 'unexpected_error'
    };
  }
}
