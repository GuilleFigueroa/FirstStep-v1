import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_utils/supabase';

/**
 * Cron Job: Expirar trials y cerrar procesos
 *
 * Se ejecuta diariamente a las 3 AM (configurado en vercel.json)
 *
 * Lógica:
 * 1. Busca profiles con trial vencido (trial_ends_at < NOW() y status = 'trialing')
 * 2. Para cada profile:
 *    - Actualiza subscription_status a 'expired'
 *    - Cierra todos sus procesos activos (status = 'closed')
 * 3. Retorna log de ejecución
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    console.log('[CRON] Iniciando proceso de expiración de trials...');

    // 1. Buscar profiles con trial vencido
    const { data: expiredProfiles, error: selectError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, first_name, last_name, trial_ends_at')
      .eq('subscription_status', 'trialing')
      .lt('trial_ends_at', new Date().toISOString());

    if (selectError) {
      console.error('[CRON] Error al buscar profiles:', selectError);
      return res.status(500).json({
        success: false,
        error: 'Error al buscar profiles con trial expirado',
        details: selectError.message
      });
    }

    if (!expiredProfiles || expiredProfiles.length === 0) {
      console.log('[CRON] No hay trials expirados para procesar');
      return res.status(200).json({
        success: true,
        message: 'No hay trials expirados',
        processed: 0,
        profiles: [],
        processes_closed: 0
      });
    }

    console.log(`[CRON] Encontrados ${expiredProfiles.length} trials expirados`);

    // 2. Procesar cada profile expirado
    const results = [];
    let totalProcessesClosed = 0;

    for (const profile of expiredProfiles) {
      console.log(`[CRON] Procesando profile: ${profile.email} (${profile.id})`);

      try {
        // 2.1. Actualizar status del profile a 'expired'
        const { error: updateProfileError } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);

        if (updateProfileError) {
          console.error(`[CRON] Error al actualizar profile ${profile.id}:`, updateProfileError);
          results.push({
            profile_id: profile.id,
            email: profile.email,
            success: false,
            error: updateProfileError.message
          });
          continue;
        }

        // 2.2. Cerrar todos los procesos activos del recruiter
        const { data: closedProcesses, error: updateProcessesError } = await supabaseAdmin
          .from('processes')
          .update({
            status: 'closed',
            updated_at: new Date().toISOString()
          })
          .eq('recruiter_id', profile.id)
          .eq('status', 'active')
          .select('id, title');

        if (updateProcessesError) {
          console.error(`[CRON] Error al cerrar procesos de ${profile.id}:`, updateProcessesError);
          results.push({
            profile_id: profile.id,
            email: profile.email,
            success: false,
            error: updateProcessesError.message
          });
          continue;
        }

        const processesClosed = closedProcesses?.length || 0;
        totalProcessesClosed += processesClosed;

        console.log(`[CRON] Profile ${profile.email}: ${processesClosed} procesos cerrados`);

        results.push({
          profile_id: profile.id,
          email: profile.email,
          success: true,
          processes_closed: processesClosed,
          process_titles: closedProcesses?.map(p => p.title) || []
        });

      } catch (profileError) {
        console.error(`[CRON] Error procesando profile ${profile.id}:`, profileError);
        results.push({
          profile_id: profile.id,
          email: profile.email,
          success: false,
          error: profileError instanceof Error ? profileError.message : 'Error desconocido'
        });
      }
    }

    // 3. Retornar resumen de ejecución
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`[CRON] Proceso completado: ${successCount} exitosos, ${failureCount} fallidos, ${totalProcessesClosed} procesos cerrados`);

    return res.status(200).json({
      success: true,
      message: 'Proceso de expiración completado',
      processed: expiredProfiles.length,
      successful: successCount,
      failed: failureCount,
      processes_closed: totalProcessesClosed,
      results
    });

  } catch (error) {
    console.error('[CRON] Error fatal en cron job:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fatal en proceso de expiración',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
