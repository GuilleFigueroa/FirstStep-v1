import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_utils/supabase';
import { verifyCandidateOwnership } from './_utils/auth';

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
    const { candidateId, recruiterId } = req.body;

    if (!candidateId || typeof candidateId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'candidateId es requerido'
      });
    }

    if (!recruiterId || typeof recruiterId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'recruiterId es requerido'
      });
    }

    // 2. Verificar que el candidato pertenece al reclutador (Protección IDOR)
    const verification = await verifyCandidateOwnership(candidateId, recruiterId);

    if (!verification.isValid) {
      return res.status(403).json({
        success: false,
        error: verification.error || 'No tienes permiso para eliminar este candidato'
      });
    }

    const candidate = verification.candidate;

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidato no encontrado'
      });
    }

    // 3. Extraer path del CV para eliminarlo de Storage
    let cvPath: string | null = null;
    if (candidate.cv_url) {
      try {
        // Extraer path desde URL completa
        // URL format: https://{project}.supabase.co/storage/v1/object/public/candidate-cvs/{path}
        const bucketPrefix = '/storage/v1/object/public/candidate-cvs/';
        const urlObj = new URL(candidate.cv_url);
        const path = urlObj.pathname;
        const startIndex = path.indexOf(bucketPrefix);

        if (startIndex !== -1) {
          cvPath = path.substring(startIndex + bucketPrefix.length);
        }
      } catch (error) {
        console.error('Error extracting CV path:', error);
        // No bloqueamos la eliminación si falla extraer el path
      }
    }

    // 4. Eliminar CV del Storage (si existe)
    if (cvPath) {
      try {
        const { error: storageError } = await supabaseAdmin.storage
          .from('candidate-cvs')
          .remove([cvPath]);

        if (storageError) {
          console.error('Error deleting CV from storage:', storageError);
          // No bloqueamos la eliminación si falla el storage
        }
      } catch (error) {
        console.error('Storage deletion error:', error);
        // Continuamos con la eliminación del candidato
      }
    }

    // 5. Eliminar recruiter_answers (si existen)
    const { error: answersError } = await supabaseAdmin
      .from('recruiter_answers')
      .delete()
      .eq('candidate_id', candidateId);

    if (answersError) {
      console.error('Error deleting recruiter answers:', answersError);
      // Continuamos con la eliminación
    }

    // 6. Eliminar ai_questions (si existen)
    const { error: questionsError } = await supabaseAdmin
      .from('ai_questions')
      .delete()
      .eq('candidate_id', candidateId);

    if (questionsError) {
      console.error('Error deleting AI questions:', questionsError);
      // Continuamos con la eliminación
    }

    // 7. Finalmente, eliminar el candidato
    const { error: candidateError } = await supabaseAdmin
      .from('candidates')
      .delete()
      .eq('id', candidateId);

    if (candidateError) {
      console.error('Error deleting candidate:', candidateError);
      return res.status(500).json({
        success: false,
        error: 'Error al eliminar el candidato de la base de datos'
      });
    }

    // 8. Éxito
    return res.status(200).json({
      success: true,
      message: 'Candidato eliminado exitosamente'
    });

  } catch (error) {
    console.error('Delete candidate error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}
