import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_utils/supabase';

/**
 * GET /api/subscription/plans
 *
 * Devuelve todos los planes de suscripción activos
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

  } catch (error) {
    console.error('Error in plans endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener planes de suscripción'
    });
  }
}
