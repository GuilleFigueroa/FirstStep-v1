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

    // Si el usuario no está confirmado, retornar para verificación
    if (!authData.user.email_confirmed_at) {
      return {
        success: true,
        needsEmailVerification: true,
        error: 'Please check your email and click the verification link to complete your registration.'
      }
    }

    // Si ya está verificado, crear perfil inmediatamente
    return await createUserProfile(authData.user, data)
  } catch (error) {
    return { success: false, error: 'Unexpected error during sign up' }
  }
}

// Función auxiliar para crear perfil de usuario
async function createUserProfile(user: any, signUpData: SignUpData): Promise<AuthResponse> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: signUpData.email,
      first_name: signUpData.firstName,
      last_name: signUpData.lastName,
      company_name: signUpData.companyName,
    })
    .select()
    .single()

  if (profileError) {
    return { success: false, error: profileError.message }
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

    // Verificar que el email esté confirmado
    if (!authData.user.email_confirmed_at) {
      return {
        success: false,
        error: 'Please verify your email before signing in. Check your email for the verification link.'
      }
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