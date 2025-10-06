# Análisis Detallado: Estado Actual y Correcciones Necesarias

## 📊 ESTADO ACTUAL DEL SISTEMA

### 1. ESTRUCTURA DE BASE DE DATOS (Supabase)

#### Tablas Existentes:

**`profiles`** - Usuarios reclutadores
- ✅ Funciona correctamente

**`processes`** - Procesos de reclutamiento
- ✅ Funciona correctamente
- Contiene: `form_questions` (JSONB) - Array de preguntas del formulario

**`candidates`** - Candidatos aplicantes
- ✅ Parcialmente implementado
- Campos: id, process_id, first_name, last_name, email, linkedin_url, cv_url, cv_text, cv_analysis, scoring_details, status, score, etc.
- ❌ **NO tiene** campo `form_answers`

**`ai_questions`** - Preguntas generadas por IA
- ✅ Funciona correctamente
- Contiene: candidate_id, question_text, answer_text, is_mandatory, is_answered
- ✅ **Las respuestas se guardan en la misma tabla**

**`recruiter_questions`** - Preguntas del formulario del reclutador
- ❌ **TABLA EXISTE PERO NO SE USA**
- Estructura: id, process_id, question_text, question_order

**`recruiter_answers`** - Respuestas a preguntas del reclutador
- ❌ **TABLA EXISTE PERO NO SE USA**
- Estructura: id, candidate_id, question_id, answer_text

---

## 🔴 PROBLEMAS IDENTIFICADOS

### Problema 1: Inconsistencia en el Modelo de Datos

**Preguntas IA:**
```
processes.mandatory_requirements (JSON)
     ↓ genera
ai_questions (tabla) → answer_text en la misma tabla ✅
```

**Preguntas del Reclutador (ACTUAL - INCORRECTO):**
```
processes.form_questions (JSON)
     ↓ NO se insertan en tabla
❌ recruiter_questions (vacía, no se usa)
❌ recruiter_answers (vacía, no se usa)
❌ Se intentó guardar en candidates.form_answers (columna no existe)
```

**Preguntas del Reclutador (DEBERÍA SER):**
```
processes.form_questions (JSON)
     ↓ al crear proceso, insertar en
recruiter_questions (tabla) → question_id
     ↓ al responder candidato
recruiter_answers (tabla) → candidate_id, question_id, answer_text ✅
```

### Problema 2: Flujo de Creación de Proceso

**Archivo:** `src/recruiter/services/processService.ts:41`

```typescript
form_questions: data.profile.formQuestions || [],  // Se guarda JSON en processes
```

❌ **NO se crean registros en `recruiter_questions`**

Debería:
1. Insertar proceso
2. Por cada pregunta en `formQuestions`, insertar en `recruiter_questions`
3. Mantener referencia process_id

### Problema 3: Flujo de Guardado de Respuestas

**Archivo creado (INCORRECTO):** `api/save-recruiter-answers.ts`

```typescript
await supabaseAdmin
  .from('candidates')
  .update({
    form_answers: answers,  // ❌ Columna NO existe
    updated_at: new Date().toISOString()
  })
```

**Debería ser:**
```typescript
// Por cada respuesta, insertar en recruiter_answers
for (const answer of answers) {
  await supabaseAdmin
    .from('recruiter_answers')
    .insert({
      candidate_id: candidateId,
      question_id: answer.questionId,  // El ID de recruiter_questions
      answer_text: answer.answerText
    })
}
```

---

## ✅ SOLUCIÓN CORRECTA

### Paso 1: Modificar `createProcess()`

**Archivo:** `src/recruiter/services/processService.ts`

```typescript
export async function createProcess(data: CreateProcessData): Promise<ProcessResponse> {
  try {
    // 1. Crear el proceso
    const processData = {
      recruiter_id: data.recruiterId,
      title: data.jobTitle,
      company_name: data.companyName,
      description: data.profile.title,
      mandatory_requirements: data.profile.mandatoryRequirements,
      optional_requirements: data.profile.optionalRequirements,
      custom_prompt: data.profile.customPrompt,
      form_questions: data.profile.formQuestions || [],  // Mantener JSON para referencia
      candidate_limit: data.candidateLimit,
      status: 'active' as const,
      unique_link: uniqueLink
    }

    const { data: process, error } = await supabase
      .from('processes')
      .insert(processData)
      .select()
      .single()

    if (error) throw error

    // 2. ✅ NUEVO: Insertar preguntas en recruiter_questions
    if (data.profile.formQuestions && data.profile.formQuestions.length > 0) {
      const questionsToInsert = data.profile.formQuestions.map((q, index) => ({
        process_id: process.id,
        question_text: q.question,
        question_type: q.type,  // 'open' o 'multiple-choice'
        question_options: q.options || null,  // Para multiple-choice
        question_order: index + 1
      }))

      const { error: questionsError } = await supabase
        .from('recruiter_questions')
        .insert(questionsToInsert)

      if (questionsError) {
        console.error('Error inserting recruiter questions:', questionsError)
        // Continuar de todos modos, el proceso ya fue creado
      }
    }

    return { success: true, process }
  } catch (error) {
    console.error('Unexpected error creating process:', error)
    return { success: false, error: 'Error inesperado al crear el proceso' }
  }
}
```

### Paso 2: Modificar Endpoint `save-recruiter-answers.ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './utils/supabase';

interface RecruiterAnswer {
  questionId: string;  // ID de recruiter_questions
  answerText: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { candidateId, answers } = req.body as {
      candidateId?: string;
      answers?: RecruiterAnswer[];
    };

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: 'candidateId es requerido'
      });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'answers es requerido y debe ser un array'
      });
    }

    // Validar candidato existe
    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from('candidates')
      .select('id, process_id')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidato no encontrado'
      });
    }

    // ✅ CORRECTO: Insertar respuestas en recruiter_answers
    const answersToInsert = answers.map(answer => ({
      candidate_id: candidateId,
      question_id: answer.questionId,
      answer_text: answer.answerText
    }));

    const { error: insertError } = await supabaseAdmin
      .from('recruiter_answers')
      .insert(answersToInsert);

    if (insertError) {
      console.error('Error inserting recruiter answers:', insertError);
      throw insertError;
    }

    return res.status(200).json({
      success: true,
      message: `${answers.length} respuestas guardadas correctamente`
    });

  } catch (error) {
    console.error('Save recruiter answers error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno al guardar respuestas'
    });
  }
}
```

### Paso 3: Modificar `RecruiterQuestionsStep.tsx`

**Problema actual:** Las preguntas vienen de `process.form_questions` (JSON) pero no tienen los IDs de la tabla `recruiter_questions`

**Solución:**
1. Al cargar el componente, obtener las preguntas de `recruiter_questions` en lugar de `process.form_questions`
2. Usar los IDs reales de la tabla al guardar respuestas

```typescript
export function RecruiterQuestionsStep({ onContinue, onBack, process, candidateId }: RecruiterQuestionsStepProps) {
  const [questions, setQuestions] = useState<RecruiterQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ NUEVO: Cargar preguntas desde recruiter_questions
  useEffect(() => {
    async function loadQuestions() {
      try {
        const { data, error } = await supabase
          .from('recruiter_questions')
          .select('*')
          .eq('process_id', process.id)
          .order('question_order', { ascending: true });

        if (error) throw error;

        setQuestions(data || []);
      } catch (err) {
        console.error('Error loading recruiter questions:', err);
        setError('Error al cargar las preguntas');
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [process.id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Preparar respuestas con IDs reales de recruiter_questions
      const formattedAnswers = Array.from(answers.entries()).map(([questionId, answerText]) => ({
        questionId,  // Ya es el ID de recruiter_questions
        answerText
      }));

      const result = await RecruiterQuestionsService.saveRecruiterAnswers(
        candidateId,
        formattedAnswers
      );

      if (!result.success) {
        setError(result.error || 'Error al guardar respuestas');
        return;
      }

      onContinue();
    } catch (err) {
      console.error('Error submitting answers:', err);
      setError('Error inesperado. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // Si no hay preguntas, continuar automáticamente
  if (!loading && questions.length === 0) {
    onContinue();
    return null;
  }

  // Resto del componente...
}
```

### Paso 4: Actualizar Schema de Supabase

**Verificar/Agregar columnas en `recruiter_questions`:**
- `question_type` (text): 'open' o 'multiple-choice'
- `question_options` (jsonb nullable): Array de opciones para multiple-choice

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Archivos a Modificar:
- [ ] `src/recruiter/services/processService.ts` - Insertar en recruiter_questions
- [ ] `api/save-recruiter-answers.ts` - Usar recruiter_answers tabla
- [ ] `src/candidate/components/RecruiterQuestionsStep.tsx` - Cargar de recruiter_questions
- [ ] `src/shared/services/supabase.ts` - Actualizar interfaces si es necesario
- [ ] `src/shared/services/recruiterQuestionsService.ts` - Actualizar interface RecruiterAnswer

### Archivos a Eliminar:
- [ ] Revertir cambios en `src/shared/services/supabase.ts` (línea 51: `form_answers?: any`)

### Base de Datos:
- [ ] Verificar schema de `recruiter_questions` tiene `question_type` y `question_options`
- [ ] Verificar schema de `recruiter_answers` es correcto

---

## 🎯 RESUMEN

**El problema raíz es:**
Tenemos tablas `recruiter_questions` y `recruiter_answers` que fueron diseñadas correctamente, pero el código nunca las usa. En su lugar, se intentó guardar todo como JSON en el proceso y en el candidato.

**La solución es:**
Usar las tablas existentes siguiendo el mismo patrón que `ai_questions`:
1. Al crear proceso → insertar preguntas en `recruiter_questions`
2. Al responder candidato → insertar respuestas en `recruiter_answers`
3. Cargar preguntas desde la tabla, no desde JSON

**Beneficios:**
- ✅ Estructura consistente con AI questions
- ✅ Normalización de datos correcta
- ✅ Facilita queries y reportes
- ✅ Usa las tablas que ya existen
