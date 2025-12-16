import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_utils/supabase';

/**
 * POST /api/get-customer-portal
 *
 * Obtiene la URL del Customer Portal de Lemon Squeezy para que el usuario
 * pueda gestionar su suscripción (cancelar, actualizar pago, etc.)
 *
 * Body:
 * - recruiterId: ID del recruiter
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recruiterId } = req.body;

    if (!recruiterId) {
      return res.status(400).json({
        success: false,
        error: 'recruiterId es requerido'
      });
    }

    // Obtener lemon_subscription_id del profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('lemon_subscription_id, subscription_status')
      .eq('id', recruiterId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar que tenga suscripción activa
    if (profile.subscription_status !== 'active' || !profile.lemon_subscription_id) {
      return res.status(400).json({
        success: false,
        error: 'No tienes una suscripción activa'
      });
    }

    // Obtener customer portal URL de Lemon Squeezy
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;

    if (!apiKey) {
      console.error('Missing LEMON_SQUEEZY_API_KEY');
      return res.status(500).json({
        success: false,
        error: 'Configuración de pagos incompleta'
      });
    }

    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${profile.lemon_subscription_id}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/vnd.api+json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Lemon Squeezy API error:', errorData);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener información de suscripción'
      });
    }

    const data = await response.json();
    const portalUrl = data.data.attributes.urls.customer_portal;

    if (!portalUrl) {
      return res.status(500).json({
        success: false,
        error: 'URL del portal no disponible'
      });
    }

    return res.status(200).json({
      success: true,
      portalUrl
    });

  } catch (error) {
    console.error('Get customer portal error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno al obtener portal'
    });
  }
}
