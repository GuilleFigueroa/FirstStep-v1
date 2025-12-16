// Edge Function: get-customer-portal
// Obtiene la URL del Customer Portal de Lemon Squeezy para gestionar suscripción

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crear cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Parsear body
    const { recruiterId } = await req.json()

    if (!recruiterId) {
      return new Response(
        JSON.stringify({ success: false, error: 'recruiterId es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener profile desde Supabase
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('lemon_subscription_id, subscription_status')
      .eq('id', recruiterId)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuario no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar suscripción activa
    if (profile.subscription_status !== 'active' || !profile.lemon_subscription_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'No tienes una suscripción activa' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obtener API key de Lemon Squeezy
    const apiKey = Deno.env.get('LEMON_SQUEEZY_API_KEY')

    if (!apiKey) {
      console.error('Missing LEMON_SQUEEZY_API_KEY')
      return new Response(
        JSON.stringify({ success: false, error: 'Configuración de pagos incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Llamar a Lemon Squeezy API
    const lemonResponse = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${profile.lemon_subscription_id}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/vnd.api+json'
        }
      }
    )

    if (!lemonResponse.ok) {
      const errorData = await lemonResponse.json()
      console.error('Lemon Squeezy API error:', errorData)
      return new Response(
        JSON.stringify({ success: false, error: 'Error al obtener información de suscripción' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await lemonResponse.json()
    const portalUrl = data.data.attributes.urls.customer_portal

    if (!portalUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL del portal no disponible' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Retornar URL exitosamente
    return new Response(
      JSON.stringify({ success: true, portalUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Get customer portal error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Error interno al obtener portal' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
