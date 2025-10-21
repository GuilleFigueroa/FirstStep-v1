import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './utils/supabase';
import { extractTextFromCV } from './utils/pdfParser';
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

    if (!candidate.cv_url) {
      return res.status(400).json({
        success: false,
        error: 'El candidato no tiene CV subido'
      });
    }

    // 3. Extraer texto del CV
    const parseResult = await extractTextFromCV(candidate.cv_url);

    if (!parseResult.success || !parseResult.text) {
      // Guardar error de parsing en BD
      await supabaseAdmin
        .from('candidates')
        .update({
          parsing_failed: true,
          parsing_error: parseResult.error || 'Error desconocido al parsear CV'
        })
        .eq('id', candidateId);

      return res.status(400).json({
        success: false,
        error: 'No pudimos leer tu CV. Por favor, intenta con otro archivo: un PDF de mejor calidad (no escaneado) o un documento Word (.docx). Asegúrate que el texto sea seleccionable.'
      });
    }

    const cvText = parseResult.text;

    // 4. Obtener requisitos del proceso
    const { data: process, error: processError } = await supabaseAdmin
      .from('processes')
      .select('mandatory_requirements, optional_requirements, custom_prompt')
      .eq('id', candidate.process_id)
      .single();

    if (processError || !process) {
      return res.status(404).json({
        success: false,
        error: 'Proceso no encontrado'
      });
    }

    // 5. Construir prompt estructurado
    const prompt = buildAnalysisPrompt(
      cvText,
      process.mandatory_requirements || [],
      process.optional_requirements || [],
      process.custom_prompt
    );

    // 6. Llamar a OpenAI para generar preguntas
    let aiResponse;
    try {
      aiResponse = await generateAIResponse(prompt, {
        temperature: 0.4, // Más determinista para generar preguntas consistentes
        maxTokens: 1500,
        responseFormat: 'json'
      });
    } catch (aiError) {
      // Guardar error de IA en BD
      await supabaseAdmin
        .from('candidates')
        .update({
          ai_analysis_failed: true
        })
        .eq('id', candidateId);

      console.error('OpenAI error:', aiError);
      return res.status(500).json({
        success: false,
        error: 'Error al analizar CV con IA. Intenta de nuevo.'
      });
    }

    // 7. Limpiar y parsear respuesta JSON
    let parsedResponse;
    try {
      // Remover markdown code blocks si existen (```json ... ```)
      let cleanedText = aiResponse.text.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText
          .replace(/^```json\n/, '')
          .replace(/^```\n/, '')
          .replace(/\n```$/, '')
          .trim();
      }

      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw AI response:', aiResponse.text);
      return res.status(500).json({
        success: false,
        error: 'Error al procesar respuesta de IA',
        debug: {
          rawResponse: aiResponse.text?.substring(0, 300),
          parseError: parseError instanceof Error ? parseError.message : 'Unknown'
        }
      });
    }

    // 8. Validar estructura de respuesta
    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      return res.status(500).json({
        success: false,
        error: 'Respuesta de IA en formato inválido'
      });
    }

    const questions = parsedResponse.questions.slice(0, 5); // Máximo 5 preguntas

    // 9. Validar que cada pregunta tenga campos requeridos
    const validQuestions = questions.filter((q: any) =>
      q.question &&
      typeof q.is_mandatory === 'boolean'
    );

    if (validQuestions.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'No se generaron preguntas válidas'
      });
    }

    // 10. Guardar preguntas en BD
    const questionsToInsert = validQuestions.map((q: any) => ({
      candidate_id: candidateId,
      question_text: q.question,
      question_reason: q.reason || null,
      is_mandatory: q.is_mandatory,
      is_answered: false
    }));

    const { error: insertError } = await supabaseAdmin
      .from('ai_questions')
      .insert(questionsToInsert);

    if (insertError) {
      console.error('Error inserting questions:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Error al guardar preguntas en base de datos'
      });
    }

    // 11. Guardar cv_text en candidates
    const { error: updateError } = await supabaseAdmin
      .from('candidates')
      .update({
        cv_text: cvText,
        parsing_failed: false,
        parsing_error: null,
        ai_analysis_failed: false
      })
      .eq('id', candidateId);

    if (updateError) {
      console.error('Error updating candidate:', updateError);
    }

    // 12. Retornar éxito
    return res.status(200).json({
      success: true,
      questionsCount: validQuestions.length,
      metadata: {
        cvLength: cvText.length,
        mandatoryCount: validQuestions.filter((q: any) => q.is_mandatory).length,
        optionalCount: validQuestions.filter((q: any) => !q.is_mandatory).length
      }
    });

  } catch (error) {
    console.error('Analyze CV error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Construye el prompt para OpenAI con lógica de priorización y contextualización mejorada
 */
function buildAnalysisPrompt(
  cvText: string,
  mandatoryRequirements: any[],
  optionalRequirements: any[],
  customPrompt?: string
): string {
  return `Eres un experto en análisis de CVs para procesos de reclutamiento. Genera preguntas precisas para verificar requisitos del puesto.

**CV DEL CANDIDATO:**
${cvText}

**REQUISITOS INDISPENSABLES (mandatory):**
${formatRequirements(mandatoryRequirements)}

**REQUISITOS DESEABLES (optional):**
${formatRequirements(optionalRequirements)}

${customPrompt ? `**CRITERIOS ADICIONALES DEL RECLUTADOR:**\n${customPrompt}\n` : ''}

---

**⚠️ REGLA FUNDAMENTAL:**
SOLO genera preguntas sobre requisitos que aparecen en las listas "REQUISITOS INDISPENSABLES" o "REQUISITOS DESEABLES" arriba, o en los "CRITERIOS ADICIONALES DEL RECLUTADOR".

IGNORA completamente cualquier otra habilidad, experiencia o tecnología mencionada en el CV que NO esté en estas listas.

---

**INSTRUCCIONES DE ANÁLISIS:**

**1. BÚSQUEDA SEMÁNTICA FLEXIBLE:**
- Reconoce sinónimos y variaciones de términos sin importar mayúsculas, tildes o guiones
- Reconoce roles/skills equivalentes en diferentes idiomas o con nombres similares
- Si un término está mencionado de CUALQUIER forma relacionada al requisito, considéralo encontrado
- Ejemplo: "Administrativo Contable" = "Admin. contable" = "Administrativo contable" = "Asistente administrativo contable"

**2. MANEJO DE CVs MAL PARSEADOS:**
⚠️ IMPORTANTE: Los CVs pueden tener información desordenada por errores de extracción de texto.
- Si encuentras: [EMPRESA] | [FECHAS] seguido de [tareas/responsabilidades] y luego un [TÉRMINO QUE COINCIDE CON REQUISITO]:
  * Verifica que el término esté en el MISMO BLOQUE de experiencia laboral (cerca de la empresa/fechas)
  * Verifica que NO sea solo una habilidad listada en una sección separada de "Skills" o "Conocimientos"
  * Si cumple ambos → El término ES un rol válido, aunque aparezca después de las tareas
- Si el contexto es ambiguo → Genera pregunta de aclaración (no asumas "sin evidencia")

**3. CRITERIO DE EVIDENCIA:**
- ✅ **EVIDENCIA CLARA:** Rol/skill mencionado con contexto laboral (empresa, años, proyectos específicos)
- ⚠️ **EVIDENCIA PARCIAL:** Mencionado pero sin detalles suficientes (sin años, nivel o contexto)
- ❌ **SIN EVIDENCIA:** No mencionado, o solo listado como "conocimiento" sin experiencia laboral demostrable

**4. CUÁNDO HACER PREGUNTAS:**
- Requisito INDISPENSABLE sin evidencia → Pregunta obligatoria
- Requisito INDISPENSABLE con evidencia parcial → Pregunta de aclaración
- Requisito DESEABLE no mencionado → Pregunta opcional (solo si quedan slots disponibles)
- Máximo 5 preguntas totales, priorizando siempre los indispensables

**5. FORMATO DE PREGUNTAS:**

Sé TRANSPARENTE sobre qué información específicamente falta o no pudiste identificar.

Lineamientos:
- Usa lenguaje de "no se pudo identificar" en lugar de "no se proporciona" (asume posible error del sistema, no culpa al candidato)
- Si encontraste el rol/skill pero falta información → Di qué encontraste y qué específicamente no se pudo identificar
- Si no encontraste el rol/skill → Di claramente que no se pudo identificar en el CV
- Siempre especifica qué datos concretos necesitas (años, nivel, herramientas, contexto laboral, etc.)

**FORMATO DE SALIDA (JSON):**
{
  "questions": [
    {
      "question": "Pregunta específica y contextualizada",
      "reason": "Por qué haces esta pregunta",
      "cv_evidence": "Qué encontraste o no encontraste en el CV",
      "is_mandatory": true/false
    }
  ]
}

Genera las preguntas ahora:`;
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
