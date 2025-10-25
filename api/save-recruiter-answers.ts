import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_utils/supabase';

interface RecruiterAnswer {
  questionId: string;
  answerText: string;
}

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
