import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_utils/supabase';

interface RecruiterAnswer {
  questionId: string;
  answerText: string;
}

/**
 * Endpoint modular para preguntas del reclutador
 *
 * GET /api/recruiter-questions?processId=X
 * - Obtiene preguntas del formulario configuradas por el reclutador
 * - Valida que el proceso esté activo
 *
 * POST /api/recruiter-questions
 * - Guarda respuestas del candidato al formulario del reclutador
 * - Body: { candidateId, answers }
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'GET') {
    return handleGetQuestions(req, res);
  } else if (req.method === 'POST') {
    return handleSaveAnswers(req, res);
  } else {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}

/**
 * GET - Obtener preguntas del formulario del reclutador para un proceso
 */
async function handleGetQuestions(
  req: VercelRequest,
  res: VercelResponse
) {
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

/**
 * POST - Guardar respuestas del candidato al formulario del reclutador
 */
async function handleSaveAnswers(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // 1. Validar input
    const { candidateId, answers } = req.body as {
      candidateId?: string;
      answers?: RecruiterAnswer[];
    };

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: 'candidateId es requerido'
      });
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'answers es requerido y debe ser un array'
      });
    }

    // 2. Validar que el candidato existe
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

    // 3. Insertar respuestas en recruiter_answers
    const answersToInsert = answers.map(answer => ({
      candidate_id: candidateId,
      question_id: answer.questionId,
      answer_text: answer.answerText
    }));

    const { error: insertError } = await supabaseAdmin
      .from('recruiter_answers')
      .insert(answersToInsert);

    if (insertError) {
      console.error('Error inserting recruiter answers:', insertError);
      throw insertError;
    }

    // 4. Retornar éxito
    return res.status(200).json({
      success: true,
      message: `${answers.length} respuestas guardadas correctamente`
    });

  } catch (error) {
    console.error('Save recruiter answers error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno al guardar respuestas'
    });
  }
}
