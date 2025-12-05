import { supabase } from './supabase';

export interface AIQuestion {
  id: string;
  candidate_id: string;
  question_text: string;
  question_reason?: string;
  is_mandatory: boolean;
  answer_text?: string;
  is_answered: boolean;
  created_at: string;
}

export interface AIAnswer {
  questionId: string;
  answerText: string;
}

export interface ScoringResult {
  approved: boolean;
  reason?: string;
  score?: number;
  details?: any;
  limitReached?: boolean;
}

export class AIQuestionsService {

  // Obtener preguntas IA generadas para un candidato
  static async getAIQuestions(candidateId: string): Promise<AIQuestion[]> {
    try {
      const response = await fetch(`/api/ai-questions?candidateId=${candidateId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('Error fetching AI questions:', data.error);
        return [];
      }

      return data.questions || [];
    } catch (error) {
      console.error('Get AI questions error:', error);
      return [];
    }
  }

  // Guardar respuestas del candidato
  static async saveAIAnswers(candidateId: string, recruiterId: string, answers: AIAnswer[]): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/ai-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ candidateId, recruiterId, answers })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Error al guardar respuestas'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Save AI answers error:', error);
      return {
        success: false,
        error: 'Error de conexión al guardar respuestas'
      };
    }
  }

  // Calcular scoring y filtrar candidatos rechazados
  static async calculateScoring(candidateId: string, recruiterId: string): Promise<ScoringResult> {
    try {
      const response = await fetch('/api/calculate-scoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ candidateId, recruiterId })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          approved: false,
          reason: data.error || 'Error al evaluar requisitos'
        };
      }

      return {
        approved: data.approved,
        reason: data.reason,
        score: data.score,
        details: data.details,
      };
    } catch (error) {
      console.error('Calculate scoring error:', error);
      return {
        approved: false,
        reason: 'Error de conexión al evaluar requisitos'
      };
    }
  }
}
