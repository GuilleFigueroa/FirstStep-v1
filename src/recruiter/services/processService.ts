import { supabase } from '../../shared/services/supabase'
import type { Process } from '../../shared/services/supabase'
import type { JobProfile, JobPosting } from '../../app/App'

export interface CreateProcessData {
  profile: JobProfile
  companyName: string
  jobTitle: string
  candidateLimit?: number
  recruiterId: string
}

export interface ProcessResponse {
  success: boolean
  process?: Process
  error?: string
}

export interface ProcessListResponse {
  success: boolean
  processes?: Process[]
  error?: string
}

export interface ValidateProcessLimitResponse {
  success: boolean
  canCreate: boolean
  reason: string
  message: string
  currentCount: number
  limit: number | null
  error?: string
}

// Validar si puede crear un nuevo proceso según límites del plan
export async function validateProcessLimit(recruiterId: string): Promise<ValidateProcessLimitResponse> {
  try {
    const response = await fetch(`/api/validate-process-limit?recruiterId=${recruiterId}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        canCreate: false,
        reason: 'error',
        message: data.error || 'Error al validar límite de procesos',
        currentCount: 0,
        limit: null,
        error: data.error
      };
    }

    return data;
  } catch (error) {
    console.error('Error validating process limit:', error);
    return {
      success: false,
      canCreate: false,
      reason: 'error',
      message: 'Error de conexión al validar límite',
      currentCount: 0,
      limit: null,
      error: 'Error de conexión'
    };
  }
}

// Crear nuevo proceso de reclutamiento
export async function createProcess(data: CreateProcessData): Promise<ProcessResponse> {
  try {
    // Llamar al endpoint backend que valida y crea el proceso
    const response = await fetch('/api/create-process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recruiterId: data.recruiterId,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        description: data.profile.title,
        mandatoryRequirements: data.profile.mandatoryRequirements,
        optionalRequirements: data.profile.optionalRequirements,
        customPrompt: data.profile.customPrompt,
        candidateLimit: data.candidateLimit,
        formQuestions: data.profile.formQuestions
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Error al crear el proceso'
      };
    }

    return {
      success: true,
      process: result.process
    };
  } catch (error) {
    console.error('Unexpected error creating process:', error);
    return {
      success: false,
      error: 'Error de conexión al crear el proceso'
    };
  }
}

// Obtener procesos de un reclutador con conteo de candidatos
export async function getProcessesByRecruiter(recruiterId: string): Promise<ProcessListResponse> {
  try {
    const { data: processes, error } = await supabase
      .from('processes')
      .select('*')
      .eq('recruiter_id', recruiterId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching processes:', error)
      return { success: false, error: error.message }
    }

    // Obtener conteo de candidatos por proceso (solo los que completaron todo el proceso)
    if (processes && processes.length > 0) {
      const processIds = processes.map(p => p.id)

      const { data: candidateCounts, error: countError } = await supabase
        .from('candidates')
        .select('process_id')
        .in('process_id', processIds)
        .eq('status', 'completed') // Solo contar candidatos aprobados que completaron el proceso

      if (countError) {
        console.error('Error fetching candidate counts:', countError)
        // No retornar error, solo usar conteo 0
      }

      // Crear mapa de conteos
      const countsMap: Record<string, number> = {}
      candidateCounts?.forEach(c => {
        countsMap[c.process_id] = (countsMap[c.process_id] || 0) + 1
      })

      // Agregar conteo a cada proceso
      const processesWithCounts = processes.map(p => ({
        ...p,
        candidate_count: countsMap[p.id] || 0
      }))

      return { success: true, processes: processesWithCounts }
    }

    return { success: true, processes: processes || [] }
  } catch (error) {
    console.error('Unexpected error fetching processes:', error)
    return { success: false, error: 'Error inesperado al obtener procesos' }
  }
}

// Obtener proceso por unique link con información del reclutador
export async function getProcessByUniqueId(uniqueId: string): Promise<ProcessResponse> {
  try {
    // Buscar por el uniqueId en el unique_link (ignorando el dominio/puerto)
    // Esto permite que funcione en diferentes entornos (dev/prod)
    const { data: processes, error } = await supabase
      .from('processes')
      .select(`
        *,
        recruiter:profiles!recruiter_id (
          first_name,
          last_name
        )
      `)
      .eq('status', 'active')
      .like('unique_link', `%/apply/${uniqueId}`)

    if (error) {
      console.error('Error fetching process by unique link:', error)
      return { success: false, error: 'Proceso no encontrado o inactivo' }
    }

    if (!processes || processes.length === 0) {
      return { success: false, error: 'Proceso no encontrado o inactivo' }
    }

    // Agregar nombre del reclutador al proceso
    const process = processes[0]
    const recruiterData = (process as any).recruiter
    const recruiterName = recruiterData
      ? `${recruiterData.first_name} ${recruiterData.last_name}`
      : process.company_name

    return {
      success: true,
      process: {
        ...process,
        recruiter_name: recruiterName
      }
    }
  } catch (error) {
    console.error('Unexpected error fetching process:', error)
    return { success: false, error: 'Error inesperado al obtener el proceso' }
  }
}

// Actualizar estado de proceso
export async function updateProcessStatus(
  processId: string,
  status: 'active' | 'closed' | 'paused'
): Promise<ProcessResponse> {
  try {
    const { data: process, error } = await supabase
      .from('processes')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', processId)
      .select()
      .single()

    if (error) {
      console.error('Error updating process status:', error)
      return { success: false, error: error.message }
    }

    return { success: true, process }
  } catch (error) {
    console.error('Unexpected error updating process:', error)
    return { success: false, error: 'Error inesperado al actualizar proceso' }
  }
}

// Actualizar límite de candidatos de un proceso
export async function updateProcessLimit(
  processId: string,
  candidateLimit: number | null
): Promise<ProcessResponse> {
  try {
    const { data: process, error } = await supabase
      .from('processes')
      .update({
        candidate_limit: candidateLimit,
        updated_at: new Date().toISOString()
      })
      .eq('id', processId)
      .select()
      .single()

    if (error) {
      console.error('Error updating process limit:', error)
      return { success: false, error: error.message }
    }

    return { success: true, process }
  } catch (error) {
    console.error('Unexpected error updating process limit:', error)
    return { success: false, error: 'Error inesperado al actualizar límite' }
  }
}

// Eliminar proceso permanentemente (con candidatos, CVs, preguntas y respuestas)
export async function deleteProcess(
  processId: string,
  recruiterId: string
): Promise<{
  success: boolean;
  error?: string;
  deletedCandidates?: number;
  deletedCVs?: number;
}> {
  try {
    const response = await fetch('/api/delete-process', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ processId, recruiterId })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Error al eliminar el proceso'
      };
    }

    return {
      success: true,
      deletedCandidates: data.deletedCandidates || 0,
      deletedCVs: data.deletedCVs || 0
    };
  } catch (error) {
    console.error('Delete process error:', error);
    return {
      success: false,
      error: 'Error de conexión al eliminar proceso'
    };
  }
}

// Obtener proceso por ID
export async function getProcessById(processId: string): Promise<ProcessResponse> {
  try {
    const { data: process, error } = await supabase
      .from('processes')
      .select('*')
      .eq('id', processId)
      .single()

    if (error) {
      console.error('Error fetching process:', error)
      return { success: false, error: error.message }
    }

    return { success: true, process }
  } catch (error) {
    console.error('Unexpected error fetching process:', error)
    return { success: false, error: 'Error inesperado al obtener proceso' }
  }
}

// Obtener proceso por ID con conteo de candidatos (para vista de detalle)
export async function getProcessWithDetails(processId: string): Promise<ProcessResponse> {
  try {
    const { data: process, error } = await supabase
      .from('processes')
      .select('*')
      .eq('id', processId)
      .single()

    if (error) {
      console.error('Error fetching process:', error)
      return { success: false, error: error.message }
    }

    // Obtener conteo de candidatos completados para este proceso
    const { count: candidateCount, error: countError } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('process_id', processId)
      .eq('status', 'completed')

    if (countError) {
      console.error('Error fetching candidate count:', countError)
      // No retornar error, solo usar conteo 0
    }

    // Agregar conteo al proceso
    const processWithCount = {
      ...process,
      candidate_count: candidateCount || 0
    }

    return { success: true, process: processWithCount }
  } catch (error) {
    console.error('Unexpected error fetching process:', error)
    return { success: false, error: 'Error inesperado al obtener proceso' }
  }
}

// Obtener estadísticas de procesos para dashboard
export async function getProcessStats(recruiterId: string) {
  try {
    const { data: processes, error } = await supabase
      .from('processes')
      .select('id, status, created_at')
      .eq('recruiter_id', recruiterId)

    if (error) {
      console.error('Error fetching process stats:', error)
      return { success: false, error: error.message }
    }

    const stats = {
      total: processes?.length || 0,
      active: processes?.filter(p => p.status === 'active').length || 0,
      closed: processes?.filter(p => p.status === 'closed').length || 0,
      paused: processes?.filter(p => p.status === 'paused').length || 0,
      thisMonth: processes?.filter(p => {
        const created = new Date(p.created_at)
        const now = new Date()
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
      }).length || 0
    }

    return { success: true, stats }
  } catch (error) {
    console.error('Unexpected error fetching stats:', error)
    return { success: false, error: 'Error inesperado al obtener estadísticas' }
  }
}