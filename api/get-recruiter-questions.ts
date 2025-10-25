import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_utils/supabase';

/**
 * GET /api/get-recruiter-questions
 *
 * Obtiene las preguntas del formulario configuradas por el reclutador para un proceso.
 * Esta API reemplaza el acceso directo desde frontend a la tabla recruiter_questions.
 *
 * Query params:
 * - processId: ID del proceso de reclutamiento
 *
 * Retorna:
 * - success: boolean
 * - questions: Array de preguntas del formulario ordenadas
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
    const { processId } = req.query;

    if (!processId || typeof processId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'processId es requerido y debe ser un string'
      });
    }

    // 2. Verificar que el proceso existe y está activo
    const { data: process, error: processError } = await supabaseAdmin
      .from('processes')
      .select('id, status')
      .eq('id', processId)
      .single();

    if (processError || !process) {
      return res.status(404).json({
        success: false,
        error: 'Proceso no encontrado'
      });
    }

    // Validar que el proceso esté activo (los candidatos solo pueden ver preguntas de procesos activos)
    if (process.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'El proceso no está activo'
      });
    }

    // 3. Obtener preguntas del reclutador para este proceso
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('recruiter_questions')
      .select('*')
      .eq('process_id', processId)
      .order('question_order', { ascending: true });

    if (questionsError) {
      console.error('Error fetching recruiter questions:', questionsError);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener preguntas de la base de datos'
      });
    }

    // 4. Retornar preguntas (puede ser array vacío si el reclutador no configuró preguntas)
    return res.status(200).json({
      success: true,
      questions: questions || []
    });

  } catch (error) {
    console.error('Get recruiter questions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}
