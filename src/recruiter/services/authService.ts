import { supabase } from '../../shared/services/supabase'
import type { Profile } from '../../shared/services/supabase'

export interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
  companyName?: string
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  user?: Profile
  error?: string
  needsEmailVerification?: boolean
}

// Registro de nuevo reclutador
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  try {
    // Crear usuario en Auth (almacenamos datos para usar después de verificación)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          company_name: data.companyName,
        }
      }
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'Error creating user' }
    }

    // Crear perfil inmediatamente (sin verificación de email)
    return await createUserProfile(authData.user, data)
  } catch (error) {
    return { success: false, error: 'Unexpected error during sign up' }
  }
}

// Función auxiliar para crear perfil de usuario
async function createUserProfile(user: any, signUpData: SignUpData): Promise<AuthResponse> {
  // Calcular fecha de fin del trial (7 días desde ahora)
  const trialEndDate = new Date()
  trialEndDate.setDate(trialEndDate.getDate() + 7)

  // Crear perfil con campos de suscripción
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: signUpData.email,
      first_name: signUpData.firstName,
      last_name: signUpData.lastName,
      company_name: signUpData.companyName,
      account_status: 'approved',  // ⭐ Nuevos usuarios comienzan aprobados
      current_plan: 'trial',
      subscription_status: 'trialing',
      trial_ends_at: trialEndDate.toISOString(),
      processes_limit: null,  // null = sin límite durante trial
    })
    .select()
    .single()

  if (profileError) {
    return { success: false, error: profileError.message }
  }

  // Crear registro de suscripción en estado trial
  const { error: subscriptionError } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: user.id,
      status: 'trialing',
      trial_start_date: new Date().toISOString(),
      trial_end_date: trialEndDate.toISOString(),
      is_trial_used: false,
    })

  if (subscriptionError) {
    // Si falla la creación de la suscripción, log pero no bloquear el registro
    console.error('Error creating trial subscription:', subscriptionError)
  }

  return { success: true, user: profile }
}

// Login de reclutador existente
export async function signIn(data: SignInData): Promise<AuthResponse> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'Authentication failed' }
    }

    // Obtener perfil del reclutador
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    // Si no existe el perfil, crearlo usando metadata
    if (profileError && profileError.code === 'PGRST116') {
      const userData = authData.user.user_metadata
      if (userData.first_name && userData.last_name) {
        return await createUserProfile(authData.user, {
          email: authData.user.email!,
          password: '', // No necesitamos la contraseña aquí
          firstName: userData.first_name,
          lastName: userData.last_name,
          companyName: userData.company_name
        })
      } else {
        return { success: false, error: 'Profile not found and missing required data to create it.' }
      }
    }

    if (profileError || !profile) {
      return { success: false, error: 'Profile not found' }
    }

    // ⭐ VALIDAR ESTADO DE APROBACIÓN
    const accountStatus = profile.account_status || 'pending'

    if (accountStatus === 'rejected') {
      // Hacer logout automático
      await supabase.auth.signOut()
      return {
        success: false,
        error: profile.rejection_reason || 'Tu cuenta fue rechazada. Contacta al administrador para más información.'
      }
    }

    if (accountStatus === 'pending') {
      // Hacer logout automático
      await supabase.auth.signOut()
      return {
        success: false,
        error: 'Tu cuenta está pendiente de aprobación. Recibirás un email cuando sea aprobada.'
      }
    }

    // Solo si account_status === 'approved' llega hasta acá
    return { success: true, user: profile }
  } catch (error) {
    return { success: false, error: 'Unexpected error during sign in' }
  }
}

// Logout
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Unexpected error during sign out' }
  }
}

// Obtener usuario actual
export async function getCurrentUser(): Promise<Profile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return profile
  } catch (error) {
    return null
  }
}

// Verificar sesión activa
export async function getSession() {
  return await supabase.auth.getSession()
}

// Solicitar recuperación de contraseña
export async function requestPasswordReset(email: string): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al solicitar recuperación de contraseña' }
  }
}

// Actualizar contraseña (desde el link del email)
export async function updatePassword(newPassword: string): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error al actualizar contraseña' }
  }
}