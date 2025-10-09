import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './utils/supabase';
import { generateAIResponse } from './utils/openai';

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
    const { candidateId } = req.body;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: 'candidateId es requerido'
      });
    }

    // 2. Obtener candidato y verificar que tenga cv_text
    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from('candidates')
      .select('id, cv_text, process_id')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidato no encontrado'
      });
    }

    if (!candidate.cv_text) {
      return res.status(400).json({
        success: false,
        error: 'El candidato no tiene CV analizado'
      });
    }

    // 3. Obtener requisitos del proceso
    const { data: process, error: processError } = await supabaseAdmin
      .from('processes')
      .select('mandatory_requirements, optional_requirements, custom_prompt, candidate_limit')
      .eq('id', candidate.process_id)
      .single();

    if (processError || !process) {
      return res.status(404).json({
        success: false,
        error: 'Proceso no encontrado'
      });
    }

    // 4. Obtener preguntas IA + respuestas
    const { data: aiQuestions, error: questionsError } = await supabaseAdmin
      .from('ai_questions')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: true });

    if (questionsError) {
      return res.status(500).json({
        success: false,
        error: 'Error al obtener preguntas IA'
      });
    }

    // Validar que haya preguntas y estén respondidas
    if (!aiQuestions || aiQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay preguntas IA para este candidato'
      });
    }

    const unansweredQuestions = aiQuestions.filter(q => !q.is_answered);
    if (unansweredQuestions.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Hay preguntas sin responder'
      });
    }

    // 5. Construir prompt de scoring MODERADO
    const scoringPrompt = buildModeratePrompt(
      candidate.cv_text,
      process.mandatory_requirements || [],
      process.optional_requirements || [],
      aiQuestions,
      process.custom_prompt
    );

    // 6. Llamar a OpenAI para scoring
    let aiResponse;
    try {
      aiResponse = await generateAIResponse(scoringPrompt, {
        temperature: 0.3, // Más determinista para scoring
        maxTokens: 2000,
        responseFormat: 'json'
      });
    } catch (aiError) {
      console.error('OpenAI error:', aiError);
      return res.status(500).json({
        success: false,
        error: 'Error al calcular scoring con IA'
      });
    }

    // 7. Limpiar y parsear respuesta JSON
    let scoringResult;
    try {
      let cleanedText = aiResponse.text.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText
          .replace(/^```json\n/, '')
          .replace(/^```\n/, '')
          .replace(/\n```$/, '')
          .trim();
      }

      scoringResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw AI response:', aiResponse.text);
      return res.status(500).json({
        success: false,
        error: 'Error al procesar respuesta de scoring',
        debug: {
          rawResponse: aiResponse.text?.substring(0, 300)
        }
      });
    }

    // 8. Validar estructura mínima
    if (
      typeof scoringResult.score !== 'number' ||
      typeof scoringResult.meetsAllMandatory !== 'boolean'
    ) {
      return res.status(500).json({
        success: false,
        error: 'Respuesta de scoring en formato inválido'
      });
    }

    // 9. Actualizar candidato según resultado
    if (scoringResult.meetsAllMandatory === false) {
      // RECHAZADO: Soft delete
      const rejectionReason = scoringResult.summary ||
        scoringResult.rejection_reason ||
        'No cumple con todos los requisitos indispensables';

      const { error: updateError } = await supabaseAdmin
        .from('candidates')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          score: scoringResult.score,
          scoring_details: scoringResult
        })
        .eq('id', candidateId);

      if (updateError) {
        console.error('Error updating rejected candidate:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Error al actualizar candidato rechazado'
        });
      }

      return res.status(200).json({
        approved: false,
        reason: rejectionReason,
        score: scoringResult.score
      });
    } else {
      // APROBADO: Verificar límite de candidatos antes de marcar como completed

      // 1. Verificar si el proceso tiene límite de candidatos configurado
      if (process.candidate_limit) {
        // 2. Contar cuántos candidatos ya completaron el proceso
        const { count, error: countError } = await supabaseAdmin
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .eq('process_id', candidate.process_id)
          .eq('status', 'completed');

        if (countError) {
          console.error('Error counting completed candidates:', countError);
          return res.status(500).json({
            success: false,
            error: 'Error al verificar límite de candidatos'
          });
        }

        // 3. Si ya alcanzó el límite, rechazar al candidato
        if (count !== null && count >= process.candidate_limit) {
          // Marcar como rechazado con razón especial
          const { error: updateError } = await supabaseAdmin
            .from('candidates')
            .update({
              status: 'rejected',
              rejection_reason: 'El proceso alcanzó el límite máximo de candidatos',
              score: scoringResult.score,
              scoring_details: scoringResult
            })
            .eq('id', candidateId);

          if (updateError) {
            console.error('Error updating candidate (limit reached):', updateError);
          }

          return res.status(200).json({
            approved: false,
            reason: 'Lo sentimos, el proceso alcanzó el límite máximo de candidatos',
            limitReached: true,
            score: scoringResult.score
          });
        }
      }

      // 4. Si no alcanzó el límite, marcar como completed normalmente
      const { error: updateError } = await supabaseAdmin
        .from('candidates')
        .update({
          status: 'completed',
          score: scoringResult.score,
          scoring_details: scoringResult
        })
        .eq('id', candidateId);

      if (updateError) {
        console.error('Error updating approved candidate:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Error al actualizar candidato aprobado'
        });
      }

      // 5. Si hay límite, verificar si este candidato lo completó exactamente
      if (process.candidate_limit) {
        const { count: newCount } = await supabaseAdmin
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .eq('process_id', candidate.process_id)
          .eq('status', 'completed');

        // Si alcanzó el límite exacto, cerrar proceso automáticamente
        if (newCount !== null && newCount >= process.candidate_limit) {
          const { error: closeError } = await supabaseAdmin
            .from('processes')
            .update({
              status: 'closed',
              updated_at: new Date().toISOString()
            })
            .eq('id', candidate.process_id);

          if (closeError) {
            console.error('Error auto-closing process:', closeError);
            // No retornar error, el candidato ya fue aprobado
          } else {
            console.log(`Process ${candidate.process_id} auto-closed: limit reached (${newCount}/${process.candidate_limit})`);
          }
        }
      }

      return res.status(200).json({
        approved: true,
        score: scoringResult.score,
        details: scoringResult
      });
    }

  } catch (error) {
    console.error('Calculate scoring error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Construye el prompt de scoring MODERADO
 * - Tolerante con experiencia cercana
 * - Rechaza solo si claramente no cumple
 */
function buildModeratePrompt(
  cvText: string,
  mandatoryRequirements: any[],
  optionalRequirements: any[],
  aiQuestions: any[],
  customPrompt?: string
): string {
  return `Eres un evaluador experto de candidatos para reclutamiento. Tu tarea es evaluar si un candidato cumple con los requisitos de un puesto.

**MODO DE EVALUACIÓN: MODERADO (TOLERANTE)**

**REGLAS DE EVALUACIÓN:**
1. **Requisitos INDISPENSABLES (mandatory):**
   - ✅ APROBAR si cumple el requisito o está MUY CERCA
   - ✅ Ejemplos de APROBAR:
     * Requisito: "React 5+ años" → Candidato tiene 4 años → ✅ APROBAR (cercano)
     * Requisito: "Node.js avanzado" → CV muestra proyectos complejos → ✅ APROBAR
   - ❌ RECHAZAR solo si CLARAMENTE no cumple
   - ❌ Ejemplos de RECHAZAR:
     * Requisito: "React 5+ años" → Candidato tiene 6 meses → ❌ RECHAZAR
     * Requisito: "Python" → No menciona Python en ningún lado → ❌ RECHAZAR

2. **Requisitos DESEABLES (optional):**
   - Sumar puntos al score si cumple
   - NO rechazar si no cumple (solo afecta el score)

3. **Score (0-100):**
   - 100: Cumple todos los mandatory + todos los optional
   - 70-99: Cumple todos los mandatory + algunos optional
   - 50-69: Cumple todos los mandatory, pocos optional
   - 0-49: NO cumple algún mandatory → RECHAZAR

**CV DEL CANDIDATO:**
${cvText}

**REQUISITOS INDISPENSABLES (mandatory):**
${formatRequirements(mandatoryRequirements)}

**REQUISITOS DESEABLES (optional):**
${formatRequirements(optionalRequirements)}

**PREGUNTAS Y RESPUESTAS DEL CANDIDATO:**
${formatQuestionsAndAnswers(aiQuestions)}

${customPrompt ? `**CRITERIOS ADICIONALES DEL RECLUTADOR:**\n${customPrompt}\n` : ''}

**FORMATO DE SALIDA (JSON válido):**
{
  "score": 75,
  "meetsAllMandatory": true,
  "mandatory_evaluation": [
    {
      "requirement": "React avanzado (5+ años)",
      "meets": true,
      "evidence": "CV menciona 6 años de experiencia con React. Confirmado en respuesta a pregunta 2."
    }
  ],
  "optional_evaluation": [
    {
      "requirement": "Node.js intermedio (2-4 años)",
      "meets": false,
      "evidence": "CV menciona solo 1 año de experiencia con Node.js"
    }
  ],
  "summary": "El candidato cumple con todos los requisitos indispensables. Tiene sólida experiencia en React y demuestra conocimientos técnicos adecuados. Score de 75 refleja cumplimiento de mandatory + algunos optional."
}

**IMPORTANTE:**
- Si meetsAllMandatory = false, agrega campo "rejection_reason" explicando qué requisito mandatory no cumple
- Sé objetivo pero tolerante (modo MODERADO)
- Usa evidencia del CV Y respuestas para evaluar

Evalúa al candidato ahora:`;
}

/**
 * Formatea requisitos para el prompt
 */
function formatRequirements(requirements: any[]): string {
  if (!requirements || requirements.length === 0) {
    return 'Ninguno especificado';
  }

  return requirements
    .map((req, index) => {
      const level = req.level ? ` - Nivel: ${req.level}` : '';
      const category = req.category ? ` (${req.category})` : '';
      return `${index + 1}. ${req.title}${level}${category}`;
    })
    .join('\n');
}

/**
 * Formatea preguntas y respuestas para el prompt
 */
function formatQuestionsAndAnswers(questions: any[]): string {
  if (!questions || questions.length === 0) {
    return 'No hay preguntas respondidas';
  }

  return questions
    .map((q, index) => {
      const mandatory = q.is_mandatory ? '[INDISPENSABLE]' : '[DESEABLE]';
      const reason = q.question_reason ? `\n   Razón: ${q.question_reason}` : '';
      return `${index + 1}. ${mandatory} ${q.question_text}${reason}\n   Respuesta: ${q.answer_text || 'Sin respuesta'}`;
    })
    .join('\n\n');
}
