import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_utils/supabase';
import { verifyProcessOwnership } from './_utils/auth';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Solo DELETE
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // 2. Verificar que el proceso pertenece al reclutador (Protección IDOR)
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

    // 7. Éxito
    return res.status(200).json({
      success: true,
      message: 'Proceso eliminado exitosamente',
      deletedCandidates,
      deletedCVs
    });

  } catch (error) {
    console.error('Delete process error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}
