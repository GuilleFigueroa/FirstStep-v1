import { supabaseAdmin } from './supabase';

/**
 * Verifica que un candidato pertenece a un proceso del reclutador especificado
 * Esto previene ataques IDOR (Insecure Direct Object Reference)
 */
export async function verifyCandidateOwnership(
  candidateId: string,
  recruiterId: string
): Promise<{
  isValid: boolean;
  candidate?: any;
  error?: string;
}> {
  try {
    // Query con JOIN para verificar que:
    // 1. El candidato existe
    // 2. El proceso del candidato pertenece al reclutador
    const { data: candidate, error } = await supabaseAdmin
      .from('candidates')
      .select(`
        *,
        processes!inner (
          id,
          recruiter_id
        )
      `)
      .eq('id', candidateId)
      .eq('processes.recruiter_id', recruiterId)
      .single();

    if (error || !candidate) {
      return {
        isValid: false,
        error: 'Candidato no encontrado o no tienes permiso para acceder'
      };
    }

    return {
      isValid: true,
      candidate
    };
  } catch (error) {
    console.error('Error verifying candidate ownership:', error);
    return {
      isValid: false,
      error: 'Error al verificar permisos'
    };
  }
}

/**
 * Verifica que un proceso pertenece al reclutador especificado
 */
export async function verifyProcessOwnership(
  processId: string,
  recruiterId: string
): Promise<{
  isValid: boolean;
  process?: any;
  error?: string;
}> {
  try {
    const { data: process, error } = await supabaseAdmin
      .from('processes')
      .select('*')
      .eq('id', processId)
      .eq('recruiter_id', recruiterId)
      .single();

    if (error || !process) {
      return {
        isValid: false,
        error: 'Proceso no encontrado o no tienes permiso para acceder'
      };
    }

    return {
      isValid: true,
      process
    };
  } catch (error) {
    console.error('Error verifying process ownership:', error);
    return {
      isValid: false,
      error: 'Error al verificar permisos'
    };
  }
}
