import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './utils/supabase';

/**
 * GET /api/get-ai-questions
 *
 * Obtiene las preguntas generadas por IA para un candidato específico.
 * Esta API reemplaza el acceso directo desde frontend a la tabla ai_questions.
 *
 * Query params:
 * - candidateId: ID del candidato
 *
 * Retorna:
 * - success: boolean
 * - questions: Array de preguntas AI con sus respuestas
 * - error: string (si falla)
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Solo GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // 1. Validar input
    const { candidateId } = req.query;

    if (!candidateId || typeof candidateId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'candidateId es requerido y debe ser un string'
      });
    }

    // 2. Verificar que el candidato existe
    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from('candidates')
      .select('id, process_id')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidato no encontrado'
      });
    }

    // 3. Obtener preguntas AI del candidato
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('ai_questions')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: true });

    if (questionsError) {
      console.error('Error fetching AI questions:', questionsError);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener preguntas de la base de datos'
      });
    }

    // 4. Retornar preguntas (puede ser array vacío si no hay preguntas aún)
    return res.status(200).json({
      success: true,
      questions: questions || []
    });

  } catch (error) {
    console.error('Get AI questions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}
