import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './utils/supabase';
import { generateAIResponse } from './utils/openai';
import { verifyCandidateOwnership } from './utils/auth';

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
    const { candidateId, recruiterId } = req.body;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: 'candidateId es requerido'
      });
    }

    if (!recruiterId) {
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

**PRINCIPIOS FUNDAMENTALES:**

1. **BÚSQUEDA SEMÁNTICA FLEXIBLE:**
   - Reconoce sinónimos y variaciones de términos sin importar mayúsculas, tildes o guiones
   - Reconoce roles/skills equivalentes en diferentes idiomas o con nombres similares
   - Si un término está mencionado de CUALQUIER forma relacionada al requisito, considéralo cumplido
   - Ejemplos de equivalencias:
     * "Product Manager" = "Gerente de Producto" = "Desarrollador de Producto" = "PM" = "Product Owner" = "Coordinador de Producto"
     * "Backend Developer" = "Desarrollador Backend" = "Ingeniero Backend" = "Backend Engineer" = "Dev Backend"
     * "Administrativo Contable" = "Admin. contable" = "Administrativo contable" = "Asistente administrativo contable"
     * "React" = "React.js" = "ReactJS"
   - Usa tu conocimiento semántico natural para reconocer equivalencias más allá de estos ejemplos

2. **MANEJO DE CVs MAL PARSEADOS:**
   ⚠️ IMPORTANTE: Los CVs pueden tener información desordenada por errores de extracción de texto.
   - Si encuentras: [EMPRESA] | [FECHAS] seguido de [tareas/responsabilidades] y luego un [TÉRMINO QUE COINCIDE CON REQUISITO]:
     * Verifica que el término esté en el MISMO BLOQUE de experiencia laboral (cerca de la empresa/fechas)
     * Verifica que NO sea solo una habilidad listada en una sección separada de "Skills" o "Conocimientos"
     * Si cumple ambos → El término ES un rol válido, aunque aparezca después de las tareas
   - Aplica este análisis ANTES de decidir si cumple o no el requisito

3. **EXPERIENCIA LABORAL vs MENCIÓN:**
   ✅ **CUENTA como experiencia cumplida:**
   - "Trabajé como [ROL] en [EMPRESA] X años"
   - CV muestra rol equivalente con período claro
   - Respuestas confirman experiencia laboral profesional

   ❌ **NO cuenta como experiencia:**
   - Solo "conocimientos en..." sin contexto laboral
   - "Familiarizado con..." sin años de práctica
   - Cursos o certificaciones sin experiencia aplicada

4. **VALIDACIÓN DE RESPUESTAS A PREGUNTAS IA:**

   ✅ **Respuesta VÁLIDA (mandatory) debe incluir:**
   - Años específicos (número claro)
   - Contexto profesional (empresa/proyecto/freelance)
   - Herramientas mencionadas (acorde a lo preguntado)

   ✅ **Tipos de experiencia que CUENTAN:**
   - Empleo formal, freelance, open-source con impacto
   - Experiencias fragmentadas se SUMAN (ej: 1 año + 2 años = 3 años)

   ❌ **NO cuenta:**
   - Solo cursos/certificaciones sin aplicación práctica
   - "Conocimientos en..." sin años o contexto

   ⚠️ **Info adicional en respuestas:**
   - Si respuesta aporta experiencia NO en CV → ACEPTAR
   - Las preguntas existen para complementar el CV

5. **VALIDACIÓN DE CERTIFICACIONES (binarias):**

   ✅ **Certificación CUMPLIDA si:**
   - Menciona la certificación exacta
   - Menciona curso del mismo tema (análisis moderado)
   - Ejemplo: Requisito "PMP" → Respuesta "Completé curso de Project Management" → ✅ CUMPLE

   ❌ **NO cumple:**
   - Cursos no relacionados
   - Solo "interesado en..." sin certificación o curso

**REGLAS DE EVALUACIÓN:**

1. **Requisitos INDISPENSABLES (mandatory):**
   - ✅ APROBAR si tiene ≥80% de los años requeridos (para experiencia/herramientas/técnicos)
   - ✅ APROBAR si tiene la certificación o curso del mismo tema (para certificaciones)
   - ✅ Ejemplos de APROBAR:
     * Requisito: "Product Manager 3+ años" → Tiene 3+ años (100%) → ✅ APROBAR
     * Requisito: "React 5+ años" → Tiene 4 años (80%) → ✅ APROBAR
     * Requisito: "Backend Developer" → CV: "Ingeniero Backend" → ✅ APROBAR (equivalente)
     * Requisito: "Certificación AWS" (certifications) → Respuesta: "Tengo certificación AWS Cloud Practitioner" → ✅ APROBAR
     * Requisito: "Certificación Scrum Master" (certifications) → Respuesta: "Completé curso de Scrum" → ✅ APROBAR (análisis moderado)
   - ❌ RECHAZAR si tiene <80% de lo requerido (experiencia) o NO tiene la certificación/curso
   - ❌ Ejemplos de RECHAZAR:
     * Requisito: "React 5+ años" → Tiene 2 años (40%) → ❌ RECHAZAR
     * Requisito: "Product Manager" → Solo "curso de gestión" → ❌ RECHAZAR
     * Requisito: "Python" → No menciona Python en CV ni respuestas → ❌ RECHAZAR
     * Requisito: "Certificación PMP" (certifications) → Respuesta: "No tengo certificación" → ❌ RECHAZAR
     * Requisito: "Certificación AWS" (certifications) → Respuesta: "Hice curso de Azure" → ❌ RECHAZAR (tema no relacionado)

2. **Requisitos DESEABLES (optional):**
   - Sumar puntos al score si cumple
   - Aplicar búsqueda semántica flexible también aquí
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
  "score": 85,
  "meetsAllMandatory": true,
  "mandatory_evaluation": [
    {
      "requirement": "Product Manager (3+ años)",
      "meets": true,
      "evidence": "CV menciona 'Desarrollador de Producto en Empresa Y (2020-2024)' - rol equivalente a Product Manager con 4 años de experiencia. Cumple requisito."
    },
    {
      "requirement": "React avanzado (5+ años)",
      "meets": true,
      "evidence": "CV menciona 6 años de experiencia con React. Confirmado en respuesta a pregunta sobre años de experiencia profesional."
    }
  ],
  "optional_evaluation": [
    {
      "requirement": "Node.js intermedio (2-4 años)",
      "meets": false,
      "evidence": "CV menciona solo 1 año de experiencia con Node.js"
    },
    {
      "requirement": "Liderazgo de equipos",
      "meets": true,
      "evidence": "En respuesta confirma que como Desarrollador de Producto lideró equipo de 3 personas."
    }
  ],
  "summary": "El candidato cumple con todos los requisitos indispensables. Tiene 4 años como Desarrollador de Producto (equivalente a Product Manager) y sólida experiencia técnica en React. Score de 85 refleja cumplimiento completo de mandatory + mayoría de optional."
}

**IMPORTANTE:**
- Si meetsAllMandatory = false, en "rejection_reason" usa formato específico:
  "[REQUISITO]: Tiene X años, se requiere Y+ años (cumple Z% del mínimo 80%)"
  Ejemplo: "Frontend Developer 5+ años: Tiene 2 años de experiencia, se requiere 5+ años (cumple 40% del mínimo 80%)"
- Aplica búsqueda semántica flexible ANTES de evaluar (normaliza mayúsculas, tildes, guiones y reconoce equivalencias)
- Usa evidencia del CV Y respuestas para evaluar
- En "evidence" menciona explícitamente cuando usas equivalencias semánticas o sumas experiencias fragmentadas

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
