export interface RecruiterAnswer {
  questionId: string;
  answerText: string;
}

export class RecruiterQuestionsService {

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
