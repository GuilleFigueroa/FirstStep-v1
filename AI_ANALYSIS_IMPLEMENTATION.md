# FirstStep - Implementación de Análisis de CV con IA

## 📊 Estado General

**Progreso:** 3/6 pasos completados (50%)
**Fecha inicio:** 30-09-2024
**Última actualización:** 01-10-2025

| Paso | Estado | Descripción |
|------|--------|-------------|
| 1 | ✅ | Backend Vercel configurado |
| 2 | ✅ | Base de datos modificada |
| 3 | ✅ | Parser PDF/DOCX funcional |
| 4 | ⏳ | Integración OpenAI (EN PROGRESO) |
| 5 | ⏳ | UI QuestionsStep |
| 6 | ⏳ | Scoring y resultado |

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

## 🔄 Flujo Simplificado

```
1. Candidato sube CV
   → Supabase Storage + BD

2. POST /api/analyze-cv
   → Parsear CV (pdf-parse/mammoth)
   → Obtener requisitos de BD
   → Llamada IA #1: Generar 3-5 preguntas
   → Guardar en ai_questions

3. Candidato responde preguntas
   → POST /api/save-answers

4. POST /api/calculate-scoring
   → Llamada IA #2: Analizar CV + respuestas
   → Calcular score 0-100
   → APPROVED o REJECTED (hard delete si no cumple requisitos indispensables)

5. Reclutador ve perfil
   → CV parseado + score + preguntas + respuestas
```

**Costos IA por candidato:**
- Análisis: ~$0.03 (2000-3000 tokens)
- Scoring: ~$0.04 (3000-4000 tokens)
- **Total: $0.07 USD**

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
- [x] Modificar tabla `processes` (2 columnas)
- [x] Modificar tabla `candidates` (5 columnas)
- [x] Crear tabla `ai_questions`
- [x] Crear tabla `recruiter_questions`
- [x] Crear tabla `recruiter_answers`
- [x] Índices creados
- [x] Tipos TypeScript actualizados en `supabase.ts`

**Verificación:** ✅ 3 tablas creadas, 7 columnas agregadas, SQL sin errores

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
- ⏳ API key OpenAI configurada

**Decisión arquitectónica:** Vercel AI SDK (no SDK directo)

**Tareas:**
- [x] Instalar Vercel AI SDK (`ai` + `@ai-sdk/openai`)
- [x] Crear `/api/utils/openai.ts` con helper `generateAIResponse()`
- [ ] Crear `/api/analyze-cv.ts` endpoint principal
- [ ] Implementar construcción de prompt (requisitos + CV + custom prompt)
- [ ] Llamar IA: `generateAIResponse(prompt, { responseFormat: 'json' })`
- [ ] Parsear y validar JSON respuesta
- [ ] Guardar preguntas en `ai_questions`
- [ ] Guardar `cv_text` en `candidates`
- [ ] Manejo errores: parsing + OpenAI timeout/fallo
- [ ] Probar con candidato real
- [ ] Probar errores (timeout, API key inválida, parsing fallido)

**Verificación:**
- [ ] Genera 3-5 preguntas relevantes
- [ ] Preguntas guardadas en BD
- [ ] Errores guardados en BD (`ai_analysis_failed`, `parsing_failed`)

---

## 🎯 PASO 5: UI QuestionsStep ⏳ PENDIENTE

**Objetivo:** Interfaz para responder preguntas IA

**Tareas:**
- [ ] `/src/candidate/components/QuestionsStep.tsx`
- [ ] `/src/shared/services/questionsService.ts`
- [ ] UI: Header progreso + Card pregunta + Textarea + Botones
- [ ] Validación: no avanzar sin responder
- [ ] `/api/save-answers.ts` endpoint
- [ ] Integrar en `CandidateFlow.tsx`

**Verificación:** Candidato responde y respuestas se guardan en BD

---

## 🎯 PASO 6: Scoring y Resultado ⏳ PENDIENTE

**Objetivo:** Calcular scoring y mostrar resultado

**Tareas Backend:**
- [ ] `/api/calculate-scoring.ts` endpoint
- [ ] Lógica scoring: requisitos obligatorios (70%) + opcionales (30%)
- [ ] Detección criterios eliminatorios
- [ ] Guardar en `candidates.score` y `scoring_details`
- [ ] Hard delete si REJECTED

**Tareas Frontend - Candidato:**
- [ ] `/src/candidate/components/ResultStep.tsx`
- [ ] Mostrar score + requisitos cumplidos/faltantes
- [ ] Botón "Enviar postulación"

**Tareas Frontend - Reclutador:**
- [ ] `/api/get-cv-text.ts` endpoint
- [ ] Layout split: CV parseado (izq) + Análisis (der)
- [ ] Scoring visual + preguntas IA + preguntas formulario

**Verificación:** Flujo completo funcional end-to-end

---

## 📝 REGISTRO DE SESIONES

### **Sesión 1 - 30/09/2024**
**Objetivo:** Planificación y arquitectura

**Completado:**
- Arquitectura definida (Vercel + Vercel AI SDK + Supabase)
- Diseño BD y flujo técnico
- Plan 6 pasos atómicos
- Documento tracking creado

**Decisiones:**
- Backend Vercel Serverless (no Supabase Edge Functions)
- GPT-4o-mini ($0.07/candidato)
- Vercel AI SDK (multi-proveedor)
- Hard delete candidatos rechazados

---

### **Sesión 2 - 01/10/2025**
**Objetivo:** Completar PASO 4

**En progreso:**
- Vercel AI SDK instalado
- `/api/utils/openai.ts` creado con `generateAIResponse()`
- Documentación limpiada (888 → ~300 líneas)
- Próximo: Implementar `/api/analyze-cv.ts`

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
