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

**Progreso:** 6/6 pasos completados (100%) ✅
**Última actualización:** 05-11-2025
**Estado del sistema:** COMPLETAMENTE FUNCIONAL Y EN PRODUCCIÓN

| Paso | Estado | Descripción | Verificación |
|------|--------|-------------|--------------|
| 1 | ✅ | Backend Vercel configurado | Producción estable |
| 2 | ✅ | Base de datos modificada | Esquema completo |
| 3 | ✅ | Parser PDF/DOCX funcional | Probado con CVs reales |
| 4 | ✅ | Análisis CV con IA + generación preguntas | GPT-4o-mini integrado |
| 5 | ✅ | UI preguntas + scoring + filtro eliminatorio | Flujo completo operativo |
| 6 | ✅ | Dashboard reclutador con análisis completo | 100% datos reales |

**Mejoras adicionales implementadas:**
- ✅ Protección IDOR en APIs de candidatos (commit a58574b)
- ✅ Optimización de prompts IA con análisis semántico (commit c6487a3)
- ✅ Persistencia de estados de seguimiento (reviewed, contacted, favorite) (commit 1b17940)
- ✅ Vista detallada de postulaciones (PostulationDetailView.tsx) (commit 1685a25)
- ✅ Modificación dinámica de límite de candidatos (commit 65a1666)
- ✅ Gestión de estados: cerrar/pausar/activar procesos (commit 002818e)
- ✅ Filtrado backend de candidatos por proceso y nombre (commit 12e128d, d72dfbc)
- ✅ Eliminación permanente de candidatos con confirmación (commit 1b08534)
- ✅ Eliminación permanente de procesos con diálogo informativo (commit 651cd61, dd15524)
- ✅ Card de feedback del candidato en perfil de reclutador (commit 3b41600)
- ✅ Expansión de keywords de detección de requisitos: 23 → 241 keywords (commit 7ff6d58)
- ✅ Mejoras UI configuración de perfiles con alertas y validación (commit 4581cfb)

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

4. ai_questions → AIQuestionsStep.tsx ✅
   ↓ AIQuestionsService.getAIQuestions()
   ↓ Candidato responde preguntas (una a la vez)
   ↓ AIQuestionsService.saveAIAnswers()
   ↓ AIQuestionsService.calculateScoring()
   ↓ Si REJECTED → Mensaje rechazo + no continúa
   ↓ Si APPROVED → onContinue()

5. recruiter_questions → RecruiterQuestionsStep.tsx ✅
   ↓ Carga desde recruiter_questions (tabla BD)
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

✅ POST /api/calculate-scoring
   Input: { candidateId }
   1. Obtener cv_text + requirements + ai_questions + answers
   2. Construir prompt de scoring
   3. generateAIResponse() → JSON con score + meetsAllMandatory
   4. Si meetsAllMandatory = false → status='rejected', rejection_reason
   5. Si true → Guardar score + scoring_details
   Output: { approved: true/false, reason?: string, score?: number }

✅ POST /api/save-recruiter-answers
   Input: { candidateId, answers: [{questionId, answerText}] }
   1. Guardar en recruiter_answers
   Output: { success: true }

✅ GET /api/get-candidate-analysis
   Input: candidateId (query param)
   1. Obtener candidato (solo status='completed' o 'rejected')
   2. Obtener ai_questions con respuestas
   3. Obtener recruiter_questions + recruiter_answers
   4. Extraer mandatory_evaluation y optional_evaluation de scoring_details
   5. Combinar en array plano con is_met y evidence
   Output: { candidate, aiQuestions, recruiterQuestions, requirements[], process }

✅ /api/utils/auth.ts (Protección IDOR)
   - verifyCandidateOwnership(candidateId, recruiterId)
   - Valida que candidato pertenece al reclutador
   - Previene acceso no autorizado a datos de candidatos
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
- `action_status` (TEXT) - Estado seguimiento: none, reviewed, contacted, sent
- `is_favorite` (BOOL) - Marcado como favorito por reclutador

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

### Progreso: 13/13 tareas completadas (100%)

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

---

## 🎯 PASO 6: Dashboard Reclutador ✅ COMPLETADO

**Implementado:**
- ✅ `/api/get-candidate-analysis.ts` - Endpoint completo
- ✅ `CandidateProfile.tsx` actualizado con análisis completo
- ✅ Vista de scoring con desglose
- ✅ Requisitos cumplidos/faltantes
- ✅ Preguntas IA + respuestas
- ✅ Preguntas formulario + respuestas
- ✅ CV parseado visible
- ✅ Estados de seguimiento (reviewed, contacted, favorite)
- ✅ Card de feedback del candidato

---

## 🎯 MEJORA: Detección de Requisitos Expandida ✅ COMPLETADO

**Objetivo:** Ampliar detección de keywords para perfiles tech y no-tech

**Implementado (commit 7ff6d58):**
- ✅ Expansión de keywords: 23 → 241 keywords (948% incremento)
- ✅ Títulos de trabajo: 4 → 50+ (con variantes en inglés y español)
- ✅ Herramientas: 10 → 121 items
  - Frontend: JavaScript, TypeScript, React, Vue, Angular, etc.
  - Backend: Node.js, Python, Java, .NET, Go, etc.
  - Databases: PostgreSQL, MySQL, MongoDB, Redis, etc.
  - Cloud: AWS, Azure, GCP, etc.
  - DevOps: Docker, Kubernetes, Jenkins, etc.
  - No-tech: Salesforce, HubSpot, Google Analytics, SAP, etc.
- ✅ Skills técnicas: 5 → 99 items
  - UX/UI, APIs, Sales, Finance, Legal, RRHH, Marketing, etc.
- ✅ Otras skills: 3 → 21 items (idiomas y certificaciones)
- ✅ Eliminación de soft skills (comunicación, liderazgo, etc.)
- ✅ Requisito de experiencia específico: `Experiencia como ${title}` (no genérico)
- ✅ Detección bilingüe: "Fullstack Developer" vs "Desarrollador Full Stack"

**Archivo modificado:**
- `src/recruiter/components/profile-config/TextAnalysisMode.tsx` (líneas 57-511)

**Performance:**
- Tiempo de detección: ~5-8ms (imperceptible con delay de 2s)
- Algoritmo: O(n×m×k) donde n=241, m=3, k=2000

---

## 🎯 MEJORA: UI Configuración de Perfiles ✅ COMPLETADO

**Objetivo:** Mejorar claridad y UX del flujo de configuración

**Implementado (commit 4581cfb):**
- ✅ Badge de "Análisis completado" visible
- ✅ Card de advertencia roja con información sobre requisitos obligatorios
- ✅ Viñetas en puntos de advertencia
- ✅ Label "Nombre del Puesto" más descriptivo
- ✅ Subtítulo actualizado: "Revisa, edita, agrega o elimina requisitos según sea necesario"
- ✅ `CustomPromptBox` simplificado (96 → 46 líneas)
  - Eliminada sección de ejemplos
  - Reducción de bundle: -1.79 KB
  - UI más limpia y compacta

**Archivos modificados:**
- `src/recruiter/components/RecruiterApp.tsx`
- `src/recruiter/components/profile-config/TextAnalysisMode.tsx`
- `src/recruiter/components/profile-config/CustomPromptBox.tsx`

---

## 📝 Decisiones Arquitectónicas

### **1. Soft Delete (no Hard Delete)**
- ✅ Candidatos rechazados: `status='rejected'` + `rejection_reason`
- ✅ Previene re-intentos infinitos
- ✅ Permite auditoría y analytics

### **2. Estructura ai_questions con `is_mandatory`**
- ✅ IA decide priorización en `/api/analyze-cv`
- ✅ Scoring usa flag para ponderar
- ✅ Reclutador ve qué preguntas eran críticas

### **3. Custom Prompt del Reclutador**
- ✅ Configurado en `CustomPromptBox`
- ✅ Guardado en `processes.custom_prompt`
- ✅ Usado en `/api/analyze-cv` y `/api/calculate-scoring`

### **4. Scoring Moderado**
- ✅ Temperature: 0.3 (consistencia)
- ✅ Tolerance para candidatos "borderline"
- ✅ Rechazo solo si claramente no cumple mandatory

### **5. Protección IDOR**
- ✅ `verifyCandidateOwnership()` en todas las APIs
- ✅ Valida que candidato pertenece al reclutador
- ✅ Previene acceso no autorizado

### **6. Code Splitting**
- ✅ RecruiterApp y CandidateApplication separados
- ✅ Lazy loading con Suspense
- ✅ Bundle optimizado: 774 KB → 427 KB / 352 KB

---

## 🔧 Variables de Entorno

```env
# Vercel dashboard → Settings → Environment Variables
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## ✅ Checklist Final

- [x] 6 pasos completados y verificados
- [x] Tests manuales flujo candidato completo
- [x] Tests manuales dashboard reclutador
- [x] Manejo errores robusto
- [x] Code splitting implementado
- [x] Protección IDOR
- [x] Soft delete candidatos
- [x] Estados de seguimiento
- [x] Expansión de keywords
- [x] UI mejorada
- [ ] Rate limiting (pendiente V2)
- [ ] Logs configurados (pendiente V2)
- [ ] Monitoreo costos OpenAI (pendiente V2)

---

**Estado:** 🟢 COMPLETAMENTE FUNCIONAL Y EN PRODUCCIÓN
**Última actualización:** 05-11-2025
