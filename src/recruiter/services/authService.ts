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
}

// Registro de nuevo reclutador
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  try {
    // Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'Error creating user' }
    }

    // Crear perfil del reclutador
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        company_name: data.companyName,
      })
      .select()
      .single()

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    return { success: true, user: profile }
  } catch (error) {
    return { success: false, error: 'Unexpected error during sign up' }
  }
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

    if (profileError || !profile) {
      return { success: false, error: 'Profile not found' }
    }

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