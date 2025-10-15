import { supabase } from './supabase';

export interface RecruiterAnswer {
  questionId: string;
  answerText: string;
}

export interface RecruiterQuestion {
  id: string;
  process_id: string;
  question_text: string;
  question_type: 'text' | 'multiple_choice' | 'single_choice';
  question_options: string[] | null;
  question_order: number;
  created_at: string;
}

export class RecruiterQuestionsService {

  // Obtener preguntas del reclutador para un proceso
  static async getRecruiterQuestionsByProcess(processId: string): Promise<{
    success: boolean;
    questions?: RecruiterQuestion[];
    error?: string;
  }> {
    try {
      const response = await fetch(`/api/get-recruiter-questions?processId=${processId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('Error fetching recruiter questions:', data.error);
        return { success: false, error: data.error || 'Error al obtener preguntas' };
      }

      return { success: true, questions: data.questions || [] };
    } catch (error) {
      console.error('Get recruiter questions error:', error);
      return { success: false, error: 'Error inesperado al obtener preguntas' };
    }
  }

  // Verificar si existen preguntas del reclutador para un proceso
  static async hasRecruiterQuestions(processId: string): Promise<boolean> {
    try {
      const result = await this.getRecruiterQuestionsByProcess(processId);
      return result.success && (result.questions?.length || 0) > 0;
    } catch (error) {
      console.error('Has recruiter questions error:', error);
      return false;
    }
  }

  // Guardar respuestas del formulario del reclutador
  static async saveRecruiterAnswers(
    candidateId: string,
    answers: RecruiterAnswer[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/save-recruiter-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ candidateId, answers })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Error al guardar respuestas del formulario'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Save recruiter answers error:', error);
      return {
        success: false,
        error: 'Error de conexión al guardar respuestas del formulario'
      };
    }
  }
}
