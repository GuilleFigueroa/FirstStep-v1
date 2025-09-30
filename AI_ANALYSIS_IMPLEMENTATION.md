# FirstStep - Implementación de Análisis de CV con IA

## 📋 Información General

**Objetivo:** Implementar la funcionalidad principal de FirstStep - análisis automático de CVs con IA y generación de preguntas personalizadas para candidatos.

**Fecha de inicio:** 30-09-2024

**Estado actual:** Planificación y diseño de arquitectura

---

## 🏗️ ARQUITECTURA PROPUESTA

### **Stack Completo:**
```
FRONTEND (Vercel)
├── React + TypeScript + Vite
├── Dominio custom apuntando a Vercel (configurar después)
└── Deploy automático desde GitHub

BACKEND (Vercel Serverless Functions)
├── API Routes en /api/*
├── Node.js + TypeScript
├── Librerías: pdf-parse, openai, @supabase/supabase-js
└── Variables de entorno (API keys)

BASE DE DATOS (Supabase)
├── PostgreSQL (datos estructurados)
├── Storage (CVs originales)
└── Auth (usuarios reclutadores)
```

### **Ventajas de esta arquitectura:**
- ✅ Backend y frontend en mismo repo → deploys sincronizados
- ✅ Vercel Free tier: 100GB bandwidth, serverless functions incluidas
- ✅ Separación de responsabilidades: Supabase = datos, Backend = lógica de negocio
- ✅ Escalabilidad: Si creces, Vercel escala automáticamente
- ✅ Seguridad: API keys en backend, nunca expuestas en frontend

---

## 📋 ESTRUCTURA DE CARPETAS PROPUESTA

```
FirstStep-v1/
├── src/                          # Frontend (actual)
│   ├── app/
│   ├── candidate/
│   ├── recruiter/
│   └── shared/
│
├── api/                          # Backend (NUEVO)
│   ├── analyze-cv.ts            # POST: Analiza CV y genera preguntas
│   ├── get-cv-text.ts           # GET: Obtiene texto parseado del CV
│   ├── save-answers.ts          # POST: Guarda respuestas del candidato
│   ├── calculate-scoring.ts     # POST: Calcula scoring final
│   └── utils/
│       ├── openai.ts            # Cliente OpenAI configurado
│       ├── pdfParser.ts         # Extractor de texto PDF/Word
│       └── supabase.ts          # Cliente Supabase para backend
│
├── vercel.json                  # Config Vercel (NUEVO)
└── package.json
```

---

## 🗄️ CAMBIOS EN BASE DE DATOS (Supabase)

### **Nueva tabla: `ai_questions`**
```sql
CREATE TABLE ai_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_reason TEXT, -- Por qué la IA hizo esta pregunta
  is_eliminatory BOOLEAN DEFAULT false, -- Si es criterio eliminatorio
  answer_text TEXT, -- Respuesta del candidato
  is_answered BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Modificar tabla: `candidates`**
```sql
ALTER TABLE candidates
ADD COLUMN cv_text TEXT, -- Texto extraído del CV
ADD COLUMN cv_analysis JSONB, -- Análisis estructurado de la IA
ADD COLUMN scoring INTEGER, -- Puntaje final (0-100)
ADD COLUMN scoring_details JSONB, -- Desglose del scoring
ADD COLUMN parsing_failed BOOLEAN DEFAULT false, -- Flag: parsing falló
ADD COLUMN parsing_error TEXT, -- Mensaje de error del parsing
ADD COLUMN ai_analysis_failed BOOLEAN DEFAULT false; -- Flag: análisis IA falló
```

---

## 🔄 FLUJO TÉCNICO COMPLETO

### **1. Candidato sube CV** (ya funciona)
```
Frontend → Supabase Storage → candidates.cv_url guardado ✅
```

### **2. Análisis automático del CV** (NUEVO)
```
Frontend (CVUploadStep)
  ↓ onClick "Continuar"
  ↓
POST /api/analyze-cv { candidateId, processId }
  ↓
Backend (Vercel Function):
  1. Descarga CV desde Supabase Storage
  2. Extrae texto con pdf-parse
  3. Guarda cv_text en candidates
  4. Obtiene requisitos del proceso desde BD
  5. Construye prompt para OpenAI:
     - CV extraído
     - Requisitos (obligatorios/opcionales)
     - Prompt personalizado del reclutador
     - Sinónimos configurados
  6. Llama OpenAI GPT-4o-mini
  7. Recibe JSON con preguntas:
     [
       {
         question: "Vi que mencionas React. ¿Cuántos años de experiencia específica tienes?",
         reason: "Requisito obligatorio: React 3+ años - CV no especifica",
         eliminatory: true
       },
       ...máximo 5 preguntas
     ]
  8. Guarda preguntas en ai_questions
  9. Retorna success + número de preguntas
  ↓
Frontend: Avanza a QuestionsStep
```

### **3. Candidato responde preguntas**
```
Frontend (QuestionsStep)
  ↓ muestra preguntas de ai_questions
  ↓ candidato responde
  ↓
POST /api/save-answers { candidateId, answers: [{questionId, answer}] }
  ↓
Backend: Guarda respuestas en ai_questions
  ↓
POST /api/calculate-scoring { candidateId }
  ↓
Backend:
  1. Analiza CV + respuestas vs requisitos
  2. Calcula scoring:
     - Requisitos obligatorios cumplidos: 70%
     - Requisitos opcionales cumplidos: 30%
  3. Detecta criterios eliminatorios
  4. Guarda scoring en candidates
  5. Retorna resultado
  ↓
Frontend: Muestra resultado final al candidato
```

### **4. Reclutador revisa candidato**
```
Frontend (CandidateProfile)
  ↓
GET /api/get-cv-text { candidateId }
  ↓
Backend: Retorna cv_text parseado
  ↓
Frontend:
  ├── Lado izquierdo: CV en texto parseado (scrolleable)
  └── Lado derecho:
      ├── Scoring (barra de progreso)
      ├── Requisitos cumplidos/faltantes
      ├── Preguntas IA + respuestas
      └── Preguntas formulario + respuestas
```

---

## 💰 ESTIMACIÓN DE COSTOS (primeros clientes)

### **Vercel Free Tier:**
- ✅ 100GB bandwidth/mes
- ✅ 100GB-hours serverless compute
- ✅ 1000 invocaciones function/día
- **Suficiente para ~500-1000 candidatos/mes**

### **OpenAI GPT-4o-mini:**
- $0.15/$0.60 por 1M tokens (input/output)
- ~3000 tokens por análisis (CV + requisitos + respuestas)
- **$0.03 USD por candidato**
- 100 candidatos = $3 USD/mes

### **Supabase Free Tier:**
- ✅ 500MB base de datos
- ✅ 1GB storage
- ✅ 50,000 usuarios activos
- **Suficiente para primeros meses**

**Total primeros meses: ~$0-10 USD/mes** (hasta escalar)

---

## 🎯 PLAN DE IMPLEMENTACIÓN (6 PASOS ATÓMICOS)

### **PASO 1: Setup backend en Vercel** ⏳ PENDIENTE
**Tiempo estimado:** 30 minutos
**Objetivo:** Configurar infraestructura backend básica

**Tareas:**
- [ ] Crear carpeta `/api` en root del proyecto
- [ ] Crear `vercel.json` con configuración de serverless functions
- [ ] Crear `/api/health.ts` (Hello World endpoint)
- [ ] Configurar variables de entorno en Vercel dashboard
- [ ] Deploy inicial en Vercel
- [ ] Probar endpoint `GET /api/health`

**Verificación:** `curl https://[tu-app].vercel.app/api/health` retorna `{ status: "ok" }`

---

### **PASO 2: Modificar Base de Datos** ⏳ PENDIENTE
**Tiempo estimado:** 30 minutos
**Objetivo:** Preparar estructura de datos para flujo completo de análisis IA

**⚠️ IMPORTANTE:** Este paso debe ejecutarse ANTES del parser porque las columnas creadas aquí son necesarias para guardar datos en pasos posteriores.

---

#### **📊 CONTEXTO DE DECISIONES DE ARQUITECTURA:**

**Flujo completo de IA (2 llamadas):**
1. **LLAMADA 1** - Análisis CV + Generación de preguntas
   - Input: CV parseado + Requisitos (indispensables/deseables) + Prompt personalizado
   - Output: `cv_analysis` (JSONB) + Lista de preguntas en `ai_questions`
2. **LLAMADA 2** - Scoring final (después de que candidato responda)
   - Input: CV + Requisitos + Preguntas + Respuestas
   - Output: `scoring` (0-100) + `scoring_details` (JSONB)
   - Validación: Si no cumple requisitos indispensables → Eliminar candidato de BD

**Tipos de requisitos:**
- **Indispensables** (`required: true`): Filtro eliminatorio
- **Deseables** (`required: false`): Suman al scoring pero no eliminan

**Tipos de preguntas:**
- **Preguntas IA** (`ai_questions`): Generadas dinámicamente, usadas para scoring
- **Preguntas formulario** (`recruiter_questions`): Configuradas por reclutador, solo informativas

**Manejo de candidatos rechazados:**
- Candidato responde TODAS las preguntas (IA + formulario)
- Al final, si no cumple requisitos indispensables → Se elimina de BD (hard delete)
- Mensaje transparente: "No cumpliste con: React 3+ años (respondiste: 1 año)"

---

#### **🗄️ CAMBIOS EN BASE DE DATOS:**

**Sub-paso 2.1: Modificar tabla `processes`**
```sql
-- Separar requisitos por tipo (indispensables vs deseables)
ALTER TABLE processes
ADD COLUMN mandatory_requirements JSONB,
ADD COLUMN optional_requirements JSONB;
```

Estructura de requisitos:
```json
{
  "id": "uuid",
  "title": "React 3+ años",
  "category": "technical",
  "level": "avanzado",
  "years": 3,
  "synonyms": ["ReactJS", "React.js"]
}
```

---

**Sub-paso 2.2: Modificar tabla `candidates`**
```sql
-- Columnas para análisis IA
ALTER TABLE candidates
ADD COLUMN cv_analysis JSONB,
ADD COLUMN scoring_details JSONB;

-- Columnas de fallback (resiliencia)
ALTER TABLE candidates
ADD COLUMN parsing_failed BOOLEAN DEFAULT false,
ADD COLUMN parsing_error TEXT,
ADD COLUMN ai_analysis_failed BOOLEAN DEFAULT false;
```

**Nota:** `cv_text`, `score`, `status` YA EXISTEN en la tabla ✅

---

**Sub-paso 2.3: Crear tabla `ai_questions`**
```sql
CREATE TABLE ai_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_reason TEXT,
  is_mandatory BOOLEAN DEFAULT false,
  answer_text TEXT,
  is_answered BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_questions_candidate ON ai_questions(candidate_id);
```

---

**Sub-paso 2.4: Crear tabla `recruiter_questions`**
```sql
CREATE TABLE recruiter_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recruiter_questions_process ON recruiter_questions(process_id);
```

---

**Sub-paso 2.5: Crear tabla `recruiter_answers`**
```sql
CREATE TABLE recruiter_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  question_id UUID REFERENCES recruiter_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recruiter_answers_candidate ON recruiter_answers(candidate_id);
```

---

#### **✅ CHECKLIST DE TAREAS:**

**Ejecución en Supabase:**
- [ ] Ejecutar SQL para modificar tabla `processes`
- [ ] Ejecutar SQL para modificar tabla `candidates`
- [ ] Ejecutar SQL para crear tabla `ai_questions`
- [ ] Ejecutar SQL para crear tabla `recruiter_questions`
- [ ] Ejecutar SQL para crear tabla `recruiter_answers`

**Verificación:**
- [ ] Todas las tablas visibles en Supabase dashboard
- [ ] Todas las columnas creadas correctamente
- [ ] Índices creados para optimizar queries

**Actualización de código:**
- [ ] Actualizar tipos TypeScript en `supabase.ts`
- [ ] Agregar interfaces para nuevas tablas

---

**Verificación final:**
- ✅ SQL ejecutado sin errores
- ✅ 3 tablas nuevas creadas
- ✅ 7 columnas agregadas (5 en `candidates`, 2 en `processes`)

---

### **PASO 3: Parser de PDF** ⏳ PENDIENTE
**Tiempo estimado:** 1 hora
**Objetivo:** Extraer texto de CVs en PDF/Word

**Prerequisitos:** PASO 2 completado (columnas en BD creadas)

**Formatos soportados:**
- ✅ PDF (.pdf) - Librería `pdf-parse`
- ✅ Word (.docx) - Librería `mammoth`
- ❌ Word antiguo (.doc) - No soportado
- ❌ Imágenes (JPG/PNG) - Requiere OCR, fuera de scope inicial

**Tareas:**
- [ ] Instalar dependencias: `pdf-parse`, `mammoth`
- [ ] Crear `/api/utils/pdfParser.ts`
- [ ] Crear `/api/utils/supabase.ts` (cliente backend)
- [ ] Crear `/api/test-parser.ts` endpoint de prueba
- [ ] Implementar descarga de CV desde Supabase Storage
- [ ] Implementar extracción de texto PDF
- [ ] Implementar extracción de texto Word (.docx)
- [ ] Implementar manejo de errores y fallbacks:
  - [ ] Detectar CV vacío o ilegible (< 50 caracteres)
  - [ ] Marcar `parsing_failed = true` en BD
  - [ ] Guardar error en `parsing_error`
  - [ ] Retornar flag `needsManualReview`
- [ ] Probar con CV real de cada formato
- [ ] Probar con CV corrupto para validar fallback

**Verificación:**
- ✅ `POST /api/test-parser { cvUrl }` retorna texto extraído correctamente
- ✅ CV corrupto activa fallback sin romper flujo

---

### **PASO 4: Integración OpenAI** ⏳ PENDIENTE
**Tiempo estimado:** 1 hora
**Objetivo:** Conectar con OpenAI para análisis de CV

**Prerequisitos:**
- API key de OpenAI configurada
- PASO 3 completado (parser funcional)

**Tareas:**
- [ ] Instalar `openai` SDK
- [ ] Crear `/api/utils/openai.ts` (cliente configurado)
- [ ] Crear `/api/analyze-cv.ts` endpoint principal
- [ ] Implementar construcción de prompt:
  - [ ] Formatear requisitos del reclutador
  - [ ] Incluir sinónimos configurados
  - [ ] Incluir prompt personalizado
  - [ ] Agregar CV extraído
- [ ] Llamar a OpenAI GPT-4o-mini con timeout (30s)
- [ ] Parsear respuesta JSON con preguntas
- [ ] Validar formato de respuesta
- [ ] Implementar fallback si análisis IA falla:
  - [ ] Crear preguntas genéricas por defecto
  - [ ] Marcar `ai_analysis_failed = true` en BD
  - [ ] Permitir al candidato continuar con preguntas genéricas
- [ ] Guardar preguntas en tabla `ai_questions`
- [ ] Guardar `cv_text` en tabla `candidates`
- [ ] Probar con candidato real
- [ ] Probar con timeout simulado para validar fallback

**Verificación:**
- ✅ Análisis genera 3-5 preguntas relevantes guardadas en BD
- ✅ Fallback funciona si OpenAI falla o timeout

---

### **PASO 5: UI QuestionsStep básica** ⏳ PENDIENTE
**Tiempo estimado:** 1 hora
**Objetivo:** Interfaz para que candidato responda preguntas de IA

**Tareas:**
- [ ] Crear `/src/candidate/components/QuestionsStep.tsx`
- [ ] Crear servicio `/src/shared/services/questionsService.ts`
- [ ] Implementar `getQuestions(candidateId)` → fetch de BD
- [ ] Diseño UI básico:
  - [ ] Header con progreso (pregunta X de Y)
  - [ ] Card con pregunta actual
  - [ ] Textarea para respuesta
  - [ ] Botones: Anterior / Siguiente / Finalizar
- [ ] Validación: no permitir siguiente sin responder
- [ ] Crear `/api/save-answers.ts` endpoint
- [ ] Implementar guardado de respuestas
- [ ] Integrar en `CandidateFlow.tsx`
- [ ] Actualizar step 'questions' para usar componente real

**Verificación:** Candidato puede responder preguntas y respuestas se guardan en BD

---

### **PASO 6: Scoring y resultado** ⏳ PENDIENTE
**Tiempo estimado:** 1.5 horas
**Objetivo:** Calcular scoring y mostrar resultado al candidato y reclutador

**Tareas Backend:**
- [ ] Crear `/api/calculate-scoring.ts` endpoint
- [ ] Implementar lógica de scoring:
  - [ ] Análisis de requisitos obligatorios (70% peso)
  - [ ] Análisis de requisitos opcionales (30% peso)
  - [ ] Detección de criterios eliminatorios
- [ ] Guardar scoring en tabla `candidates`
- [ ] Guardar desglose en `scoring_details`

**Tareas Frontend - Candidato:**
- [ ] Crear `/src/candidate/components/ResultStep.tsx`
- [ ] Mostrar scoring visual (barra de progreso)
- [ ] Mostrar requisitos cumplidos/faltantes
- [ ] Textarea para comentario opcional
- [ ] Botón "Enviar postulación"
- [ ] Mensaje de confirmación final

**Tareas Frontend - Reclutador:**
- [ ] Crear `/api/get-cv-text.ts` endpoint
- [ ] Actualizar `CandidateProfile.tsx` con layout split:
  - [ ] Panel izquierdo: CV en texto parseado (scrolleable)
  - [ ] Panel derecho: Info del candidato
    - [ ] Scoring con barra de progreso
    - [ ] Requisitos cumplidos (checkmarks verdes)
    - [ ] Requisitos faltantes (X rojas)
    - [ ] Sección "Preguntas IA" con respuestas
    - [ ] Sección "Preguntas Formulario" con respuestas
    - [ ] Comentario del candidato (si existe)

**Verificación:**
- Candidato ve resultado completo y puede enviar postulación
- Reclutador ve perfil completo con CV y análisis lado a lado

---

## 📝 REGISTRO DE SESIONES

### **Sesión 1 - 30/09/2024**
**Duración:** [Por completar]
**Objetivo:** Planificación y diseño de arquitectura

**Actividades:**
- ✅ Definición de arquitectura (Vercel + Backend serverless)
- ✅ Diseño de flujo técnico completo
- ✅ Selección de OpenAI GPT-4o-mini como modelo
- ✅ Diseño de estructura de base de datos
- ✅ Creación de plan de implementación en 6 pasos
- ✅ Creación de este documento de tracking

**Decisiones tomadas:**
- Backend en Vercel Serverless Functions (no Supabase Edge Functions)
- OpenAI GPT-4o-mini para análisis de CV
- Guardar `cv_text` en BD para no reprocesar
- Layout split screen en dashboard reclutador (CV izquierda, info derecha)

**Próximos pasos:**
- Pendiente: Decidir si empezar con PASO 1 (setup backend) o esperar API key OpenAI
- Pendiente: Configurar dominio en Vercel (después)

**Notas:**
- Cuenta Vercel: ✅ Existe
- Repo GitHub: ✅ Existe
- API key OpenAI: ⏳ Pendiente de obtener
- Dominio: ⏳ Configurar después

---

### **Sesión 2 - [Fecha]**
**Duración:** [Por completar]
**Objetivo:** [Por completar]

**Actividades:**
- [ ] [Por completar]

**Decisiones tomadas:**
- [Por completar]

**Próximos pasos:**
- [Por completar]

**Notas:**
- [Por completar]

---

## 🚨 CONSIDERACIONES IMPORTANTES

### **Seguridad:**
- ✅ API keys NUNCA en frontend, solo en variables de entorno Vercel
- ✅ Validación de `candidateId` y `processId` en backend
- ✅ Rate limiting en endpoints de IA (prevenir abuso)
- ⏳ Sanitizar texto extraído de CVs antes de enviar a OpenAI

### **Performance:**
- ✅ Análisis de CV asíncrono (no bloquear UI)
- ✅ Mostrar loading states claros
- ⏳ Cache de `cv_text` para no reprocesar
- ✅ Timeout de 30s en llamadas OpenAI

### **UX:**
- ✅ Mensajes de error claros y amigables
- ✅ Indicadores de progreso en análisis de CV
- ⏳ Permitir volver a pasos anteriores (dentro de límites)
- ⏳ Confirmación antes de enviar postulación final

### **Resiliencia y Fallbacks:**
- ✅ Parsing fallido no bloquea candidato (flag `parsing_failed`)
- ✅ Análisis IA fallido usa preguntas genéricas (flag `ai_analysis_failed`)
- ✅ Timeout de 30s en OpenAI con fallback automático
- ✅ CV ilegible/vacío detectado y marcado para revisión manual
- ⏳ Dashboard reclutador muestra candidatos que necesitan revisión manual

### **Escalabilidad:**
- ✅ Vercel serverless escala automáticamente
- ⏳ Considerar queue system si volumen crece (BullMQ + Redis)
- ⏳ Monitoreo de costos OpenAI (alertas)

---

## 📚 RECURSOS Y REFERENCIAS

### **Documentación Técnica:**
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [pdf-parse npm](https://www.npmjs.com/package/pdf-parse)
- [mammoth.js (Word parsing)](https://www.npmjs.com/package/mammoth)

### **Librerías a instalar:**
```bash
# Backend dependencies
npm install openai pdf-parse mammoth @supabase/supabase-js

# Dev dependencies
npm install -D @types/pdf-parse
```

### **Variables de entorno necesarias:**
```env
# Vercel dashboard → Settings → Environment Variables
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (NO la anon key, necesitamos service role)
```

---

## ✅ CHECKLIST FINAL (Antes de producción)

- [ ] Todos los 6 pasos completados y verificados
- [ ] Tests manuales de flujo completo candidato
- [ ] Tests manuales de dashboard reclutador
- [ ] Variables de entorno configuradas en Vercel
- [ ] Rate limiting implementado
- [ ] Manejo de errores robusto
- [ ] Logs configurados para debugging
- [ ] Documentación actualizada en DEVELOPMENT.md
- [ ] Dominio custom configurado
- [ ] Monitoreo de costos OpenAI activo

---

**Última actualización:** 30-09-2024
**Responsables:** [Tu nombre] + Claude (cofounder técnico)
**Estado general:** 🟡 En planificación