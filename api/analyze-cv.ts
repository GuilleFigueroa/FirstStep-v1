import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './utils/supabase';
import { extractTextFromCV } from './utils/pdfParser';
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

    // 2. Obtener candidato y verificar que tenga CV
    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from('candidates')
      .select('id, cv_url, process_id')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
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
        error: parseResult.error || 'No se pudo extraer texto del CV'
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
  return `Eres un asistente experto en análisis de CVs para procesos de reclutamiento. Tu tarea es generar preguntas precisas y contextualizadas para verificar requisitos.

**CV DEL CANDIDATO:**
${cvText}

**REQUISITOS INDISPENSABLES (mandatory):**
${formatRequirements(mandatoryRequirements)}

**REQUISITOS DESEABLES (optional):**
${formatRequirements(optionalRequirements)}

${customPrompt ? `**CRITERIOS ADICIONALES DEL RECLUTADOR:**\n${customPrompt}\n` : ''}

---

**TU PROCESO DE ANÁLISIS:**

1. **PASO 1 - Analiza cada requisito INDISPENSABLE:**
   Para cada uno, identifica:
   - ¿Está mencionado en el CV? (sí/no/parcialmente)
   - Si está mencionado, ¿tiene detalles específicos suficientes? (años de experiencia, nivel, certificaciones)
   - ¿Necesita una pregunta de verificación?

2. **PASO 2 - Prioriza las preguntas:**
   - PRIORIDAD ALTA: Requisitos mandatory NO mencionados o sin detalles
   - PRIORIDAD MEDIA: Requisitos mandatory con información ambigua
   - PRIORIDAD BAJA: Requisitos optional sin verificar

3. **PASO 3 - Genera preguntas (máximo 5):**
   - Cada pregunta debe referenciar lo que YA está (o NO está) en el CV
   - Ser específica sobre qué información falta
   - Permitir respuestas concretas y cortas

---

**CUÁNDO GENERAR UNA PREGUNTA:**

✅ **SÍ preguntar si:**
- Requisito mandatory NO aparece en el CV
- Requisito mencionado pero SIN años/nivel específico
  * Ejemplo: CV dice "Experiencia con React" pero no dice cuántos años
- Información ambigua o contradictoria
- **IMPORTANTE**: Distinguir entre "mencionar una tecnología" vs "tener experiencia laboral con ella"
  * Si el CV solo lista una tecnología sin contexto → PREGUNTAR años de experiencia
  * Si el CV menciona uso en un proyecto específico → PREGUNTAR duración y profundidad

❌ **NO preguntar si:**
- Requisito tiene información clara y completa en CV
- Requisito optional con evidencia suficiente
- Ya tienes 5 preguntas (límite máximo)

---

**FORMATO DE PREGUNTAS:**

✅ **BUENAS PREGUNTAS (con contexto del CV):**
- "En tu CV mencionas 'React' en tu lista de habilidades. ¿Cuántos años de experiencia laboral tienes usando React en proyectos profesionales?"
- "No encuentro mención de Node.js en tu CV, que es un requisito indispensable. ¿Tienes experiencia con Node.js? Si es así, ¿cuántos años?"
- "Veo que trabajaste como Backend Developer en Empresa X. ¿Podrías especificar qué bases de datos SQL utilizaste y durante cuánto tiempo?"
- "Tu CV menciona 'Python' pero no especifica el nivel. ¿Cuántos años has trabajado profesionalmente con Python y en qué tipo de proyectos?"

❌ **MALAS PREGUNTAS (genéricas, sin contexto):**
- "¿Tienes experiencia con React?"
- "¿Sabes Node.js?"
- "¿Qué tecnologías conoces?"
- "¿Cuánto tiempo usaste Python?" (sin contexto del CV)

---

**FORMATO DE SALIDA (JSON válido):**
{
  "questions": [
    {
      "question": "Texto de la pregunta contextualizada",
      "reason": "Explicación breve de por qué se hace esta pregunta",
      "cv_evidence": "Qué encontraste (o NO encontraste) en el CV",
      "is_mandatory": true
    }
  ]
}

**EJEMPLO COMPLETO:**
{
  "questions": [
    {
      "question": "En tu CV aparece 'React' listado en la sección de habilidades técnicas, pero no veo experiencia laboral específica con esta tecnología. ¿Cuántos años de experiencia profesional tienes desarrollando con React?",
      "reason": "React aparece mencionado pero sin contexto laboral ni años. Requisito: React avanzado (5+ años)",
      "cv_evidence": "CV lista 'React' en habilidades técnicas, pero las experiencias laborales descritas no especifican uso de React ni duración",
      "is_mandatory": true
    },
    {
      "question": "Veo que trabajaste como Backend Developer en Empresa X durante 2 años. ¿Utilizaste Node.js en ese puesto? Es un requisito indispensable y no aparece mencionado en tu CV.",
      "reason": "Node.js no aparece mencionado. Requisito: Node.js (3+ años). Pregunto específicamente sobre su experiencia backend",
      "cv_evidence": "CV menciona 'Backend Developer' pero no especifica tecnologías backend utilizadas. No hay mención de Node.js",
      "is_mandatory": true
    },
    {
      "question": "Tu CV indica experiencia en 'desarrollo de APIs REST'. ¿Qué frameworks o tecnologías específicas utilizaste para esto y durante cuánto tiempo?",
      "reason": "Menciona APIs REST pero sin tecnologías específicas. Necesito verificar si usó las herramientas requeridas",
      "cv_evidence": "CV menciona: 'Desarrollo de APIs REST' pero no especifica si usó Express, NestJS, u otros frameworks",
      "is_mandatory": true
    }
  ]
}

---

**REGLAS FINALES:**
- Máximo 5 preguntas en total
- Priorizar requisitos indispensables primero
- Cada pregunta debe incluir contexto del CV
- Ser específico sobre qué información se necesita
- Permitir respuestas cortas y directas

**CLAVE: EXPERIENCIA vs MENCIÓN**
Al analizar requisitos de tecnologías/herramientas:
1. **Solo menciona la tecnología** (ej: "Python" en lista de skills) → PREGUNTAR años de experiencia profesional
2. **Menciona uso en proyecto** (ej: "Usé Python en proyecto X") → PREGUNTAR duración específica del uso
3. **Menciona años** (ej: "3 años con Python") → NO preguntar, ya está claro
4. **Contexto ambiguo** (ej: "Familiarizado con Python") → PREGUNTAR experiencia laboral real vs conocimiento teórico

La pregunta debe ayudar a distinguir entre:
- Conocimiento teórico vs experiencia laboral real
- Uso esporádico vs uso profesional continuo
- Mención superficial vs dominio profundo

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
