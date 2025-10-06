# FirstStep - Análisis de CV con IA

> **📋 ESPECIFICACIÓN DEL DOCUMENTO:**
> Este es un documento de **hoja de ruta técnica y estructural**, NO un registro de sesiones.
>
> **Al actualizar:**
> - ✅ Actualizar estados de pasos y tareas
> - ✅ Marcar items completados/pendientes
> - ✅ Agregar/modificar especificaciones técnicas
> - ❌ NO agregar secciones de "Sesión X"
> - ❌ NO registrar historial de commits
> - ❌ NO incluir narrativa de proceso
> - ❌ NO duplicar información ya existente

---

## 📊 Estado General

**Progreso:** 5/6 pasos completados (83%)
**Última actualización:** 06-10-2025

| Paso | Estado | Descripción |
|------|--------|-------------|
| 1 | ✅ | Backend Vercel configurado |
| 2 | ✅ | Base de datos modificada |
| 3 | ✅ | Parser PDF/DOCX funcional |
| 4 | ✅ | Análisis CV con IA + generación preguntas |
| 5 | ✅ | UI preguntas + scoring + filtro eliminatorio |
| 6 | ⏳ | Dashboard reclutador con análisis completo |

---

## 🏗️ Stack Técnico

```
Frontend: React + TypeScript + Vite → Vercel
Backend: Vercel Serverless Functions (/api/*)
IA: Vercel AI SDK + GPT-4o-mini
BD: Supabase (PostgreSQL + Storage)
```

**Decisiones arquitectónicas:**
- ✅ Vercel AI SDK (multi-proveedor, optimizado serverless)
- ✅ GPT-4o-mini (~$0.002/candidato)
- ✅ Soft delete candidatos rechazados (no hard delete)
- ✅ Code splitting (RecruiterApp + CandidateApplication separados)

---

## 🔄 Flujo Técnico Completo

### **Frontend: Steps del candidato**

```
1. registration → CandidateRegistration.tsx ✅
   ↓ CandidateService.createCandidate() → BD

2. verification → VerificationStep.tsx ✅
   ↓ Captcha visual

3. profile → CVUploadStep.tsx ✅
   ↓ CandidateService.updateCandidateCV() → Supabase Storage
   ↓ POST /api/analyze-cv (loading: "Analizando CV...")
   ↓ Si error → Mostrar error, bloquear avance
   ↓ Si éxito → onContinue()

4. ai_questions → AIQuestionsStep.tsx (PENDIENTE - PASO 5)
   ↓ AIQuestionsService.getAIQuestions()
   ↓ Candidato responde preguntas (una a la vez)
   ↓ AIQuestionsService.saveAIAnswers()
   ↓ AIQuestionsService.calculateScoring()
   ↓ Si REJECTED → Mensaje rechazo + no continúa
   ↓ Si APPROVED → onContinue()

5. recruiter_questions → RecruiterQuestionsStep.tsx (PENDIENTE - PASO 5)
   ↓ Fetch form_questions desde process
   ↓ Candidato responde formulario
   ↓ POST /api/save-recruiter-answers
   ↓ onContinue()

6. confirmation → Confirmación final ✅
   ↓ "Postulación enviada exitosamente"
```

### **Backend: APIs implementadas**

```
✅ POST /api/analyze-cv
   Input: { candidateId }
   1. Obtener cv_url desde BD
   2. extractTextFromCV(cv_url) → cv_text
   3. Obtener mandatory/optional requirements + custom_prompt
   4. Construir prompt con priorización mandatory
   5. generateAIResponse() → JSON con 3-5 preguntas
   6. Guardar preguntas en ai_questions (con is_mandatory)
   7. Guardar cv_text en candidates
   8. Si error → parsing_failed / ai_analysis_failed = true
   Output: { success: true, questionsCount: 3 } | error

✅ POST /api/save-ai-answers
   Input: { candidateId, answers: [{questionId, answerText}] }
   1. Actualizar ai_questions con answer_text
   Output: { success: true }

⏳ POST /api/calculate-scoring (PASO 5 - Tarea 5.5)
   Input: { candidateId }
   1. Obtener cv_text + requirements + ai_questions + answers
   2. Construir prompt de scoring
   3. generateAIResponse() → JSON con score + meetsAllMandatory
   4. Si meetsAllMandatory = false → status='rejected', rejection_reason
   5. Si true → Guardar score + scoring_details
   Output: { approved: true/false, reason?: string, score?: number }

⏳ POST /api/save-recruiter-answers (PASO 5 - Tarea 5.9)
   Input: { candidateId, answers: [{questionId, answerText}] }
   1. Guardar en recruiter_answers
   Output: { success: true }
```

---

## 🗄️ Base de Datos

### Tablas creadas:
- `ai_questions` - Preguntas generadas por IA con `is_mandatory`
- `recruiter_questions` - Preguntas configuradas por reclutador
- `recruiter_answers` - Respuestas a preguntas formulario

### Columnas agregadas:

**`processes`:**
- `mandatory_requirements` (JSONB) - Requisitos indispensables
- `optional_requirements` (JSONB) - Requisitos deseables
- `custom_prompt` (TEXT) - Criterios adicionales del reclutador

**`candidates`:**
- `cv_text` (TEXT) - CV parseado
- `cv_analysis` (JSONB) - Análisis estructurado IA
- `scoring_details` (JSONB) - Desglose scoring
- `rejection_reason` (TEXT) - Razón de rechazo (soft delete)
- `parsing_failed` (BOOL) - Flag error parsing
- `parsing_error` (TEXT) - Mensaje error parsing
- `ai_analysis_failed` (BOOL) - Flag error IA

### Estructura de requisitos:

**Frontend (JobProfile):**
```json
{
  "mandatoryRequirements": [
    { "id": "req-0", "title": "React", "level": "avanzado (5+ años)", "category": "tools", "required": true }
  ],
  "optionalRequirements": [
    { "id": "req-1", "title": "Node.js", "level": "intermedio (2-4 años)", "category": "tools", "required": false }
  ]
}
```

**Backend (Process table):**
```json
{
  "mandatory_requirements": [...],
  "optional_requirements": [...]
}
```

---

## 🎯 PASO 1: Backend Vercel ✅ COMPLETADO

**Implementado:**
- ✅ Carpeta `/api` creada
- ✅ `vercel.json` configurado
- ✅ `/api/health.ts` funcional
- ✅ Deploy en Vercel
- ✅ Variables entorno configuradas

**Verificación:** `https://first-step-v1.vercel.app/api/health` → `{ status: "ok" }`

---

## 🎯 PASO 2: Base de Datos ✅ COMPLETADO

**Implementado:**
- ✅ Modificar tabla `processes` (mandatory_requirements, optional_requirements, custom_prompt)
- ✅ Modificar tabla `candidates` (cv_text, cv_analysis, scoring_details, rejection_reason, parsing_failed, parsing_error, ai_analysis_failed)
- ✅ Crear tabla `ai_questions` (con is_mandatory, ON DELETE CASCADE)
- ✅ Crear tabla `recruiter_questions`
- ✅ Crear tabla `recruiter_answers`
- ✅ Índices creados
- ✅ Tipos TypeScript actualizados en `supabase.ts`

---

## 🎯 PASO 3: Parser PDF/DOCX ✅ COMPLETADO

**Implementado:**
- ✅ `/api/utils/pdfParser.ts` con soporte PDF y DOCX
- ✅ `/api/utils/supabase.ts` con SERVICE_ROLE_KEY
- ✅ Validación texto extraído (mín 50 chars)
- ✅ Manejo errores completo
- ✅ Bucket: `candidate-cvs` (flat structure)

**Path pattern:** `{candidateId}-{timestamp}-{fileName}`

---

## 🎯 PASO 4: Análisis CV con IA ✅ COMPLETADO

**Implementado:**

### Backend:
- ✅ `/api/utils/openai.ts` - Wrapper Vercel AI SDK
- ✅ `/api/analyze-cv.ts` - Análisis completo con priorización
- ✅ `/api/save-ai-answers.ts` - Guardar respuestas
- ✅ Prompt estructurado con mandatory/optional + custom_prompt
- ✅ Validación JSON con limpieza markdown code blocks
- ✅ Batch insert preguntas en `ai_questions`
- ✅ Manejo errores parsing/IA guardados en BD

### Frontend:
- ✅ `aiQuestionsService.ts` - getAIQuestions, saveAIAnswers, calculateScoring
- ✅ `candidateService.analyzeCVWithAI()` - Llamada a API
- ✅ CVUploadStep integrado con loading states
- ✅ Manejo errores en UI

### API Key:
- ✅ `OPENAI_API_KEY` configurada en Vercel
- ✅ Modelo: `gpt-4o-mini-2024-07-18`
- ✅ Costo verificado: ~$0.002/análisis

**Archivos:**
- `api/analyze-cv.ts` (293 líneas)
- `api/save-ai-answers.ts` (86 líneas)
- `src/shared/services/aiQuestionsService.ts` (112 líneas)
- `src/candidate/components/CVUploadStep.tsx` (integración líneas 100-110)

---

## 🎯 PASO 5: UI Preguntas + Scoring ✅ COMPLETADO

**Objetivo:** Interfaces para responder preguntas + evaluación con scoring + filtro eliminatorio

### Progreso: 12/15 tareas completadas (80%)

**✅ Completado:**
- **Tarea 5.1-5.2:** Diseño UI definido (AIQuestionsStep + RecruiterQuestionsStep)
- **Tarea 5.2-bis:** Code splitting implementado
  - Bundle: 774 KB → 427 KB (reclutador) / 352 KB (candidato)
  - Lazy load RecruiterApp + CandidateApplication
- **Tarea 5.3:** `aiQuestionsService.ts` creado
- **Tarea 5.4:** `/api/save-ai-answers.ts` implementado
- **Tarea 5.5:** `/api/calculate-scoring.ts` implementado (329 líneas)
  - Scoring moderado con tolerance
  - Soft delete de rechazados
  - Evaluación mandatory/optional requirements
- **Tarea 5.6:** `AIQuestionsStep.tsx` implementado (371 líneas)
  - Navegación lineal entre preguntas
  - Guardar respuestas + calcular scoring
  - Pantalla de rechazo si no cumple mandatory
  - Continuar a recruiter_questions si aprobado
- **Tarea 5.8:** `recruiterQuestionsService.ts` creado
- **Tarea 5.9:** `/api/save-recruiter-answers.ts` implementado
  - Guarda respuestas en tabla `recruiter_answers`
  - Estructura relacional correcta
- **Tarea 5.10:** `RecruiterQuestionsStep.tsx` implementado (267 líneas)
  - Carga preguntas desde tabla `recruiter_questions`
  - Soporte para preguntas open y multiple-choice
  - Navegación lineal con progress indicator
- **Tarea 5.12:** `CandidateFlow.tsx` actualizado
  - 6 steps: registration → verification → profile → ai_questions → recruiter_questions → confirmation
  - Navegación condicional (salta recruiter_questions si no hay preguntas)
- **Tarea 5.13:** Flujo completo probado y funcional

**⏳ Pendiente (opcional):**

**Tarea 5.5 (COMPLETADA):** ~~Crear `/api/calculate-scoring.ts`~~ ✅
```typescript
// FASE 1 (Implementación inicial - MVP):
// Input: { candidateId }
// 1. Obtener cv_text, requirements, ai_questions + answers
// 2. Prompt de scoring MODERADO (temperature: 0.3)
//    - Rechaza solo si claramente no cumple mandatory
//    - Acepta candidatos "borderline" (ej: pide 5 años, tiene 4)
// 3. generateAIResponse() → { score, meetsAllMandatory, details }
// 4. Si meetsAllMandatory = false → status='rejected', rejection_reason
// 5. Si true → status='completed', score + scoring_details
// Output: { approved: true/false, reason?: string, score?: number }

// Estructura scoring_details (flexible):
// {
//   "score": 75,
//   "meetsAllMandatory": true,
//   "mandatory_evaluation": [{ requirement, meets, evidence }],
//   "optional_evaluation": [{ requirement, meets, evidence }],
//   "summary": "..."
// }
```

**Tarea 5.5-bis:** Agregar selector de modo de filtro (Feature adicional)
```typescript
// FASE 2 (Después de validar Tarea 5.5):
// 1. Agregar columna a processes:
//    ALTER TABLE processes ADD COLUMN scoring_mode VARCHAR(20) DEFAULT 'moderate';
//    Valores: 'strict' | 'moderate'
//
// 2. Frontend (JobProfile): Agregar selector
//    <Select value={scoringMode}>
//      <option value="moderate">Moderado (recomendado)</option>
//      <option value="strict">Estricto</option>
//    </Select>
//
// 3. Backend: Actualizar /api/calculate-scoring.ts
//    - Leer process.scoring_mode
//    - buildStrictPrompt() vs buildModeratePrompt()
//
// Modo STRICT: Rechaza si no cumple exactamente requisitos
// Modo MODERATE: Tolerante con experiencia cercana
//
// Esfuerzo: ~30-40 minutos
// Beneficio: Control total del reclutador sobre filtro
```

**Tarea 5.5-bis (OPCIONAL):** Agregar selector modo filtro strict/moderate
- Feature adicional para control del reclutador
- Requiere columna `scoring_mode` en processes
- Esfuerzo estimado: 30-40 minutos

---

## 🎯 PASO 6: Dashboard Reclutador ⏳ PENDIENTE

**Objetivo:** Mostrar análisis completo de candidatos aprobados

**Pendiente:**

1. Crear `/api/get-candidate-analysis.ts`
   - Input: `{ candidateId }`
   - Output: cv_text, score, scoring_details, ai_questions, recruiter_answers

2. Actualizar `CandidateProfile.tsx`
   - Split screen: CV parseado (izquierda) | Análisis (derecha)
   - Sección Scoring (barra progreso 0-100, badge APPROVED)
   - Sección Requisitos Cumplidos (checkmarks + evidencia)
   - Sección Requisitos Faltantes (si aplica)
   - Sección Preguntas IA (pregunta + respuesta + razón)
   - Sección Preguntas Formulario

---

## 📋 Decisiones Técnicas

### Niveles de experiencia (todas las categorías)

**Valores en BD:**
- `"básico (0-2 años de experiencia)"`
- `"intermedio (2-4 años de experiencia)"`
- `"avanzado (5+ años de experiencia)"`

**UI:** Select muestra solo "Básico", "Intermedio", "Avanzado" (dropdown muestra años)

**IA:** Interpreta texto explícito como criterio objetivo

### Scoring y feedback al candidato

- ❌ NO mostrar scoring durante Steps 1-5
- ✅ Scoring se ejecuta silenciosamente después de ai_questions
- ✅ Resultado se muestra UNA SOLA VEZ en Step 6 (confirmation)
- ✅ Sin re-acceso (evitar intentos múltiples)

### Custom Prompt del reclutador

- ✅ Se guarda en `processes.custom_prompt`
- ✅ Se usa en `/api/analyze-cv` (generación preguntas)
- ✅ Se usa en `/api/calculate-scoring` (evaluación)

### Error handling

- ✅ Reintento permitido en CVUploadStep
- ✅ Errores guardados en BD (tracking)
- ❌ Candidatos con errores NO aparecen en dashboard

### Límite de candidatos

- ✅ Cuentan todos con `cv_text IS NOT NULL`
- ✅ Tanto aprobados como rechazados
- ❌ NO cuentan abandonos o errores parsing

### Candidatos múltiples procesos

- ✅ Mismo email/LinkedIn puede aplicar a diferentes procesos
- ❌ NO puede aplicar 2+ veces al MISMO proceso

---

## 🔧 Configuración Vercel

### Variables de Entorno

```env
# Vercel dashboard → Settings → Environment Variables
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### vercel.json (ACTUALIZADO 06-10-2025)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "devCommand": "npm run dev",        // ✅ Agregado para vercel dev
  "framework": null,                   // ✅ Especificado para Vite custom
  "rewrites": [
    {
      "source": "/((?!api).*)",       // ✅ Excluye /api/* de rewrites
      "destination": "/index.html"
    }
  ]
}
```

**Fix aplicado (06-10-2025):**
- ✅ Agregado `devCommand` para que `vercel dev` use `npm run dev`
- ✅ Especificado `framework: null` (proyecto Vite custom)
- ✅ Cambiado rewrite de `/(.*)`  a `/((?!api).*)` para excluir rutas API
- ✅ Resuelto error: "Failed to parse source for import analysis"
- ✅ `vercel dev` ahora funciona correctamente

---

## 📝 Archivos Clave

### Backend
- `api/analyze-cv.ts` - Análisis CV + generación preguntas
- `api/save-ai-answers.ts` - Guardar respuestas IA
- `api/utils/openai.ts` - Wrapper Vercel AI SDK
- `api/utils/pdfParser.ts` - Extracción texto PDF/DOCX
- `api/utils/supabase.ts` - Cliente Supabase admin

### Frontend
- `src/candidate/components/CandidateFlow.tsx` - Orquestador steps
- `src/candidate/components/CVUploadStep.tsx` - Upload + análisis IA
- `src/shared/services/aiQuestionsService.ts` - Servicio preguntas IA
- `src/shared/services/candidateService.ts` - CRUD candidatos

### Archivos PASO 5 (completados)
- ✅ `api/calculate-scoring.ts` - Scoring con filtro eliminatorio
- ✅ `api/save-recruiter-answers.ts` - Guardar respuestas formulario
- ✅ `src/candidate/components/AIQuestionsStep.tsx` - UI preguntas IA
- ✅ `src/candidate/components/RecruiterQuestionsStep.tsx` - UI formulario
- ✅ `src/shared/services/recruiterQuestionsService.ts` - Servicio formulario

---

**Última actualización:** 06-10-2025
**Siguiente paso:** Implementar Dashboard Reclutador (Paso 6)
