import type { VercelRequest, VercelResponse } from '@vercel/node';
import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

/**
 * POST /api/create-checkout
 *
 * Crea una sesión de checkout en Lemon Squeezy para que el usuario se suscriba
 *
 * Body:
 * - variantId: ID del variant del producto en Lemon Squeezy
 * - recruiterId: ID del recruiter que se está suscribiendo
 * - email: Email del recruiter
 * - planName: Nombre del plan ('starter' | 'pro')
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
    const { variantId, recruiterId, email, planName } = req.body;

    // Validar parámetros requeridos
    if (!variantId || !recruiterId || !email || !planName) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros requeridos: variantId, recruiterId, email, planName'
      });
    }

    // Configurar Lemon Squeezy SDK
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

    if (!apiKey || !storeId) {
      console.error('Missing Lemon Squeezy environment variables');
      return res.status(500).json({
        success: false,
        error: 'Configuración de pagos incompleta'
      });
    }

    lemonSqueezySetup({ apiKey });

    // Crear checkout en Lemon Squeezy
    const checkoutResponse = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_options: {
              embed: true,
              media: false,
              logo: true,
              desc: true,
              discount: true,
              dark: false,
              subscription_preview: true,
              button_color: '#7572FF'
            },
            checkout_data: {
              email: email,
              custom: {
                recruiter_id: recruiterId,
                plan_name: planName
              }
            },
            expires_at: null,
            preview: false,
            test_mode: false
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: storeId
              }
            },
            variant: {
              data: {
                type: 'variants',
                id: variantId
              }
            }
          }
        }
      })
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json();
      console.error('Lemon Squeezy checkout error:', errorData);
      return res.status(500).json({
        success: false,
        error: 'Error al crear sesión de pago'
      });
    }

    const checkoutData = await checkoutResponse.json();
    const checkoutUrl = checkoutData.data.attributes.url;

    // Retornar URL del checkout
    return res.status(200).json({
      success: true,
      checkoutUrl
    });

  } catch (error) {
    console.error('Create checkout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno al crear checkout'
    });
  }
}
