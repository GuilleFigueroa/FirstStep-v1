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

// Crear nuevo proceso de reclutamiento
export async function createProcess(data: CreateProcessData): Promise<ProcessResponse> {
  try {
    // Generar link único
    const uniqueId = `${data.companyName.toLowerCase().replace(/\s+/g, '-')}-${data.jobTitle.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    const uniqueLink = `${window.location.origin}/apply/${uniqueId}`

    // Convertir JobProfile a formato de BD
    const processData = {
      recruiter_id: data.recruiterId,
      title: data.jobTitle,
      company_name: data.companyName,
      description: data.profile.title,
      mandatory_requirements: data.profile.mandatoryRequirements,
      optional_requirements: data.profile.optionalRequirements,
      custom_prompt: data.profile.customPrompt,
      candidate_limit: data.candidateLimit,
      status: 'active' as const,
      unique_link: uniqueLink
    }

    const { data: process, error } = await supabase
      .from('processes')
      .insert(processData)
      .select()
      .single()

    if (error) {
      console.error('Error creating process:', error)
      return { success: false, error: error.message }
    }

    // Insertar preguntas del formulario en recruiter_questions
    if (data.profile.formQuestions && data.profile.formQuestions.length > 0) {
      const questionsToInsert = data.profile.formQuestions.map((q, index) => ({
        process_id: process.id,
        question_text: q.question,
        question_type: q.type,
        question_options: q.options || null,
        question_order: index + 1
      }))

      const { error: questionsError } = await supabase
        .from('recruiter_questions')
        .insert(questionsToInsert)

      if (questionsError) {
        console.error('Error inserting recruiter questions:', questionsError)
        // No retornar error, el proceso ya fue creado exitosamente
      }
    }

    return { success: true, process }
  } catch (error) {
    console.error('Unexpected error creating process:', error)
    return { success: false, error: 'Error inesperado al crear el proceso' }
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

// Eliminar proceso
export async function deleteProcess(processId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('processes')
      .delete()
      .eq('id', processId)

    if (error) {
      console.error('Error deleting process:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting process:', error)
    return { success: false, error: 'Error inesperado al eliminar proceso' }
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