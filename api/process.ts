import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_utils/supabase';
import { verifyProcessOwnership } from './_utils/auth';
import { validateProcessLimit } from './_utils/subscription';

/**
 * Endpoint consolidado para operaciones de procesos
 *
 * POST   /api/process - Crear nuevo proceso
 * PATCH  /api/process - Actualizar status de proceso (con validación de límites)
 * DELETE /api/process - Eliminar proceso permanentemente
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    switch (req.method) {
      case 'POST':
        return await handleCreate(req, res);
      case 'PATCH':
        return await handleUpdate(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Process API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * POST - Crear nuevo proceso de reclutamiento
 */
async function handleCreate(req: VercelRequest, res: VercelResponse) {
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

    // 2. Validar límites de suscripción
    const validation = await validateProcessLimit(recruiterId);

    if (!validation.canProceed) {
      return res.status(403).json({
        success: false,
        error: validation.error,
        reason: validation.reason,
        currentCount: validation.currentCount,
        limit: validation.limit
      });
    }

    // 3. Generar link único
    const uniqueId = `${companyName.toLowerCase().replace(/\s+/g, '-')}-${jobTitle.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const baseUrl = process.env.VITE_APP_URL || 'https://firststep-v1.vercel.app';
    const uniqueLink = `${baseUrl}/apply/${uniqueId}`;

    // 4. Crear proceso
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

    // 5. Insertar preguntas del formulario si las hay
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

    // 6. Retornar éxito
    return res.status(201).json({
      success: true,
      process: newProcess
    });

  } catch (error) {
    console.error('Error in handleCreate:', error);
    return res.status(500).json({
      success: false,
      error: 'Error inesperado al crear el proceso'
    });
  }
}

/**
 * PATCH - Actualizar status de proceso
 * CRÍTICO: Valida límites al reactivar procesos (closed/paused → active)
 */
async function handleUpdate(req: VercelRequest, res: VercelResponse) {
  try {
    // 1. Validar input
    const { processId, status, recruiterId } = req.body;

    if (!processId || typeof processId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'processId es requerido'
      });
    }

    if (!status || !['active', 'closed', 'paused'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'status debe ser "active", "closed" o "paused"'
      });
    }

    if (!recruiterId || typeof recruiterId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'recruiterId es requerido'
      });
    }

    // 2. Verificar ownership del proceso
    const verification = await verifyProcessOwnership(processId, recruiterId);

    if (!verification.isValid) {
      return res.status(403).json({
        success: false,
        error: verification.error || 'No tienes permiso para modificar este proceso'
      });
    }

    const process = verification.process;

    if (!process) {
      return res.status(404).json({
        success: false,
        error: 'Proceso no encontrado'
      });
    }

    // 3. CRÍTICO: Si se está reactivando (closed/paused → active), validar límites
    if (status === 'active' && process.status !== 'active') {
      const validation = await validateProcessLimit(recruiterId, processId);

      if (!validation.canProceed) {
        return res.status(403).json({
          success: false,
          error: validation.error,
          reason: validation.reason,
          currentCount: validation.currentCount,
          limit: validation.limit
        });
      }
    }

    // 4. Actualizar status
    const { data: updatedProcess, error: updateError } = await supabaseAdmin
      .from('processes')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', processId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating process:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Error al actualizar el proceso'
      });
    }

    // 5. Retornar éxito
    return res.status(200).json({
      success: true,
      process: updatedProcess
    });

  } catch (error) {
    console.error('Error in handleUpdate:', error);
    return res.status(500).json({
      success: false,
      error: 'Error inesperado al actualizar el proceso'
    });
  }
}

/**
 * DELETE - Eliminar proceso permanentemente con todos sus datos
 */
async function handleDelete(req: VercelRequest, res: VercelResponse) {
  try {
    // 1. Validar input
    const { processId, recruiterId } = req.body;

    if (!processId || typeof processId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'processId es requerido'
      });
    }

    if (!recruiterId || typeof recruiterId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'recruiterId es requerido'
      });
    }

    // 2. Verificar ownership del proceso
    const verification = await verifyProcessOwnership(processId, recruiterId);

    if (!verification.isValid) {
      return res.status(403).json({
        success: false,
        error: verification.error || 'No tienes permiso para eliminar este proceso'
      });
    }

    const process = verification.process;

    if (!process) {
      return res.status(404).json({
        success: false,
        error: 'Proceso no encontrado'
      });
    }

    // 3. Obtener todos los candidatos del proceso
    const { data: candidates, error: candidatesError } = await supabaseAdmin
      .from('candidates')
      .select('*')
      .eq('process_id', processId);

    if (candidatesError) {
      console.error('Error fetching candidates:', candidatesError);
      // Continuamos aunque falle obtener candidatos
    }

    let deletedCVs = 0;
    let deletedCandidates = 0;

    // 4. Eliminar cada candidato con sus datos asociados
    if (candidates && candidates.length > 0) {
      for (const candidate of candidates) {
        // 4.1. Eliminar CV del Storage (si existe)
        if (candidate.cv_url) {
          try {
            const bucketPrefix = '/storage/v1/object/public/candidate-cvs/';
            const urlObj = new URL(candidate.cv_url);
            const path = urlObj.pathname;
            const startIndex = path.indexOf(bucketPrefix);

            if (startIndex !== -1) {
              const cvPath = path.substring(startIndex + bucketPrefix.length);
              const { error: storageError } = await supabaseAdmin.storage
                .from('candidate-cvs')
                .remove([cvPath]);

              if (!storageError) {
                deletedCVs++;
              } else {
                console.error('Error deleting CV:', storageError);
              }
            }
          } catch (error) {
            console.error('Error extracting/deleting CV path:', error);
            // Continuamos con la eliminación
          }
        }

        // 4.2. Eliminar recruiter_answers del candidato
        await supabaseAdmin
          .from('recruiter_answers')
          .delete()
          .eq('candidate_id', candidate.id);

        // 4.3. Eliminar ai_questions del candidato
        await supabaseAdmin
          .from('ai_questions')
          .delete()
          .eq('candidate_id', candidate.id);

        // 4.4. Eliminar el candidato
        const { error: deleteCandidateError } = await supabaseAdmin
          .from('candidates')
          .delete()
          .eq('id', candidate.id);

        if (!deleteCandidateError) {
          deletedCandidates++;
        } else {
          console.error('Error deleting candidate:', deleteCandidateError);
        }
      }
    }

    // 5. Eliminar recruiter_questions del proceso
    const { error: questionsError } = await supabaseAdmin
      .from('recruiter_questions')
      .delete()
      .eq('process_id', processId);

    if (questionsError) {
      console.error('Error deleting recruiter questions:', questionsError);
      // Continuamos con la eliminación
    }

    // 6. Eliminar el proceso
    const { error: processError } = await supabaseAdmin
      .from('processes')
      .delete()
      .eq('id', processId);

    if (processError) {
      console.error('Error deleting process:', processError);
      return res.status(500).json({
        success: false,
        error: 'Error al eliminar el proceso de la base de datos'
      });
    }

    // 7. Retornar éxito
    return res.status(200).json({
      success: true,
      message: 'Proceso eliminado exitosamente',
      deletedCandidates,
      deletedCVs
    });

  } catch (error) {
    console.error('Error in handleDelete:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}
