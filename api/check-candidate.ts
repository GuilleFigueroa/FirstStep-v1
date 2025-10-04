import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './utils/supabase';

/**
 * Endpoint para verificar estado del candidato y preguntas generadas
 * Uso: GET /api/check-candidate?email=test@example.com
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.query;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      error: 'Falta parámetro email',
      usage: 'GET /api/check-candidate?email=tu@email.com'
    });
  }

  try {
    // 1. Buscar candidato por email (último creado)
    const { data: candidates, error: candidateError } = await supabaseAdmin
      .from('candidates')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1);

    if (candidateError) {
      return res.status(500).json({
        error: 'Error al buscar candidato',
        details: candidateError.message
      });
    }

    if (!candidates || candidates.length === 0) {
      return res.status(404).json({
        error: `No se encontró ningún candidato con email: ${email}`
      });
    }

    const candidate = candidates[0];

    // 2. Buscar preguntas generadas para este candidato
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('ai_questions')
      .select('*')
      .eq('candidate_id', candidate.id)
      .order('created_at', { ascending: true });

    if (questionsError) {
      return res.status(500).json({
        error: 'Error al buscar preguntas',
        details: questionsError.message
      });
    }

    // 3. Preparar respuesta
    return res.status(200).json({
      success: true,
      candidate: {
        id: candidate.id,
        name: `${candidate.first_name} ${candidate.last_name}`,
        email: candidate.email,
        status: candidate.status,
        cv_url: candidate.cv_url,
        cv_text_length: candidate.cv_text?.length || 0,
        parsing_failed: candidate.parsing_failed || false,
        parsing_error: candidate.parsing_error,
        ai_analysis_failed: candidate.ai_analysis_failed || false,
        created_at: candidate.created_at
      },
      questions: {
        total: questions?.length || 0,
        mandatory: questions?.filter(q => q.is_mandatory).length || 0,
        optional: questions?.filter(q => !q.is_mandatory).length || 0,
        list: questions?.map(q => ({
          id: q.id,
          question: q.question_text,
          reason: q.question_reason,
          is_mandatory: q.is_mandatory,
          is_answered: q.is_answered
        })) || []
      },
      analysis: {
        cv_parsed: !!candidate.cv_text,
        questions_generated: (questions?.length || 0) > 0,
        ready_for_questions: candidate.status === 'cv_uploaded' && (questions?.length || 0) > 0
      }
    });

  } catch (error) {
    console.error('Check candidate error:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
