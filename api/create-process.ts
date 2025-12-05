import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_utils/supabase';

/**
 * POST /api/create-process
 *
 * Crea un nuevo proceso de reclutamiento con validación de límites según el plan
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
    // 1. Validar input
    const {
      recruiterId,
      jobTitle,
      companyName,
      description,
      mandatoryRequirements,
      optionalRequirements,
      customPrompt,
      candidateLimit,
      formQuestions
    } = req.body;

    if (!recruiterId || !jobTitle || !companyName) {
      return res.status(400).json({
        success: false,
        error: 'recruiterId, jobTitle y companyName son requeridos'
      });
    }

    // 2. Obtener perfil con info de suscripción
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_status, current_plan, processes_limit')
      .eq('id', recruiterId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        error: 'Perfil no encontrado'
      });
    }

    const { subscription_status, current_plan, processes_limit } = profile;

    // 3. VALIDACIÓN: Trial expirado → BLOQUEAR
    if (subscription_status === 'expired') {
      return res.status(403).json({
        success: false,
        error: 'Tu período de prueba ha finalizado. Suscríbete para continuar usando FirstStep.',
        reason: 'trial_expired'
      });
    }

    // 4. VALIDACIÓN: Plan pago → verificar límites
    if (subscription_status === 'active' && processes_limit !== null) {
      // Contar procesos activos actuales
      const { count: activeProcessCount, error: countError } = await supabaseAdmin
        .from('processes')
        .select('*', { count: 'exact', head: true })
        .eq('recruiter_id', recruiterId)
        .eq('status', 'active');

      if (countError) {
        console.error('Error counting active processes:', countError);
        return res.status(500).json({
          success: false,
          error: 'Error al validar límite de procesos'
        });
      }

      const currentCount = activeProcessCount || 0;

      // Si alcanzó el límite → BLOQUEAR
      if (currentCount >= processes_limit) {
        return res.status(403).json({
          success: false,
          error: `Has alcanzado el límite de ${processes_limit} procesos activos de tu plan ${current_plan}. Cierra procesos existentes o actualiza tu plan.`,
          reason: 'limit_reached',
          currentCount,
          limit: processes_limit
        });
      }
    }

    // 5. Validación pasó → CREAR PROCESO

    // Generar link único
    const uniqueId = `${companyName.toLowerCase().replace(/\s+/g, '-')}-${jobTitle.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const baseUrl = process.env.VITE_APP_URL || 'https://firststep-v1.vercel.app';
    const uniqueLink = `${baseUrl}/apply/${uniqueId}`;

    // Crear proceso
    const processData = {
      recruiter_id: recruiterId,
      title: jobTitle,
      company_name: companyName,
      description: description || '',
      mandatory_requirements: mandatoryRequirements || [],
      optional_requirements: optionalRequirements || [],
      custom_prompt: customPrompt || null,
      candidate_limit: candidateLimit || null,
      status: 'active' as const,
      unique_link: uniqueLink
    };

    const { data: newProcess, error: processError } = await supabaseAdmin
      .from('processes')
      .insert(processData)
      .select()
      .single();

    if (processError) {
      console.error('Error creating process:', processError);
      return res.status(500).json({
        success: false,
        error: 'Error al crear el proceso'
      });
    }

    // 6. Insertar preguntas del formulario si las hay
    if (formQuestions && Array.isArray(formQuestions) && formQuestions.length > 0) {
      const questionsToInsert = formQuestions.map((q: any, index: number) => ({
        process_id: newProcess.id,
        question_text: q.question || q.question_text,
        question_type: q.type || q.question_type,
        question_options: q.options || q.question_options || null,
        question_order: index + 1
      }));

      const { error: questionsError } = await supabaseAdmin
        .from('recruiter_questions')
        .insert(questionsToInsert);

      if (questionsError) {
        console.error('Error inserting recruiter questions:', questionsError);
        // No retornar error, el proceso ya fue creado exitosamente
      }
    }

    // 7. Retornar éxito
    return res.status(201).json({
      success: true,
      process: newProcess
    });

  } catch (error) {
    console.error('Unexpected error creating process:', error);
    return res.status(500).json({
      success: false,
      error: 'Error inesperado al crear el proceso'
    });
  }
}
