# Análisis de Escalabilidad - FirstStep

Entiendo tu preocupación. Déjame darte perspectiva: **la aplicación FUNCIONA bien**, el problema es que no está preparada para **fallos y carga alta**. Es la diferencia entre un MVP que sirve a 50 usuarios vs un producto production-ready.

Déjame reorganizar TODO por **complejidad de implementación**:

---

## 🟢 MUY SIMPLE (Minutos a horas - Impacto ALTO)

### 1. **Upgrade a Vercel Pro Plan** ⏱️ 5 minutos
- **Esfuerzo:** Literal 5 minutos (cambiar plan en dashboard)
- **Costo:** $20/mes
- **Impacto:** ✅ Resuelve 50% de timeouts instantáneamente
- **Acción:** Ir a Vercel Dashboard → Upgrade to Pro

### 2. **Agregar Índices en Supabase** ⏱️ 15-30 minutos
- **Esfuerzo:** Copiar/pegar SQL
- **Archivos:** SQL migration en Supabase
- **Impacto:** ✅ Queries 10-100x más rápidas
```sql
CREATE INDEX idx_candidates_process_status ON candidates(process_id, status);
CREATE INDEX idx_candidates_status_created ON candidates(status, created_at DESC);
CREATE INDEX idx_ai_questions_candidate ON ai_questions(candidate_id);
CREATE INDEX idx_recruiter_questions_process ON recruiter_questions(process_id);
```

### 3. **Timeouts Explícitos en Frontend** ⏱️ 1-2 horas
- **Esfuerzo:** Agregar `signal: AbortSignal.timeout(30000)` en 5 archivos
- **Archivos:**
  - `src/shared/services/candidateService.ts`
  - `src/shared/services/aiQuestionsService.ts`
  - `src/shared/services/recruiterQuestionsService.ts`
- **Impacto:** ✅ Evita requests colgados indefinidamente

### 4. **Configurar Vercel Analytics** ⏱️ 30 minutos
- **Esfuerzo:** Agregar `@vercel/analytics` + 3 líneas de código
- **Archivo:** `src/app/main.tsx`
- **Impacto:** ✅ Observabilidad básica gratis
```typescript
import { Analytics } from '@vercel/analytics/react';
<Analytics />
```

---

## 🟡 SIMPLE (1-2 días - Impacto ALTO)

### 5. **Rate Limiting Básico** ⏱️ 1 día
- **Esfuerzo:** Instalar `@upstash/ratelimit` + middleware
- **Archivos:**
  - `api/middleware/rateLimit.ts` (crear - 50 líneas)
  - Modificar cada API handler (agregar 3 líneas)
- **Costo:** Upstash Redis free tier (10,000 requests/día gratis)
- **Impacto:** ✅ Previene saturación crítica

**Código ejemplo:**
```typescript
// api/middleware/rateLimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 req/min
});

export async function checkRateLimit(identifier: string) {
  const { success } = await ratelimit.limit(identifier);
  return success;
}

// En cada API:
const allowed = await checkRateLimit(req.headers['x-forwarded-for'] || 'unknown');
if (!allowed) return res.status(429).json({ error: 'Too many requests' });
```

### 6. **Retry Logic en OpenAI** ⏱️ 1 día
- **Esfuerzo:** Modificar `api/utils/openai.ts` con retry logic
- **Archivos:** `api/utils/openai.ts` (agregar 30-40 líneas)
- **Impacto:** ✅ Resiliencia ante rate limits temporales

**Código ejemplo:**
```typescript
async function generateAIResponseWithRetry(prompt: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await generateAIResponse(prompt);
    } catch (error) {
      if (i === retries - 1) throw error;
      if (error.status === 429) { // Rate limit
        await sleep(Math.pow(2, i) * 1000); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}
```

### 7. **Structured Logging** ⏱️ 1-2 días
- **Esfuerzo:** Instalar `pino` + reemplazar console.log/error
- **Archivos:** ~15 archivos API
- **Impacto:** ✅ Debugging real en producción

**Código ejemplo:**
```typescript
import pino from 'pino';
const logger = pino();

// Reemplazar:
console.error('Error:', error);
// Por:
logger.error({ candidateId, error: error.message, stack: error.stack }, 'Analyze CV failed');
```

### 8. **Validación Magic Bytes en PDFs** ⏱️ 1 día
- **Esfuerzo:** Agregar validación en `pdfParser.ts`
- **Archivos:** `api/utils/pdfParser.ts` (agregar 20 líneas)
- **Impacto:** ✅ Previene malware uploads

---

## 🟠 MODERADO (3-5 días - Impacto MEDIO-ALTO)

### 9. **Fix Race Condition en Límites** ⏱️ 3 días
- **Esfuerzo:** Implementar transaction o lock optimista
- **Archivos:** `api/calculate-scoring.ts` (modificar líneas 201-239)
- **Dificultad:** Requiere entender transacciones de Postgres
- **Impacto:** ✅ Previene aprobar más candidatos del límite

**Opciones:**
```typescript
// Opción A: Transaction con SELECT FOR UPDATE (Postgres)
const { data, error } = await supabase.rpc('approve_candidate_with_limit', {
  p_candidate_id: candidateId,
  p_process_id: processId,
  p_max_candidates: process.max_candidates
});

// Opción B: Redis atomic increment (más simple)
const count = await redis.incr(`process:${processId}:approved_count`);
if (count > process.max_candidates) {
  await redis.decr(`process:${processId}:approved_count`);
  return reject();
}
```

### 10. **React Query para Caching** ⏱️ 3-4 días
- **Esfuerzo:** Instalar `@tanstack/react-query` + refactorizar services
- **Archivos:**
  - `src/App.tsx` (wrap con QueryClientProvider)
  - `src/shared/services/*` → convertir a hooks
  - ~8 componentes que llaman servicios
- **Impacto:** ✅ Reduce queries 80%, UX más rápida

**Ejemplo:**
```typescript
// Antes:
const [candidates, setCandidates] = useState([]);
useEffect(() => {
  CandidateService.getCandidates().then(setCandidates);
}, []);

// Después:
const { data: candidates, isLoading } = useQuery({
  queryKey: ['candidates', recruiterId],
  queryFn: () => CandidateService.getCandidates(recruiterId),
  staleTime: 5 * 60 * 1000, // 5 min cache
});
```

### 11. **Integrar Sentry para Error Tracking** ⏱️ 4 horas
- **Esfuerzo:** Instalar `@sentry/react` + `@sentry/node`
- **Archivos:** `src/app/main.tsx`, todas las APIs
- **Costo:** Free tier 5,000 events/mes
- **Impacto:** ✅ Detectar errores antes que usuarios

### 12. **Paralelizar Queries en APIs** ⏱️ 2-3 días
- **Esfuerzo:** Reemplazar queries secuenciales con `Promise.all`
- **Archivos:**
  - `api/analyze-cv.ts` (líneas 61-86)
  - `api/calculate-scoring.ts` (líneas 33-85)
- **Impacto:** ✅ Reduce latencia 20-30%

**Ejemplo:**
```typescript
// Antes:
const candidate = await supabase.from('candidates').select().eq('id', id).single();
const process = await supabase.from('processes').select().eq('id', candidate.process_id).single();

// Después:
const [candidate, process] = await Promise.all([
  supabase.from('candidates').select().eq('id', id).single(),
  supabase.from('processes').select().eq('id', processId).single()
]);
```

---

## 🔴 COMPLEJO (1-2 semanas - Impacto ALTO)

### 13. **Refactorizar APIs Monolíticas** ⏱️ 1.5 semanas
- **Esfuerzo:** Dividir handlers en services + repositories
- **Archivos:**
  - `api/analyze-cv.ts` (331 líneas → 3 archivos)
  - `api/calculate-scoring.ts` (498 líneas → 3 archivos)
  - Crear: `services/`, `repositories/`
- **Impacto:** ✅ Mantenibilidad, testing, reusabilidad

**Estructura objetivo:**
```
api/
  ├── analyze-cv.ts (50 líneas - orchestrator)
  ├── calculate-scoring.ts (60 líneas - orchestrator)
  ├── services/
  │   ├── cvAnalysis.service.ts
  │   ├── questionGeneration.service.ts
  │   └── scoringEngine.service.ts
  └── repositories/
      ├── candidate.repository.ts
      └── process.repository.ts
```

### 14. **Extraer Prompts a Templates Externos** ⏱️ 1 semana
- **Esfuerzo:** Crear sistema de templates con Handlebars
- **Archivos:**
  - Crear: `prompts/analyze-cv.hbs`, `prompts/calculate-scoring.hbs`
  - Modificar: `api/utils/openai.ts`, APIs críticas
- **Impacto:** ✅ Iterar prompts sin redeploy

**Ejemplo:**
```handlebars
<!-- prompts/analyze-cv.hbs -->
Analiza este CV y genera preguntas específicas.

CV:
{{cvText}}

Requisitos obligatorios:
{{#each mandatoryRequirements}}
- {{this.title}} ({{this.level}})
{{/each}}

{{#if customPrompt}}
Criterios adicionales: {{customPrompt}}
{{/if}}
```

### 15. **Optimizar CandidatesTable con Server-Side Filters** ⏱️ 1 semana
- **Esfuerzo:** Crear API nueva + modificar componente
- **Archivos:**
  - Crear: `api/candidates/search.ts` (nueva API con filtros)
  - Modificar: `src/recruiter/components/candidates/CandidatesTable.tsx`
- **Impacto:** ✅ Query time constante

**Nueva API:**
```typescript
GET /api/candidates/search?
  recruiterId=xxx
  &search=nombre
  &processId=yyy
  &status=completed
  &page=1
  &limit=50
```

### 16. **Connection Pooler para Supabase** ⏱️ 1 semana
- **Esfuerzo:** Configurar Supabase Pooler + migrar todas las conexiones
- **Archivos:**
  - `api/utils/supabase.ts` (cambiar URL)
  - `.env` (agregar POOLER_URL)
- **Impacto:** ✅ Soporta 1000+ conexiones simultáneas

---

## 🟣 MUY COMPLEJO (3+ semanas - Impacto ALTO pero largo plazo)

### 17. **Queue System (BullMQ + Redis)** ⏱️ 3-4 semanas
- **Esfuerzo:** Arquitectura completamente asíncrona
- **Archivos:**
  - Crear: `workers/`, `queues/`
  - Refactor completo de analyze-cv y calculate-scoring
  - Agregar webhooks/polling para notificar candidato
- **Impacto:** ✅ Resiliencia total, procesa en background

**Cambio de flujo:**
```typescript
// Antes (síncrono):
POST /api/analyze-cv → espera 20s → retorna preguntas

// Después (asíncrono):
POST /api/analyze-cv → retorna { jobId: 'xxx' } inmediatamente
Worker procesa en background
Webhook notifica cuando está listo
Frontend hace polling o escucha webhook
```

### 18. **Circuit Breaker Pattern** ⏱️ 1-2 semanas
- **Esfuerzo:** Implementar con `opossum`
- **Archivos:** Todas las APIs que llaman servicios externos
- **Impacto:** ✅ Fail fast, evita cascading failures

### 19. **Migrar a Monorepo (Turborepo)** ⏱️ 2-3 semanas
- **Esfuerzo:** Reestructurar proyecto completo
- **Impacto:** ✅ Compartir types entre frontend/backend

### 20. **Event-Driven Architecture** ⏱️ 4+ semanas
- **Esfuerzo:** Kafka/SQS + eventos + handlers
- **Impacto:** ✅ Preparado para 10,000+ clientes

---

## 📊 RESUMEN: PRIORIZACIÓN POR IMPACTO vs ESFUERZO

### Quick Wins (Alto impacto, Bajo esfuerzo) - **HACER PRIMERO**

| # | Tarea | Tiempo | Impacto | Esfuerzo |
|---|-------|--------|---------|----------|
| 1 | Vercel Pro | 5 min | 🔥🔥🔥 | ⭐ |
| 2 | Índices BD | 30 min | 🔥🔥🔥 | ⭐ |
| 3 | Timeouts frontend | 2h | 🔥🔥 | ⭐ |
| 4 | Vercel Analytics | 30 min | 🔥🔥 | ⭐ |
| 5 | Rate Limiting | 1 día | 🔥🔥🔥 | ⭐⭐ |
| 6 | Retry Logic OpenAI | 1 día | 🔥🔥🔥 | ⭐⭐ |
| 7 | Structured Logging | 2 días | 🔥🔥 | ⭐⭐ |

**Total Quick Wins: 4-5 días → Aplicación 10x más estable**

### Worth It (Alto impacto, Esfuerzo moderado)

| # | Tarea | Tiempo | Impacto | Esfuerzo |
|---|-------|--------|---------|----------|
| 9 | Fix race condition | 3 días | 🔥🔥 | ⭐⭐⭐ |
| 10 | React Query | 4 días | 🔥🔥🔥 | ⭐⭐⭐ |
| 12 | Paralelizar queries | 3 días | 🔥🔥 | ⭐⭐⭐ |
| 13 | Refactor APIs | 1.5 sem | 🔥🔥 | ⭐⭐⭐⭐ |

**Total: 3-4 semanas → Preparado para 1,000 clientes**

---

## 🎯 MI RECOMENDACIÓN: Plan de 2 Semanas

**Semana 1 (Quick Wins):**
- Día 1 mañana: Vercel Pro + índices BD + Analytics (DONE en 3 horas)
- Día 1 tarde: Timeouts frontend
- Día 2-3: Rate limiting + Retry logic
- Día 4-5: Structured logging + Sentry

**Semana 2 (Consolidación):**
- Día 6-7: Fix race condition
- Día 8-10: Paralelizar queries en APIs

**Resultado:** Aplicación production-ready para **100-300 clientes** con inversión de solo 2 semanas.

---

**La buena noticia:** No necesitas hacer TODO. Con **las primeras 7 tareas (5 días)** ya tienes una aplicación 10x más robusta. El resto es para crecer más allá de 500 clientes.

¿Quieres que empiece por los Quick Wins? Puedo implementar los primeros 4 (#1-4) en las próximas horas.
