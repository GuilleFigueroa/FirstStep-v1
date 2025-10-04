# FirstStep - Implementación de Análisis de CV con IA

## 📊 Estado General

**Progreso:** 3/7 pasos completados (43%)
**Fecha inicio:** 30-09-2024
**Última actualización:** 03-10-2025

| Paso | Estado | Descripción |
|------|--------|-------------|
| 1 | ✅ | Backend Vercel configurado |
| 2 | ✅ | Base de datos modificada |
| 3 | ✅ | Parser PDF/DOCX funcional |
| 4 | 🔄 | `/api/analyze-cv` + integración CVUploadStep (Sub-paso 4.1 ✅ | 4.2-4.5 ⏳) |
| 5 | ⏳ | UI AIQuestionsStep + RecruiterQuestionsStep |
| 6 | ⏳ | `/api/calculate-scoring` + filtro eliminatorio |
| 7 | ⏳ | Dashboard reclutador con análisis completo |

---

## 🏗️ Stack Técnico

```
Frontend: React + TypeScript + Vite → Vercel
Backend: Vercel Serverless Functions (/api/*)
IA: Vercel AI SDK + GPT-4o-mini
BD: Supabase (PostgreSQL + Storage)
```

**Decisión clave:** Vercel AI SDK (no SDK directo OpenAI)
- ✅ Multi-proveedor: Cambiar entre OpenAI/Claude/Gemini sin refactorizar
- ✅ Optimizado para serverless
- ✅ Timeout y JSON mode integrados

---

## 🔄 Flujo Técnico Completo (Candidato)

### **FRONTEND: CandidateFlow.tsx - Steps definidos**

```
Step 1: registration → CandidateRegistration.tsx ✅
  ↓ CandidateService.createCandidate() → BD

Step 2: verification → VerificationStep.tsx ✅
  ↓ Captcha visual

Step 3: profile → CVUploadStep.tsx ✅
  ↓ CandidateService.updateCandidateCV() → Supabase Storage
  ↓ **INTEGRACIÓN CRÍTICA:** POST /api/analyze-cv (loading: "Analizando CV...")
  ↓ Si error parsing/IA → Mostrar error, bloquear avance
  ↓ Si éxito → onContinue()

Step 4: ai_questions → AIQuestionsStep.tsx (NUEVO - PASO 5)
  ↓ Fetch ai_questions desde BD
  ↓ Candidato responde preguntas IA
  ↓ POST /api/save-ai-answers
  ↓ **LLAMADA IA #2:** POST /api/calculate-scoring
  ↓ Si REJECTED (no cumple requisitos indispensables) → Hard delete + Mensaje
  ↓ Si APPROVED → onContinue()

Step 5: recruiter_questions → RecruiterQuestionsStep.tsx (NUEVO - PASO 5)
  ↓ Fetch form_questions desde process
  ↓ Candidato responde formulario reclutador
  ↓ POST /api/save-recruiter-answers
  ↓ onContinue()

Step 6: confirmation → Confirmación final ✅
  ↓ "Postulación enviada exitosamente"
```

### **BACKEND: Flujo de APIs**

```
POST /api/analyze-cv (PASO 4 - EN PROGRESO)
  Input: { candidateId }
  1. Obtener candidate.cv_url desde BD
  2. extractTextFromCV(cv_url) → cv_text
  3. Obtener process.mandatory_requirements + optional_requirements
  4. Construir prompt para IA
  5. generateAIResponse() → JSON con 3-5 preguntas
  6. Guardar preguntas en ai_questions
  7. Guardar cv_text en candidates
  8. Si error → candidates.parsing_failed / ai_analysis_failed = true
  Output: { success: true, questionsCount: 3 } | { success: false, error: "..." }

POST /api/save-ai-answers (PASO 5)
  Input: { candidateId, answers: [{questionId, answer}] }
  1. Actualizar ai_questions con answer_text
  Output: { success: true }

POST /api/calculate-scoring (PASO 6)
  Input: { candidateId }
  1. Obtener cv_text + mandatory_requirements + ai_questions + answers
  2. Construir prompt de scoring
  3. generateAIResponse() → JSON con score + details
  4. Si meetsAllMandatory = false → DELETE candidate + retornar reason
  5. Si true → Guardar score + scoring_details en candidates
  Output: { approved: true, score: 85 } | { approved: false, reason: "..." }

POST /api/save-recruiter-answers (PASO 5)
  Input: { candidateId, answers: [{questionId, answer}] }
  1. Guardar en recruiter_answers
  Output: { success: true }
```

**Costos IA por candidato:**
- Análisis: ~$0.03 (2000-3000 tokens)
- Scoring: ~$0.04 (3000-4000 tokens)
- **Total: $0.07 USD**

---

## 🎯 Decisiones Técnicas: Evaluación de Requisitos

### **Mapeo nivel → años (TODAS las categorías)**

**Valores guardados en BD:**
- `"básico (0-2 años de experiencia)"`
- `"intermedio (2-4 años de experiencia)"`
- `"avanzado (5+ años de experiencia)"`

**Aplicación:**
- `tools` (React, Node.js, etc.) → Años de uso
- `technical` (Arquitectura, Patrones) → Años aplicando
- `other-skills` (Git, Scrum, etc.) → Años de experiencia

**Interpretación IA:**
- "React intermedio (2-4 años de experiencia)" → Buscar evidencia de 2-4 años con React
- Si CV no menciona años → IA genera pregunta para verificar
- Scoring usa el rango como criterio objetivo

**Ventaja:** Texto explícito elimina ambigüedad interpretativa para la IA

**UI:** Select muestra solo "Básico", "Intermedio", "Avanzado" (dropdown muestra años)

### **Requisitos no medibles por CV (FUERA DE SCOPE)**
- Soft skills, pensamiento crítico, liderazgo → Se evalúan en entrevista presencial
- FirstStep se enfoca en skills técnicos verificables mediante CV + preguntas IA

### **Feature pospuesta a V2:**
- Descripción custom por requisito (ej: "React avanzado con hooks + performance")
- Razón: Priorizar MVP funcional, agregar refinamientos post-validación

---

## 🗄️ Base de Datos

### Tablas creadas:
- `ai_questions` - Preguntas generadas por IA
- `recruiter_questions` - Preguntas configuradas por reclutador
- `recruiter_answers` - Respuestas a preguntas formulario

### Columnas agregadas:
**`processes`:**
- `mandatory_requirements` (JSONB) - Requisitos indispensables
- `optional_requirements` (JSONB) - Requisitos deseables

**`candidates`:**
- `cv_text` (TEXT) - CV parseado
- `cv_analysis` (JSONB) - Análisis estructurado IA
- `scoring_details` (JSONB) - Desglose scoring
- `parsing_failed` (BOOL) - Flag error parsing
- `parsing_error` (TEXT) - Mensaje error parsing
- `ai_analysis_failed` (BOOL) - Flag error IA

---

## 🎯 PASO 1: Setup Backend ✅ COMPLETADO

**Objetivo:** Infraestructura backend básica

**Tareas completadas:**
- [x] Carpeta `/api` creada
- [x] `vercel.json` configurado
- [x] `/api/health.ts` funcional
- [x] Deploy en Vercel
- [x] Variables entorno configuradas

**Verificación:** ✅ `https://first-step-v1.vercel.app/api/health` retorna `{ status: "ok" }`

---

## 🎯 PASO 2: Base de Datos ✅ COMPLETADO

**Objetivo:** Estructura BD para flujo IA completo

**Tareas completadas:**
- [x] Modificar tabla `processes` (2 columnas: `mandatory_requirements`, `optional_requirements`)
- [x] Modificar tabla `candidates` (columnas: `cv_text`, `cv_analysis`, `scoring_details`, `parsing_failed`, `parsing_error`, `ai_analysis_failed`)
- [x] Agregar columna `rejection_reason` a tabla `candidates` (para soft delete - COMPLETADO 03/10/2025)
- [x] Crear tabla `ai_questions` (con `is_mandatory` para priorización)
- [x] Crear tabla `recruiter_questions`
- [x] Crear tabla `recruiter_answers`
- [x] Índices creados
- [x] Tipos TypeScript actualizados en `supabase.ts`

**Verificación:** ✅ 3 tablas creadas, 8 columnas agregadas en `candidates` + 2 en `processes`, SQL ejecutado en Supabase

---

## 🎯 PASO 3: Parser PDF/DOCX ✅ COMPLETADO

**Objetivo:** Extraer texto de CVs

**Tareas completadas:**
- [x] Instalar `pdf-parse` + `mammoth`
- [x] `/api/utils/pdfParser.ts` funcional
- [x] `/api/utils/supabase.ts` con SERVICE_ROLE_KEY
- [x] `/api/test-parser.ts` endpoint prueba
- [x] Soporte PDF y DOCX
- [x] Validación texto extraído (mín 50 chars)
- [x] Manejo errores completo
- [x] Detección dinámica bucket `candidate-cvs`
- [x] Probado con CV real en producción

**Verificación:** ✅ `POST /api/test-parser` funcional en producción

---

## 🎯 PASO 4: Integración OpenAI ⏳ EN PROGRESO

**Objetivo:** Análisis CV y generación preguntas con IA

**Prerequisitos:**
- ✅ PASO 3 completado
- ✅ API key OpenAI configurada en Vercel (REQUERIDO)

**Decisión arquitectónica:** Vercel AI SDK (no SDK directo)

**Decisión de desarrollo:** Implementación directa con API real
- ✅ Desarrollo incremental con OpenAI desde el principio
- ✅ Resultados reales en cada iteración
- ✅ Sin sorpresas al pasar a producción
- ✅ Costo de desarrollo estimado: $2-5 USD (testing y ajustes)

**Sub-paso 4.1: Configurar API key en Vercel** ✅ COMPLETADO (03/10/2025)
- [x] Obtener API key de OpenAI (https://platform.openai.com/api-keys)
- [x] Vercel Dashboard → Settings → Environment Variables
- [x] Agregar `OPENAI_API_KEY=sk-proj-...`
- [x] Re-deploy para aplicar cambios
- [x] Verificar variable accesible: `process.env.OPENAI_API_KEY`
- [x] Endpoint `/api/test-openai` creado y verificado (27 tokens, ~$0.000005 USD, latencia 1.3s)

**Sub-paso 4.2: Crear `/api/analyze-cv.ts` con OpenAI**
- [ ] Input validation: `candidateId` requerido
- [ ] Obtener `cv_url` y `process_id` desde BD (candidates)
- [ ] Llamar `extractTextFromCV(cv_url)` → `cv_text`
- [ ] Si parsing falla → Actualizar BD (`parsing_failed = true, parsing_error`) + retornar error
- [ ] Obtener de BD: `mandatory_requirements`, `optional_requirements`, `custom_prompt` (columnas separadas)
- [ ] Construir prompt estructurado con lógica de priorización:
  - [ ] CV completo (`cv_text`)
  - [ ] Requisitos indispensables (`mandatory_requirements`) con descripción
  - [ ] Requisitos deseables (`optional_requirements`) con descripción
  - [ ] `custom_prompt` del reclutador (si existe)
  - [ ] **Instrucciones de priorización para IA:**
    - [ ] Analizar qué requisitos mandatory NO se pueden verificar completamente en el CV
    - [ ] Generar preguntas dirigidas a verificar PRIMERO esos requisitos mandatory (`is_mandatory: true`)
    - [ ] Si quedan preguntas disponibles (máx 5), generar para requisitos optional (`is_mandatory: false`)
    - [ ] Cantidad adaptativa: más requisitos mandatory sin evidencia = más preguntas mandatory
    - [ ] Cada pregunta debe tener: `question`, `reason` (qué requisito verifica), `is_mandatory` (boolean)
- [ ] Llamar `generateAIResponse(prompt, { responseFormat: 'json', temperature: 0.7, maxTokens: 1500 })`
- [ ] Parsear JSON response: `{ questions: [{question, reason, is_mandatory}] }`
- [ ] Validar estructura (array, máx 5 preguntas, campos requeridos)
- [ ] Guardar preguntas en `ai_questions` (batch insert)
- [ ] Guardar `cv_text` en `candidates`
- [ ] Manejo errores IA: Try/catch → Actualizar BD (`ai_analysis_failed = true`) + retornar error
- [ ] Retornar: `{ success: true, questionsCount: N }` o `{ success: false, error: "..." }`

**Sub-paso 4.3: Integrar en `CVUploadStep.tsx`**
- [ ] Crear función `analyzeCVWithAI(candidateId)` en `candidateService.ts`
- [ ] Modificar `handleContinue()` en CVUploadStep:
  - [ ] Después de `updateCandidateCV()` exitoso
  - [ ] Actualizar loading state: "Analizando tu CV con IA..."
  - [ ] Llamar `await analyzeCVWithAI(candidateId)`
  - [ ] Si error → Mostrar error específico, NO llamar `onContinue()`
  - [ ] Si éxito → Llamar `onContinue()` para avanzar a ai_questions

**Sub-paso 4.4: Probar flujo completo con API real**
- [ ] Subir CV real (PDF o DOCX)
- [ ] Verificar loading "Analizando tu CV con IA..." se muestra
- [ ] Verificar que preguntas generadas son RELEVANTES al CV
- [ ] Verificar preguntas guardadas en `ai_questions` tabla
- [ ] Verificar `cv_text` guardado en `candidates` tabla
- [ ] Probar con diferentes CVs (perfiles técnicos, no técnicos)
- [ ] Validar calidad de preguntas generadas
- [ ] Verificar manejo de errores (CV corrupto, timeout OpenAI)

**Sub-paso 4.5: Validar costos y optimizar**
- [ ] OpenAI Dashboard → Usage → Verificar tokens consumidos
- [ ] Validar costo por candidato ≈ $0.03 USD
- [ ] Si costo > $0.05 → Reducir `maxTokens` o ajustar prompt
- [ ] Agregar logging de tokens en `generateAIResponse()`

**Verificación final:**
- [ ] API key configurada correctamente
- [ ] Endpoint retorna preguntas relevantes al CV
- [ ] Errores parsing/IA se manejan y guardan en BD
- [ ] Frontend muestra errores claros al candidato
- [ ] Costos dentro de lo esperado (~$0.03/análisis)

---

## 🎯 PASO 5: UI Preguntas (IA + Reclutador) ⏳ PENDIENTE

**Objetivo:** Interfaces para responder preguntas IA y preguntas formulario

**DECISIÓN ARQUITECTÓNICA:** 2 steps separados (no combinar)
- **Step 4 (ai_questions):** Preguntas generadas por IA → Usado para scoring → Filtro eliminatorio
- **Step 5 (recruiter_questions):** Preguntas formulario configuradas por reclutador → Solo informativas

**Sub-paso 5.1: AI Questions Step**
- [ ] Crear `/src/candidate/components/AIQuestionsStep.tsx`
- [ ] Crear `/src/shared/services/aiQuestionsService.ts`:
  - [ ] `getAIQuestions(candidateId)` - Fetch desde `ai_questions`
  - [ ] `saveAIAnswers(candidateId, answers)` - POST a `/api/save-ai-answers`
- [ ] UI: Progreso + Card por pregunta + Textarea + Navegación
- [ ] Validación: No avanzar sin responder todas
- [ ] Botón "Finalizar" → Llama a `/api/calculate-scoring`
- [ ] **Manejo scoring:**
  - [ ] Loading: "Calculando compatibilidad..."
  - [ ] Si `approved: false` → Mostrar mensaje rejection + NO continuar
  - [ ] Si `approved: true` → `onContinue()` a recruiter questions

**Sub-paso 5.2: Recruiter Questions Step**
- [ ] Crear `/src/candidate/components/RecruiterQuestionsStep.tsx`
- [ ] Crear `/src/shared/services/recruiterQuestionsService.ts`:
  - [ ] `getRecruiterQuestions(processId)` - Fetch desde `recruiter_questions`
  - [ ] `saveRecruiterAnswers(candidateId, answers)` - POST a `/api/save-recruiter-answers`
- [ ] UI: Similar a AIQuestionsStep
- [ ] Validación: No avanzar sin responder todas
- [ ] Botón "Enviar Postulación" → `onContinue()` a confirmation

**Sub-paso 5.3: Backend endpoints**
- [ ] `/api/save-ai-answers.ts`:
  - [ ] Input: `{ candidateId, answers: [{questionId, answerText}] }`
  - [ ] Update `ai_questions` → `answer_text`, `is_answered = true`
  - [ ] Output: `{ success: true }`
- [ ] `/api/save-recruiter-answers.ts`:
  - [ ] Input: `{ candidateId, answers: [{questionId, answerText}] }`
  - [ ] Insert en `recruiter_answers`
  - [ ] Output: `{ success: true }`

**Sub-paso 5.4: Integrar en CandidateFlow.tsx**
- [ ] Modificar step 'questions' → usar AIQuestionsStep
- [ ] Agregar nuevo step 'recruiter_questions' → usar RecruiterQuestionsStep
- [ ] Actualizar progress indicator (ahora son 6 steps)

**Verificación:**
- [ ] Candidato ve preguntas IA correctamente
- [ ] Respuestas se guardan en BD
- [ ] Scoring se calcula y filtra candidatos rechazados
- [ ] Candidatos aprobados ven preguntas formulario
- [ ] Respuestas formulario se guardan en BD

---

## 🎯 PASO 6: Scoring Backend ⏳ PENDIENTE

**Objetivo:** Calcular scoring con IA y filtrar candidatos rechazados

**IMPORTANTE:** Scoring se ejecuta DESPUÉS de responder ai_questions, ANTES de recruiter_questions

**Sub-paso 6.1: Crear `/api/calculate-scoring.ts`**
- [ ] Input validation: `{ candidateId }` requerido
- [ ] Obtener de BD:
  - [ ] `candidates.cv_text`
  - [ ] `process.mandatory_requirements`
  - [ ] `process.optional_requirements`
  - [ ] `process.custom_prompt` (criterios adicionales del reclutador)
  - [ ] `ai_questions` con `answer_text` (solo is_answered = true)
- [ ] Construir prompt de scoring con priorización:
  - [ ] CV completo
  - [ ] Requisitos indispensables (lista con peso alto)
  - [ ] Requisitos deseables (lista con peso medio)
  - [ ] `custom_prompt` del reclutador (criterios adicionales)
  - [ ] Preguntas + Respuestas del candidato (ponderar según `is_mandatory`)
  - [ ] **Instrucciones de evaluación:**
    - [ ] Evaluar PRIMERO si cumple TODOS los requisitos mandatory (evidencia en CV + respuestas a preguntas `is_mandatory: true`)
    - [ ] Si falta 1+ requisito mandatory → `meetsAllMandatory: false` + `rejectionReason` específico
    - [ ] Si cumple todos mandatory → Calcular `finalScore` (0-100) considerando optional + respuestas
    - [ ] JSON: `meetsAllMandatory`, `mandatoryDetails`, `optionalDetails`, `finalScore`, `recommendation`, `rejectionReason`
- [ ] Llamar `generateAIResponse()` (temperature: 0.3 para consistencia)
- [ ] Parsear JSON response
- [ ] **Si `meetsAllMandatory = false`:**
  - [ ] DELETE FROM candidates WHERE id = candidateId
  - [ ] Retornar: `{ approved: false, reason: "No cumples con: React 3+ años" }`
- [ ] **Si `meetsAllMandatory = true`:**
  - [ ] Guardar `score`, `scoring_details` en candidates
  - [ ] Retornar: `{ approved: true, score: 85, details: {...} }`

**Sub-paso 6.2: Construir prompt de scoring (con priorización)**
- [ ] Formatear requisitos indispensables con descripción y nivel (si existe)
- [ ] Formatear requisitos deseables con descripción
- [ ] Incluir `custom_prompt` del reclutador para criterios adicionales
- [ ] Incluir CV completo
- [ ] Incluir preguntas IA con respuestas, marcando cuáles son `is_mandatory: true`
- [ ] **Instrucciones claras para IA:**
  - [ ] Priorizar verificación de requisitos mandatory primero
  - [ ] Ponderar respuestas a preguntas `is_mandatory: true` con mayor peso
  - [ ] Si falta 1+ requisito mandatory → rechazar automáticamente
  - [ ] JSON con `meetsAllMandatory`, `mandatoryDetails`, `optionalDetails`, `finalScore`, `recommendation`, `rejectionReason`

**Sub-paso 6.3: Implementar lógica de scoring**
- [ ] Llamar `generateAIResponse(prompt, { temperature: 0.3, maxTokens: 2000 })`
- [ ] Parsear JSON response
- [ ] Validar estructura completa
- [ ] Si `meetsAllMandatory = false` → DELETE candidate + retornar reason
- [ ] Si `meetsAllMandatory = true` → Guardar score + details en BD

**Sub-paso 6.4: Probar scoring con casos reales**
- [ ] Candidato que cumple todos los requisitos → debe aprobar
- [ ] Candidato que NO cumple requisito indispensable → debe ser rechazado y eliminado
- [ ] Verificar que scoring refleja cumplimiento de requisitos
- [ ] Validar mensajes de rechazo son específicos y claros

**Verificación:**
- [ ] Candidatos rechazados son eliminados de BD
- [ ] Candidatos aprobados tienen score guardado
- [ ] Frontend recibe mensaje claro de rechazo/aprobación

---

## 🎯 PASO 7: Dashboard Reclutador ⏳ PENDIENTE

**Objetivo:** Mostrar análisis completo de candidatos aprobados

**Sub-paso 7.1: Crear `/api/get-candidate-analysis.ts`**
- [ ] Input: `{ candidateId }`
- [ ] Obtener de BD:
  - [ ] `candidates.cv_text` (texto parseado)
  - [ ] `candidates.score`
  - [ ] `candidates.scoring_details`
  - [ ] `ai_questions` + respuestas
  - [ ] `recruiter_answers`
- [ ] Retornar JSON completo para dashboard

**Sub-paso 7.2: Actualizar `CandidateProfile.tsx`**
- [ ] Layout split screen:
  - [ ] Izquierda: CV parseado (scrolleable, formato texto limpio)
  - [ ] Derecha: Análisis completo
- [ ] Sección "Scoring":
  - [ ] Barra progreso con score 0-100
  - [ ] Badge APPROVED (verde)
- [ ] Sección "Requisitos Cumplidos":
  - [ ] Lista con checkmarks verdes
  - [ ] Evidencia del CV o respuestas
- [ ] Sección "Requisitos Faltantes":
  - [ ] Lista con X rojas (si aplica)
- [ ] Sección "Preguntas IA":
  - [ ] Pregunta + Respuesta + Razón
- [ ] Sección "Preguntas Formulario":
  - [ ] Pregunta + Respuesta

**Verificación:**
- [ ] Reclutador ve perfil completo lado a lado
- [ ] Información clara y organizada
- [ ] CV legible (no PDF embebido)

---

## 📝 DECISIONES ARQUITECTÓNICAS FINALES

### **Sesión de Clarificación - 03/10/2025**
**Objetivo:** Resolver 7 dudas críticas antes de implementar PASO 4

---

### **✅ DECISIÓN 1: Flujo de Scoring y Feedback al Candidato**

**Pregunta:** ¿Cuándo y cómo se muestra el resultado al candidato?

**Respuesta:**
- ❌ **NO** mostrar scoring durante el proceso (Steps 1-5)
- ✅ Scoring se ejecuta **silenciosamente** después de ai_questions (Step 4)
- ✅ Resultado se muestra **UNA SOLA VEZ** en Step 6 (confirmation)
- ✅ **Sin re-acceso**: Candidato no puede volver a ver el resultado

**Flujo confirmado:**
```
Step 4 (ai_questions) → Responde todas → "Continuar"
                              ↓
                POST /api/calculate-scoring (silencioso)
                              ↓
                      ¿Cumple mandatory?
                   ✓                    ✗
                   |                    |
    setApproved(true)           setRejected(true)
    Continue to Step 5          Go to Step 6 (rejected)
                   |                    ↓
    Step 5 (recruiter_qs)      Pantalla rechazo
                   |            "No cumples: React 5+ años"
    Step 6 (confirmation)       + Guard (no escape)
    "Cumples X requisitos"              ↓
    "Atento al contacto"               FIN
```

**Razón de seguridad:** Evitar que candidato salga y reintente con otro email/respuestas diferentes.

**Implementación:** Guard en CandidateFlow que fuerza `currentStep='rejected'` si `rejected=true`.

---

### **✅ DECISIÓN 2: Estructura ai_questions con `is_mandatory`**

**Pregunta:** ¿Guardar `is_mandatory` en BD o recalcular en scoring?

**Respuesta:**
- ✅ **SÍ, guardar `is_mandatory` en BD**
- ✅ IA decide priorización en `/api/analyze-cv` (tiene contexto completo)
- ✅ Scoring usa el flag para ponderar correctamente
- ✅ Reclutador ve en dashboard qué preguntas eran críticas

**Schema confirmado:**
```typescript
interface AIQuestion {
  id: string
  candidate_id: string
  question_text: string
  question_reason?: string
  is_mandatory: boolean  // ← Guardado en BD
  answer_text?: string
  is_answered: boolean
  created_at: string
}
```

**Ventajas:**
- Performance (no re-calcular)
- Consistencia (decisión única en generación)
- Auditoría (visible para reclutador)

---

### **✅ DECISIÓN 3: Custom Prompt del Reclutador**

**Pregunta:** ¿Dónde se configura y dónde se usa?

**Respuesta:**
- ✅ **Ya integrado** en UI: `TextAnalysisMode.tsx` → `CustomPromptBox` (línea 649-652)
- ✅ Se guarda en BD: columna `processes.custom_prompt`
- ✅ **Se usa en AMBOS endpoints:**
  - `/api/analyze-cv`: Influye en generación de preguntas
  - `/api/calculate-scoring`: Influye en evaluación y ponderación

**Ejemplo de uso:**
```
Custom Prompt: "Priorizar candidatos con experiencia en SaaS"

→ /api/analyze-cv:
  Genera pregunta: "¿Has trabajado en empresas SaaS?"

→ /api/calculate-scoring:
  Si menciona SaaS → +peso en scoring final
```

---

### **✅ DECISIÓN 4: Schema ai_questions - Confirmado**

**Pregunta:** ¿Es correcto el schema con ON DELETE CASCADE?

**Respuesta:**
- ✅ Tabla ya existe en Supabase (verificado)
- ✅ `ON DELETE CASCADE` es correcto
- ✅ Schema alineado con TypeScript interface

**Comportamiento CASCADE:**
- Si candidate es eliminado → ai_questions se eliminan automáticamente
- Mantiene integridad referencial
- Útil para rollback de errores

---

### **✅ DECISIÓN 5: CV Upload - Storage Path**

**Pregunta:** ¿Cuál es el path pattern y quién genera el filename?

**Respuesta:**
- ✅ **Path actual:** `{candidateId}-{timestamp}-{cleanFileName}` (flat, sin subcarpetas)
- ✅ Ejemplo: `550e8400-e29b-41d4-a716-446655440000-1733425689012-cv_juan_perez.pdf`
- ✅ Nombre original se conserva (sanitizado)
- ✅ Bucket: `candidate-cvs`

**Decisión:** Mantener estructura actual (simple y funcional para MVP)

**Mejoras V2:** Agregar subcarpetas por proceso para mejor organización

---

### **✅ DECISIÓN 6: Error Handling - Parsing/IA Failures**

**Pregunta:** ¿Qué pasa si falla parsing o análisis IA?

**Respuesta:**
- ✅ **Reintento permitido** en la misma pantalla (CVUploadStep)
- ✅ **SÍ guardar error en BD** (`parsing_failed`, `parsing_error`, `ai_analysis_failed`)
- ❌ **NO aparecen en dashboard** del reclutador (filtrados por defecto)
- ✅ Retornar error al frontend + guardar en BD para tracking

**Flujo de error:**
```
CV Upload → Análisis IA falla
              ↓
    Backend guarda error en BD:
    parsing_failed = true
    parsing_error = "mensaje del error"
              ↓
    Frontend muestra error:
    "No pudimos leer tu CV. Intenta con otro archivo."
              ↓
    Candidato selecciona otro archivo
              ↓
    Reintenta (nueva llamada completa)
              ↓
    Si éxito: parsing_failed = false
```

**Razón para guardar errores:** Tracking y debugging del sistema (analítica de fallos)

**Dashboard:** Reclutador NO ve candidatos con errores (query: `WHERE parsing_failed = false OR parsing_failed IS NULL`)

---

### **✅ DECISIÓN 7: Límite de Candidatos**

**Pregunta:** ¿Los candidatos rechazados cuentan para el límite?

**Respuesta:**
- ✅ **SÍ, cuentan** todos los candidatos con `cv_text IS NOT NULL`
- ✅ Tanto aprobados como rechazados
- ❌ **NO cuentan** candidatos que abandonaron o con error parsing

**Lógica de conteo:**
```typescript
const { count } = await supabase
  .from('candidates')
  .select('*', { count: 'exact', head: true })
  .eq('process_id', processId)
  .not('cv_text', 'is', null);

if (count >= process.candidate_limit) {
  // Auto-cerrar proceso
  await supabase
    .from('processes')
    .update({ status: 'closed' })
    .eq('id', processId);
}
```

**Razón:** El límite representa slots de evaluación IA (cuestan $0.07 cada uno), no solo aprobados.

**Ejemplo:**
```
Proceso límite: 50
  - 25 completed (aprobados)
  - 30 rejected (no cumplían requisitos)
  - 5 registered (abandonaron sin análisis)

Total CONTADOS: 55 (25 + 30)
Estado: CERRADO (55 >= 50)
```

---

### **✅ DECISIÓN EXTRA: Soft Delete (no Hard Delete)**

**Cambio crítico respecto a documentación anterior:**

**Antes (documentado):**
- Hard delete de candidatos rechazados

**AHORA (corregido):**
- ✅ **Soft delete**: Marcar como `status='rejected'` con `rejection_reason`
- ✅ Previene re-intentos infinitos (email/LinkedIn quedan en BD)
- ✅ Permite auditoría y analytics
- ✅ Validación de duplicados ya cubre candidatos rechazados

**Columna agregada:**
```sql
ALTER TABLE candidates
ADD COLUMN rejection_reason TEXT;
```

---

### **✅ DECISIÓN EXTRA: Candidato puede postularse a múltiples procesos**

**Pregunta (adicional):** ¿Un candidato puede aplicar a varios procesos?

**Respuesta:**
- ✅ **SÍ, puede aplicar a diferentes procesos** con mismo email/LinkedIn
- ❌ **NO puede aplicar 2+ veces al MISMO proceso**

**Validación actual:**
```typescript
.eq('process_id', processId)  // ← Filtra por proceso
.eq('email', email)
```

**Ejemplo:**
```
Juan Pérez (juan@email.com):
  ├── Proceso A: "Frontend" → ✅ Permitido
  ├── Proceso B: "Backend"  → ✅ Permitido
  └── Proceso A: Reintento  → ❌ Rechazado (duplicado)
```

**Razón:** Cada proceso evalúa requisitos diferentes, mismo CV puede ajustarse a distintos roles.

---

## 📝 REGISTRO DE SESIONES

### **Sesión 1 - 30/09/2024**
**Objetivo:** Planificación y arquitectura

**Completado:**
- Arquitectura definida (Vercel + Vercel AI SDK + Supabase)
- Diseño BD y flujo técnico
- Plan 6 pasos atómicos
- Documento tracking creado

**Decisiones iniciales:**
- Backend Vercel Serverless (no Supabase Edge Functions)
- GPT-4o-mini ($0.07/candidato)
- Vercel AI SDK (multi-proveedor)
- ~~Hard delete candidatos rechazados~~ ← CORREGIDO en Sesión 3

---

### **Sesión 2 - 01/10/2025 (Parte 1)**
**Objetivo:** Definir arquitectura completa y comenzar PASO 4

**Completado:**
- ✅ Vercel AI SDK instalado (`ai` + `@ai-sdk/openai`)
- ✅ `/api/utils/openai.ts` creado con `generateAIResponse()`
- ✅ Documentación optimizada (888 → 266 líneas)
- ✅ **Decisión crítica:** 2 steps separados (ai_questions + recruiter_questions)
- ✅ **Decisión crítica:** Scoring ANTES de recruiter questions (filtro eliminatorio optimizado)
- ✅ **Decisión crítica:** Desarrollo directo con API real (no mocks)
- ✅ **Decisión crítica:** `/api/analyze-cv` llamado desde CVUploadStep con loading state
- ✅ Flujo técnico completo documentado (6 steps frontend + 4 endpoints backend)
- ✅ Plan de implementación atómico por sub-pasos (5 sub-pasos por paso)
- ✅ **Bug corregido:** `getProcessByUniqueId()` ahora usa `.like()` para soportar diferentes puertos (dev/prod)
- ✅ **Decisión arquitectónica:** Usar `requirements` con campo `required: true/false` (no `mandatory_requirements` separado)
- ✅ **Decisión arquitectónica:** Mantener `form_questions` (JSONB) + tabla `recruiter_questions` (dual, no romper código existente)

**Estructura de requisitos (ACTUALIZADO - Sesión 02/10/2025):**
```json
// Frontend (JobProfile)
{
  mandatoryRequirements: [
    { id: "req-0", title: "React", level: "avanzado", category: "tools", required: true }
  ],
  optionalRequirements: [
    { id: "req-1", title: "Node.js", level: "intermedio", category: "tools", required: false }
  ]
}

// Backend (Process table)
{
  mandatory_requirements: [...],
  optional_requirements: [...]
}
```

**Refactor completado (Sesión 02/10/2025):**
- ✅ Separación arquitectónica completa: frontend + backend + BD
- ✅ 5 commits atómicos mergeados a main
- ✅ Build exitoso + flujo probado sin breaking changes

---

### **Sesión 3 - 03/10/2025**
**Objetivo:** Resolver dudas arquitectónicas críticas antes de implementar PASO 4

**Completado:**
- ✅ **7 dudas críticas resueltas** (scoring, ai_questions, custom_prompt, schema, storage, errores, límite)
- ✅ **3 decisiones adicionales** (soft delete, múltiples procesos, guard rejected)
- ✅ **Documentación actualizada** con todas las decisiones finales
- ✅ **Base de datos confirmada** (tabla ai_questions ya existe en Supabase)
- ✅ **Arquitectura validada** para implementación directa

**Decisiones críticas:**
1. Scoring silencioso → Resultado solo en Step 6 (una vez, sin re-acceso)
2. `is_mandatory` guardado en BD para priorización
3. `custom_prompt` usado en ambos endpoints (analyze-cv + scoring)
4. Schema ai_questions confirmado con ON DELETE CASCADE
5. Storage path: flat structure (candidateId-timestamp-filename)
6. Error handling: Reintento en misma pantalla, NO guardar en BD, NO mostrar en dashboard
7. Límite candidatos: Contar todos con cv_text (aprobados + rechazados)
8. **Soft delete** (no hard delete) para prevenir re-intentos
9. Candidato puede aplicar a múltiples procesos diferentes
10. Guard en frontend para prevenir navegación desde rejected

**Columnas BD actualizadas:**
- ✅ Agregar: `rejection_reason TEXT` a `candidates`
- ✅ Mantener: `parsing_failed`, `parsing_error`, `ai_analysis_failed` (se usan para tracking)

**Próximo (Sesión 4):**
- ✅ Sub-paso 4.0: Usuario obtiene API key OpenAI (COMPLETADO 03/10/2025)
- ✅ Sub-paso 4.1: Configurar `OPENAI_API_KEY` en Vercel (COMPLETADO 03/10/2025)
- ✅ Sub-paso 4.1b: Verificar configuración con `/api/test-openai` (COMPLETADO 03/10/2025)
- ⏳ Sub-paso 4.2: Crear `/api/analyze-cv.ts` con lógica completa (SIGUIENTE)
- ⏳ Sub-paso 4.3: Integrar en `CVUploadStep.tsx` con loading states
- ⏳ Sub-paso 4.4: Probar con CVs reales y validar calidad
- ⏳ Sub-paso 4.5: Validar costos (~$0.002/análisis con gpt-4o-mini) y optimizar si necesario

---

### **Sesión 4 - 03/10/2025**
**Objetivo:** Configurar OpenAI API y comenzar implementación análisis CV

**Completado:**
- ✅ **Revisión completa código vs documentación** (7 decisiones arquitectónicas validadas)
- ✅ **Corrección documentación DECISIÓN 6:** Sí guardar errores parsing/IA en BD para tracking
- ✅ **Columna `rejection_reason` agregada** a tabla `candidates` en Supabase (soft delete)
- ✅ **API key OpenAI obtenida** y créditos recargados
- ✅ **Variable `OPENAI_API_KEY` configurada** en Vercel (Production + Preview + Development)
- ✅ **Endpoint `/api/test-openai` creado** para verificación
- ✅ **Verificación exitosa:** OpenAI funcionando con gpt-4o-mini
  - Modelo: `gpt-4o-mini-2024-07-18`
  - Test: 27 tokens (21 input + 6 output)
  - Costo: ~$0.000005 USD
  - Latencia: 1.3 segundos
  - Rate limits: 10,000 req/min, 200K tokens/min

**Decisiones técnicas:**
- **Modelo confirmado:** `gpt-4o-mini` (mejor balance calidad/precio vs gpt-5-nano)
- **Costo estimado real:** $0.002 por candidato (no $0.07 como estimación anterior)
- **Structured outputs:** Habilitado (JSON garantizado)
- **Timeout:** 30 segundos por request

**Próximo:**
- Sub-paso 4.2: Implementar `/api/analyze-cv.ts` completo (parsing + IA + generación preguntas)

---

### **Sesión 2 - 02/10/2025 (Parte 2)**
**Objetivo:** Mejorar UX de requisitos y optimizar análisis IA

**Completado:**
- ✅ **Niveles explícitos con experiencia:**
  - Actualizado mapeo: básico (0-2 años), intermedio (2-4 años), avanzado (5+ años)
  - Display en UI: Solo nombre en selector, detalle completo en dropdown
  - BD: Guarda texto completo para claridad en prompts IA
  - Aplicado a todas las categorías (herramientas, técnicas, habilidades)

- ✅ **Optimización de sinónimos:**
  - Eliminado botón "Sugerir similares con IA" (innecesario con GPT-4o-mini)
  - Agregado tooltip informativo: "La IA ya reconoce variaciones y sinónimos automáticamente"
  - Panel de sinónimos conservado como mock (UX/confianza del reclutador)
  - Decisión: No procesar sinónimos en análisis real (ahorro ~$0.00002/candidato)

- ✅ **Decisión descartada:**
  - Diccionario de ~200 tecnologías creado y eliminado (causaba loop infinito)
  - Conservado sistema de keywords hardcoded (funciona correctamente)
  - Prioridad: estabilidad sobre expansión prematura

**Decisiones técnicas documentadas:**
- Mapeo de niveles a años = más objetivo y medible para IA
- GPT-4o-mini reconoce sinónimos nativamente (React = ReactJS = React.js)
- Extracción de requisitos: Regex + keywords (0 costo, 70% calidad suficiente para MVP)

**Próximo:**
- Continuar PASO 4 con configuración OpenAI API key

---

## 🔧 Variables de Entorno

```env
# Vercel dashboard → Settings → Environment Variables
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## ✅ Checklist Final (Antes de producción)

- [ ] 6 pasos completados y verificados
- [ ] Tests manuales flujo candidato completo
- [ ] Tests manuales dashboard reclutador
- [ ] Rate limiting implementado
- [ ] Manejo errores robusto
- [ ] Logs configurados
- [ ] Documentación actualizada DEVELOPMENT.md
- [ ] Monitoreo costos OpenAI

---

**Responsables:** [Tu nombre] + Claude
**Estado:** 🟢 En desarrollo - PASO 4 en progreso
