import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';
import { supabaseAdmin } from './_utils/supabase';

/**
 * POST /api/lemon-webhook
 *
 * Recibe webhooks de Lemon Squeezy cuando hay eventos de suscripción
 * Eventos soportados:
 * - subscription_created
 * - subscription_updated
 * - subscription_cancelled
 * - subscription_expired
 * - subscription_payment_success
 * - subscription_payment_failed
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
    // Verificar signature del webhook
    const signature = req.headers['x-signature'] as string;
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

    if (!secret) {
      console.error('Missing LEMON_SQUEEZY_WEBHOOK_SECRET');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verificar que la signature coincida
    const body = JSON.stringify(req.body);
    const hmac = createHmac('sha256', secret);
    const digest = hmac.update(body).digest('hex');

    if (signature !== digest) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Procesar evento
    const event = req.body;
    const eventName = event.meta.event_name;
    const subscriptionData = event.data.attributes;

    // Los datos custom están en meta.custom_data (enviados desde checkout_data.custom)
    const customData = event.meta?.custom_data;

    console.log(`Webhook received: ${eventName}`);

    // Obtener datos del recruiter desde customData
    const recruiterId = customData?.recruiter_id;
    const planName = customData?.plan_name;

    if (!recruiterId) {
      console.error('Missing recruiter_id in webhook custom data');
      return res.status(400).json({ error: 'Missing recruiter_id' });
    }

    // Procesar según tipo de evento
    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated':
      case 'subscription_payment_success':
        await handleSubscriptionActivation(
          recruiterId,
          planName,
          subscriptionData.subscription_id,
          event.data.attributes.variant_id
        );
        break;

      case 'subscription_cancelled':
      case 'subscription_expired':
      case 'subscription_payment_failed':
        await handleSubscriptionExpiration(recruiterId);
        break;

      default:
        console.log(`Unhandled event type: ${eventName}`);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Activa la suscripción del recruiter
 */
async function handleSubscriptionActivation(
  recruiterId: string,
  planName: string,
  lemonSubscriptionId: string,
  variantId: string
) {
  try {
    // Mapear variant_id a plan y límites
    const variantStarter = process.env.LEMON_SQUEEZY_VARIANT_STARTER;
    const variantPro = process.env.LEMON_SQUEEZY_VARIANT_PRO;

    let currentPlan = planName;
    let processesLimit = null;

    if (variantId === variantStarter) {
      currentPlan = 'starter';
      processesLimit = 5;
    } else if (variantId === variantPro) {
      currentPlan = 'pro';
      processesLimit = 10;
    }

    // Actualizar perfil del recruiter
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'active',
        current_plan: currentPlan,
        processes_limit: processesLimit,
        lemon_subscription_id: lemonSubscriptionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', recruiterId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw updateError;
    }

    console.log(`Subscription activated for recruiter ${recruiterId}: ${currentPlan}`);

  } catch (error) {
    console.error('Error in handleSubscriptionActivation:', error);
    throw error;
  }
}

/**
 * Expira la suscripción del recruiter y cierra sus procesos activos
 */
async function handleSubscriptionExpiration(recruiterId: string) {
  try {
    // Actualizar status a expired
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('id', recruiterId);

    if (updateError) {
      console.error('Error updating profile to expired:', updateError);
      throw updateError;
    }

    // Cerrar todos los procesos activos del recruiter
    const { error: processError } = await supabaseAdmin
      .from('processes')
      .update({
        status: 'closed',
        updated_at: new Date().toISOString()
      })
      .eq('recruiter_id', recruiterId)
      .eq('status', 'active');

    if (processError) {
      console.error('Error closing processes:', processError);
      throw processError;
    }

    console.log(`Subscription expired for recruiter ${recruiterId}, processes closed`);

  } catch (error) {
    console.error('Error in handleSubscriptionExpiration:', error);
    throw error;
  }
}
