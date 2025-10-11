import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './utils/supabase';
import { verifyCandidateOwnership } from './utils/auth';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Solo GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Validar input
    const { candidateId, recruiterId } = req.query;

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

    // 2. Verificar que el candidato pertenece al reclutador (Seguridad IDOR)
    const verification = await verifyCandidateOwnership(candidateId, recruiterId);

    if (!verification.isValid) {
      return res.status(403).json({
        success: false,
        error: verification.error || 'No tienes permiso para acceder a este candidato'
      });
    }

    const candidate = verification.candidate;

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidato no encontrado'
      });
    }

    // 3. Validar que el candidato tenga análisis completo
    // Solo mostramos candidatos con status 'completed' o 'rejected'
    if (!['completed', 'rejected'].includes(candidate.status)) {
      return res.status(400).json({
        success: false,
        error: 'El candidato no ha completado el proceso de análisis'
      });
    }

    // 4. Validar que tenga cv_text y score (datos básicos del análisis)
    if (!candidate.cv_text) {
      return res.status(400).json({
        success: false,
        error: 'El candidato no tiene CV analizado'
      });
    }

    // 5. Obtener preguntas IA con respuestas
    const { data: aiQuestions, error: aiQuestionsError } = await supabaseAdmin
      .from('ai_questions')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: true });

    if (aiQuestionsError) {
      console.error('Error fetching AI questions:', aiQuestionsError);
      // No bloqueamos la respuesta, solo retornamos array vacío
    }

    // 6. Obtener preguntas del reclutador para este proceso
    const { data: recruiterQuestions, error: recruiterQuestionsError } = await supabaseAdmin
      .from('recruiter_questions')
      .select('*')
      .eq('process_id', candidate.process_id)
      .order('question_order', { ascending: true });

    if (recruiterQuestionsError) {
      console.error('Error fetching recruiter questions:', recruiterQuestionsError);
    }

    // 7. Obtener respuestas del candidato a las preguntas del reclutador
    const { data: recruiterAnswers, error: recruiterAnswersError } = await supabaseAdmin
      .from('recruiter_answers')
      .select('*')
      .eq('candidate_id', candidateId);

    if (recruiterAnswersError) {
      console.error('Error fetching recruiter answers:', recruiterAnswersError);
    }

    // 8. Combinar preguntas con respuestas
    const questionsWithAnswers = (recruiterQuestions || []).map(question => {
      const answer = (recruiterAnswers || []).find(a => a.question_id === question.id);
      return {
        ...question,
        answer_text: answer?.answer_text || null
      };
    });

    // 9. Obtener requisitos del proceso
    const { data: process, error: processError } = await supabaseAdmin
      .from('processes')
      .select('mandatory_requirements, optional_requirements, title, company_name')
      .eq('id', candidate.process_id)
      .single();

    if (processError) {
      console.error('Error fetching process requirements:', processError);
    }

    // 10. Combinar requisitos evaluados desde scoring_details
    const requirementsArray = [];

    // Verificar que scoring_details existe antes de acceder
    if (candidate.scoring_details) {
      // Agregar evaluación de requisitos obligatorios
      if (Array.isArray(candidate.scoring_details.mandatory_evaluation)) {
        candidate.scoring_details.mandatory_evaluation.forEach((item: any) => {
          requirementsArray.push({
            requirement_text: item.requirement || '',
            is_mandatory: true,
            is_met: Boolean(item.meets),
            evidence: item.evidence || ''
          });
        });
      }

      // Agregar evaluación de requisitos opcionales
      if (Array.isArray(candidate.scoring_details.optional_evaluation)) {
        candidate.scoring_details.optional_evaluation.forEach((item: any) => {
          requirementsArray.push({
            requirement_text: item.requirement || '',
            is_mandatory: false,
            is_met: Boolean(item.meets),
            evidence: item.evidence || ''
          });
        });
      }
    }

    // 11. Retornar datos completos
    return res.status(200).json({
      success: true,
      candidate: {
        id: candidate.id,
        process_id: candidate.process_id,
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        email: candidate.email,
        linkedin_url: candidate.linkedin_url,
        cv_url: candidate.cv_url,
        cv_text: candidate.cv_text,
        score: candidate.score,
        scoring_details: candidate.scoring_details,
        status: candidate.status,
        rejection_reason: candidate.rejection_reason,
        created_at: candidate.created_at
      },
      aiQuestions: aiQuestions || [],
      recruiterQuestions: questionsWithAnswers,
      requirements: requirementsArray,
      process: {
        title: process?.title || '',
        company_name: process?.company_name || ''
      }
    });

  } catch (error) {
    console.error('Get candidate analysis error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}
