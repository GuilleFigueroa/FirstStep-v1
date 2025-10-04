import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './utils/supabase';

/**
 * Endpoint directo para obtener preguntas de un candidato
 * Uso: GET /api/get-questions?candidateId=uuid
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { candidateId } = req.query;

  if (!candidateId || typeof candidateId !== 'string') {
    return res.status(400).json({ error: 'candidateId required' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('ai_questions')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      count: data?.length || 0,
      questions: data || []
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
