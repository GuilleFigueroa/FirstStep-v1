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
        temperature: 0.7,
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
 * Construye el prompt para OpenAI con lógica de priorización
 */
function buildAnalysisPrompt(
  cvText: string,
  mandatoryRequirements: any[],
  optionalRequirements: any[],
  customPrompt?: string
): string {
  return `Eres un asistente de reclutamiento especializado en analizar CVs y generar preguntas específicas para verificar requisitos.

**CONTEXTO:**
Estás analizando el CV de un candidato para un puesto con requisitos específicos (indispensables y deseables).

**CV DEL CANDIDATO:**
${cvText}

**REQUISITOS INDISPENSABLES (mandatory):**
${formatRequirements(mandatoryRequirements)}

**REQUISITOS DESEABLES (optional):**
${formatRequirements(optionalRequirements)}

${customPrompt ? `**CRITERIOS ADICIONALES DEL RECLUTADOR:**\n${customPrompt}\n` : ''}

**TU TAREA:**
1. Analiza el CV y detecta qué requisitos INDISPENSABLES NO se pueden verificar completamente con la información del CV
2. Genera preguntas dirigidas a verificar PRIMERO esos requisitos indispensables (marca con "is_mandatory": true)
3. Si quedan preguntas disponibles (máximo 5 total), genera preguntas para requisitos deseables (marca con "is_mandatory": false)
4. Cada pregunta debe ser específica, directa y fácil de responder

**REGLAS:**
- Máximo 5 preguntas en total
- Priorizar requisitos indispensables primero
- Si un requisito está CLARAMENTE cubierto en el CV, NO preguntar
- Si hay duda o información incompleta, SÍ preguntar
- Preguntas deben permitir respuestas cortas (no ensayos)

**FORMATO DE SALIDA (JSON válido):**
{
  "questions": [
    {
      "question": "¿Cuántos años de experiencia tienes con React?",
      "reason": "Verificar nivel avanzado en React (requisito indispensable)",
      "is_mandatory": true
    },
    {
      "question": "¿Has trabajado con TypeScript en proyectos reales?",
      "reason": "Confirmar experiencia con TypeScript (requisito deseable)",
      "is_mandatory": false
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
