import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './utils/supabase';

/**
 * Endpoint de testing para verificar estado de candidatos y probar scoring
 *
 * GET /api/test-scoring - Lista candidatos con CV analizado
 * GET /api/test-scoring?candidateId=xxx - Muestra detalle de un candidato
 * POST /api/test-scoring - Simula respuestas IA y ejecuta scoring
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // GET: Ver candidatos o detalle
    if (req.method === 'GET') {
      const { candidateId } = req.query;

      if (candidateId && typeof candidateId === 'string') {
        // Mostrar detalle de un candidato
        return await getCandidateDetail(candidateId, res);
      } else {
        // Listar candidatos con CV analizado
        return await listCandidatesWithCV(res);
      }
    }

    // POST: Simular respuestas y ejecutar scoring
    if (req.method === 'POST') {
      const { candidateId, mockAnswers } = req.body;

      if (!candidateId) {
        return res.status(400).json({ error: 'candidateId requerido' });
      }

      return await mockAnswersAndScore(candidateId, mockAnswers, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Test scoring error:', error);
    return res.status(500).json({
      error: 'Error interno',
      message: error instanceof Error ? error.message : 'Unknown'
    });
  }
}

/**
 * Lista candidatos con CV analizado
 */
async function listCandidatesWithCV(res: VercelResponse) {
  const { data: candidates, error } = await supabaseAdmin
    .from('candidates')
    .select('id, first_name, last_name, email, status, cv_text, score')
    .not('cv_text', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const candidatesWithQuestions = await Promise.all(
    (candidates || []).map(async (candidate) => {
      const { data: questions } = await supabaseAdmin
        .from('ai_questions')
        .select('id, question_text, is_answered, is_mandatory')
        .eq('candidate_id', candidate.id);

      return {
        ...candidate,
        cv_text: candidate.cv_text ? `${candidate.cv_text.substring(0, 100)}...` : null,
        questions_count: questions?.length || 0,
        answered_count: questions?.filter(q => q.is_answered).length || 0
      };
    })
  );

  return res.status(200).json({
    count: candidatesWithQuestions.length,
    candidates: candidatesWithQuestions,
    instructions: {
      get_detail: 'GET /api/test-scoring?candidateId=xxx',
      test_scoring: 'POST /api/test-scoring with { candidateId, mockAnswers: true }'
    }
  });
}

/**
 * Muestra detalle completo de un candidato
 */
async function getCandidateDetail(candidateId: string, res: VercelResponse) {
  const { data: candidate, error: candidateError } = await supabaseAdmin
    .from('candidates')
    .select('*')
    .eq('id', candidateId)
    .single();

  if (candidateError || !candidate) {
    return res.status(404).json({ error: 'Candidato no encontrado' });
  }

  const { data: questions } = await supabaseAdmin
    .from('ai_questions')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: true });

  const { data: process } = await supabaseAdmin
    .from('processes')
    .select('id, job_title, mandatory_requirements, optional_requirements')
    .eq('id', candidate.process_id)
    .single();

  return res.status(200).json({
    candidate: {
      id: candidate.id,
      name: `${candidate.first_name} ${candidate.last_name}`,
      email: candidate.email,
      status: candidate.status,
      score: candidate.score,
      rejection_reason: candidate.rejection_reason,
      cv_length: candidate.cv_text?.length || 0,
      has_scoring: !!candidate.scoring_details
    },
    process: {
      job_title: process?.job_title,
      mandatory_count: process?.mandatory_requirements?.length || 0,
      optional_count: process?.optional_requirements?.length || 0
    },
    questions: questions?.map(q => ({
      id: q.id,
      question: q.question_text,
      is_mandatory: q.is_mandatory,
      is_answered: q.is_answered,
      answer: q.answer_text || null,
      reason: q.question_reason
    })),
    next_steps: {
      mock_answers: !questions?.every(q => q.is_answered)
        ? 'POST /api/test-scoring con { candidateId, mockAnswers: true }'
        : 'Ya tiene respuestas. Ejecuta scoring: POST /api/calculate-scoring',
      calculate_scoring: candidate.status !== 'rejected' && candidate.status !== 'completed'
        ? 'POST /api/calculate-scoring con { candidateId }'
        : `Ya evaluado. Status: ${candidate.status}`
    }
  });
}

/**
 * Simula respuestas a preguntas IA y ejecuta scoring
 */
async function mockAnswersAndScore(
  candidateId: string,
  mockAnswers: boolean,
  res: VercelResponse
) {
  // Obtener preguntas sin responder
  const { data: questions, error: questionsError } = await supabaseAdmin
    .from('ai_questions')
    .select('*')
    .eq('candidate_id', candidateId);

  if (questionsError || !questions || questions.length === 0) {
    return res.status(400).json({
      error: 'No hay preguntas IA para este candidato',
      hint: 'Ejecuta primero POST /api/analyze-cv'
    });
  }

  // Si mockAnswers = true, generar respuestas de prueba
  if (mockAnswers) {
    const updates = questions.map(async (q, index) => {
      const mockAnswer = q.is_mandatory
        ? `Sí, tengo ${4 + index} años de experiencia con esta tecnología. He trabajado en múltiples proyectos.`
        : `Tengo conocimientos básicos y he trabajado con esto en algunos proyectos personales.`;

      return supabaseAdmin
        .from('ai_questions')
        .update({
          answer_text: mockAnswer,
          is_answered: true
        })
        .eq('id', q.id);
    });

    await Promise.all(updates);
  }

  // Ejecutar scoring
  const scoringResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/calculate-scoring`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateId })
  });

  const scoringResult = await scoringResponse.json();

  return res.status(200).json({
    message: 'Test completado',
    mock_answers_created: mockAnswers ? questions.length : 0,
    scoring_result: scoringResult
  });
}
