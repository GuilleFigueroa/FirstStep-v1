import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './utils/supabase';

interface Answer {
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
      answers?: Answer[];
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
      .select('id')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidato no encontrado'
      });
    }

    // 3. Actualizar cada respuesta en ai_questions
    const updatePromises = answers.map(async (answer) => {
      const { error } = await supabaseAdmin
        .from('ai_questions')
        .update({
          answer_text: answer.answerText,
          is_answered: true
        })
        .eq('id', answer.questionId)
        .eq('candidate_id', candidateId); // Seguridad: solo actualizar preguntas del candidato

      if (error) {
        console.error(`Error updating question ${answer.questionId}:`, error);
        throw error;
      }
    });

    await Promise.all(updatePromises);

    // 4. Retornar éxito
    return res.status(200).json({
      success: true,
      message: `${answers.length} respuestas guardadas correctamente`
    });

  } catch (error) {
    console.error('Save AI answers error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno al guardar respuestas'
    });
  }
}
