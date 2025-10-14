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
  return `Eres un asistente experto en análisis de CVs para procesos de reclutamiento. Genera preguntas precisas y contextualizadas para verificar requisitos.

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

Ejemplo:
- Si el CV menciona "JavaScript" pero JavaScript NO está en los requisitos → NO preguntes sobre JavaScript
- Si el CV menciona "Control de stock" pero NO está en los requisitos → NO preguntes sobre control de stock
- Si los requisitos incluyen "Figma" y el CV NO lo menciona → SÍ pregunta sobre Figma

---

**TU PROCESO DE ANÁLISIS (PASO A PASO):**

**PASO 1 - Analiza cada requisito INDISPENSABLE:**
Para cada requisito mandatory, identifica:
- ¿Está mencionado en el CV? (sí/no/parcialmente)
- Si está mencionado, ¿tiene detalles específicos? (años de experiencia, nivel, contexto laboral)
- ¿Necesita una pregunta de verificación?

**PASO 2 - Analiza requisitos DESEABLES (si quedan slots):**
Solo si no tienes suficientes preguntas mandatory, revisa optional con el mismo criterio.

**PASO 3 - Prioriza las preguntas (máximo 5):**
- PRIORIDAD ALTA: Requisitos mandatory NO mencionados o sin detalles
- PRIORIDAD MEDIA: Requisitos mandatory con información ambigua
- PRIORIDAD BAJA: Requisitos optional sin verificar

---

**REGLAS DE ANÁLISIS:**

1. **EQUIVALENCIAS DE ROLES** (reconoce variaciones ES/EN):
   - Product Manager = Gerente de Producto = Desarrollador de Producto = PM = Product Owner = PO
   - Backend/Frontend/Full Stack Developer = Desarrollador/Ingeniero Backend/Frontend/Full Stack
   - Tech Lead = Líder Técnico = Technical Lead
   - DevOps Engineer = Ingeniero DevOps = SRE
   - Data Scientist = Científico de Datos
   - UX Designer = Diseñador UX
   - QA Engineer = Tester = Quality Assurance

2. **EXPERIENCIA LABORAL vs MENCIÓN:**
   ✅ **Cuenta como experiencia:** "Trabajé como [ROL] en [EMPRESA] (años)"
   ❌ **NO cuenta:** "Conocimientos en...", "Familiarizado con...", "[Skill]" listado sin contexto
   ⚠️ **Pregunta:** Menciones sin años o sin contexto laboral

3. **CERTIFICACIONES (binarias - tiene o no tiene):**
   ✅ **Cuenta como certificación cumplida:**
   - Certificación exacta mencionada en CV
   - Cursos del mismo tema/área (análisis moderado)
   - Ejemplo: Requisito "Certificación PMP" → CV: "Curso de Project Management" → ✅ CUENTA

   ❌ **NO cuenta:**
   - Cursos de temas no relacionados
   - Solo "interesado en..." sin certificación o curso completado

   ⚠️ **Pregunta si NO está en CV:**
   - "¿Tienes certificación en [NOMBRE]? Si no, ¿completaste algún curso o capacitación relacionada con [TEMA]?"

4. **FORMATO DE PREGUNTA (según situación):**

   🔴 **Si requisito MANDATORY NO está en CV:**
   Pedir: empresas/proyectos + años + herramientas específicas

   Template: "No encuentro [REQUISITO] en tu CV, que es indispensable. Describe tu experiencia: ¿En qué empresas/proyectos trabajaste como [ROL]? ¿Cuántos años? ¿Qué herramientas/tecnologías usaste?"

   🟡 **Si requisito está mencionado SIN detalles:**
   Preguntar solo lo que falta (años, contexto, nivel)

   🟢 **Si requisito es ambiguo:**
   Aclarar solo la ambigüedad específica

**FORMATO DE SALIDA (JSON):**
{
  "questions": [
    {
      "question": "Pregunta estructurada según template arriba",
      "reason": "Por qué preguntas esto",
      "cv_evidence": "Qué encontraste o NO encontraste",
      "is_mandatory": true/false
    }
  ]
}

**EJEMPLOS:**
✅ CORRECTO (mandatory NO en CV): "No encuentro experiencia como Frontend Developer en tu CV, que es indispensable. Describe tu experiencia: ¿En qué empresas/proyectos trabajaste como Frontend Developer? ¿Cuántos años? ¿Qué tecnologías usaste (React, Vue, etc.)?"

✅ CORRECTO (mencionado sin años): "Veo 'React' en skills. El requisito pide React avanzado (5+ años). ¿Cuántos años de experiencia profesional tienes con React y en qué proyectos?"

✅ CORRECTO (aclaración): "Trabajaste como 'Desarrollador de Producto' (equivalente a PM) en 2020-2024. ¿Incluía gestión de roadmap y stakeholders?"

❌ INCORRECTO (muy vaga): "¿Tienes experiencia con Figma? ¿Cuántos años?"
❌ INCORRECTO (fuera de requisitos): "¿Experiencia con JavaScript?" (no está en requisitos)

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
