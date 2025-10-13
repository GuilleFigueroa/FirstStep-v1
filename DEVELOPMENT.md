# FirstStep - Documentación de Desarrollo

## 📋 Información de la Aplicación

Para entender **qué es FirstStep, cómo funciona y sus flujos de usuario**, consultar:
**[PRODUCT_FLOW.md](./PRODUCT_FLOW.md)** - Documentación completa del producto y flujos funcionales

Este documento se enfoca en el **avance técnico, estructura de desarrollo y decisiones arquitectónicas**.

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 6.3.5
- **UI Library**: Radix UI (componentes accesibles)
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Charts**: Recharts
- **Theme**: Next Themes

### Estructura Actual (Post-Reestructuración por Flujos)
```
src/
├── app/                       # Configuración aplicación
│   ├── App.tsx               # Router principal y estado global
│   └── main.tsx              # Entry point
├── recruiter/                # FLUJO COMPLETO RECLUTADOR
│   └── components/
│       ├── auth/
│       │   └── AuthScreen.tsx        # Autenticación reclutador (mock)
│       ├── dashboard/
│       │   ├── Dashboard.tsx         # Panel principal reclutador
│       │   ├── Layout.tsx           # Layout principal con sidebar
│       │   └── Sidebar.tsx          # Navegación lateral
│       ├── profile-config/
│       │   ├── TextAnalysisMode.tsx # Análisis IA de descripciones
│       │   ├── ProfileSummary.tsx   # Resumen perfil configurado
│       │   ├── CustomQuestionConfig.tsx # Config preguntas formulario
│       │   ├── JobPostingConfig.tsx # Configuración postulación
│       │   └── CustomPromptBox.tsx  # Configuración prompts IA
│       ├── candidates/
│       │   ├── CandidatesTable.tsx  # Tabla candidatos por proceso
│       │   ├── CandidateProfile.tsx # Perfil detallado candidato
│       │   └── CandidateSimulation.tsx # Simulación proceso candidato
│       └── postulations/
│           ├── PostulationsTable.tsx # Gestión postulaciones activas
│           └── PostulationDetails.tsx # Detalle postulación específica
├── candidate/                # FLUJO COMPLETO CANDIDATO
│   └── components/
│       ├── CandidateFlow.tsx    # Flujo completo candidato
│       └── CandidateRegistration.tsx # Registro inicial candidato
├── shared/                   # COMPONENTES COMPARTIDOS
│   └── components/
│       └── RoleSelection.tsx     # Pantalla inicial dual-role
├── ui/                       # SISTEMA DE DISEÑO
│   └── components/ui/        # Componentes base de Radix UI
└── styles/                   # ESTILOS GLOBALES
    ├── globals.css
    └── index.css
```

### Estado Actual de Desarrollo

**Última actualización:** 13-10-2025
**Estado general:** ✅ SISTEMA COMPLETAMENTE FUNCIONAL EN PRODUCCIÓN

#### ✅ Completamente Funcional (Reclutador) - 100%
- **Flujo completo del reclutador** con datos reales
- **Configuración de perfiles** con IA (separación mandatory/optional)
- **Dashboard con métricas** (datos reales desde Supabase)
- **Gestión de postulaciones** (crear, editar límite, pausar, cerrar, activar)
- **Sistema de autenticación** (Supabase Auth completo)
- **Dashboard de candidatos** con filtros avanzados y estados de seguimiento
- **Vista detallada de candidatos** (CandidateProfile.tsx con datos reales)
- **Sistema de favoritos** y seguimiento (reviewed, contacted)

#### ✅ Completamente Funcional (Candidato) - 100%
- **Flujo de candidato**: 6 steps completos
  1. registration → CandidateRegistration.tsx ✅
  2. verification → VerificationStep.tsx ✅ (captcha visual)
  3. profile → CVUploadStep.tsx ✅ (Supabase Storage + análisis IA)
  4. ai_questions → AIQuestionsStep.tsx ✅ (preguntas IA + scoring)
  5. recruiter_questions → RecruiterQuestionsStep.tsx ✅ (formulario)
  6. confirmation → ConfirmationStep.tsx ✅
- **Backend serverless** (Vercel Functions completamente funcional)
- **Análisis IA con GPT-4o-mini** (prompts optimizados)
- **Filtro eliminatorio** (soft delete si no cumple requisitos mandatory)
- **Protección IDOR** implementada en todas las APIs

## 📊 Decisiones Arquitectónicas Tomadas

### Implementación Completa de Subida de CV con UI Mejorada (Commit actual)
**Fecha**: 29-09-2024
**Problema**: Step 'profile' era solo placeholder, faltaba funcionalidad de subida de CV
**Solución**: Componente CVUploadStep.tsx completo con drag & drop, validación y UI profesional
**Resultado**: UI funcional lista para integración con Supabase Storage

#### Cambios Implementados:
- ✅ **CVUploadStep.tsx creado**: Componente completo con drag & drop funcional
- ✅ **Validación robusta**: Tipos de archivo (.pdf, .doc, .docx) y tamaño (5MB máx)
- ✅ **UI profesional**: Inspirada en CandidateSimulation.tsx, estados visuales claros
- ✅ **Integración en flujo**: Reemplaza placeholder en CandidateFlow.tsx
- ✅ **Aplicación de reglas nuevas**: Implementación rápida (8 min) siguiendo Reglas 6, 7, 8

### Implementación de Slider Captcha y Mejora de Reglas de Desarrollo (Commit previo)
**Fecha**: 29-09-2024
**Problema**: Verificación de seguridad faltante + errores de implementación recurrentes
**Solución**: Captcha funcional + nuevas reglas de desarrollo para evitar errores futuros
**Resultado**: Step verificación completo + reglas optimizadas documentadas

### Implementación de Acceso por Link Único + Corrección de Routing (Commit previo)
**Fecha**: 28-09-2024
**Problema**: Sin acceso directo por URLs candidatos + Errores en autenticación y flujo de creación procesos post-routing
**Solución**: React Router implementado + Reestructuración App.tsx + Corrección estados y props componentes
**Resultado**: URLs funcionales `/apply/:processId` + Flujos reclutador y candidato operativos

#### Cambios Implementados:
- ✅ **React Router DOM instalado**: Manejo completo de rutas URL
- ✅ **CandidateApplication.tsx creado**: Componente para acceso por link único con validaciones
- ✅ **getProcessByUniqueId() implementado**: Servicio para obtener procesos por URL
- ✅ **RecruiterApp.tsx separado**: Flujo reclutador independiente con todos los estados
- ✅ **App.tsx reestructurado**: Routes principal `/` y `/apply/:processId`
- ✅ **Estados críticos restaurados**: currentStep, currentProfile, currentPosting y handlers
- ✅ **Props corregidas**: AuthScreen, TextAnalysisMode, JobPostingConfig, CustomQuestionConfig
- ✅ **Flujo configuración funcional**: Pasos config → summary → custom-question → posting → simulation

### Implementación Completa de Persistencia de Procesos (Commit previo)
**Fecha**: 28-09-2024
**Problema**: Procesos de reclutamiento se perdían al recargar, datos simulados en dashboard y gestión
**Solución**: Implementación completa de persistencia con base de datos real y flujo funcional
**Resultado**: Sistema completo de gestión de procesos con datos reales

#### Cambios Implementados:
- ✅ **processService.ts creado**: CRUD completo para procesos, generación de links únicos
- ✅ **JobPostingConfig.tsx mejorado**: Guardado real en BD, loading states, manejo de errores
- ✅ **PostulationsTable.tsx conectado**: Datos reales de Supabase, gestión de estados de procesos
- ✅ **Dashboard.tsx actualizado**: Métricas reales, saludo personalizado, estadísticas en tiempo real
- ✅ **App.tsx integrado**: Paso correcto de userProfile a todos los componentes
- ✅ **Flujo completo funcional**: Crear → Guardar → Gestionar → Dashboard real

### Integración de Autenticación Real con Supabase (Commit previo)
**Fecha**: 27-09-2024
**Problema**: Autenticación mock limitaba testing real y preparación para producción
**Solución**: Integración completa con Supabase para autenticación y base de datos real
**Resultado**: Sistema de autenticación funcional con persistencia real

#### Cambios Implementados:
- ✅ **Supabase configurado**: Cliente, credenciales y conexión establecida
- ✅ **Base de datos real**: Tablas `profiles` y `processes` creadas
- ✅ **Autenticación completa**: Registro, login, logout, persistencia de sesión
- ✅ **AuthScreen mejorado**: UI real con validaciones, loading states y manejo de errores
- ✅ **Integración App.tsx**: Verificación automática de sesiones y estado persistente
- ✅ **Seguridad básica**: Políticas de acceso configuradas

### Reestructuración por Flujos (Commit cd584ce)
**Fecha**: 27-09-2024
**Problema**: Estructura plana dificultaba desarrollo independiente por features y preparación para backend
**Solución**: Reorganización completa por flujos de usuario (reclutador vs candidato)
**Resultado**: Estructura escalable preparada para desarrollo paso a paso

#### Cambios Implementados:
- ✅ **17 componentes reorganizados** por flujos funcionales
- ✅ **84+ imports actualizados** automáticamente
- ✅ **Separación clara**: `/recruiter/`, `/candidate/`, `/shared/`
- ✅ **Funcionalidad preservada**: Sin romper código existente
- ✅ **Preparado para backend**: Estructura escalable por features

### Limpieza Estructural Previa (Commit 5282eb6)
**Fecha**: 27-09-2024
**Problema**: Archivos duplicados por proceso de migración desde Figma
**Solución**: Eliminación de 9 archivos duplicados y 4 carpetas huérfanas
**Resultado**: Base limpia para reestructuración posterior

### Patrón de Estado
- **Centralizado en App.tsx**: Todo el estado global manejado desde componente raíz
- **Props drilling**: Datos pasan por props a componentes hijos
- **Estados locales**: Formularios y UI específica en componentes individuales

### Datos Mock
- **Distribuidos**: Cada componente tiene sus datos de prueba
- **Consistencia**: Mantener formatos similares entre componentes
- **Transición**: Preparado para migrar a API real

## 🎯 Próximos Pasos por Implementar

### ✅ Implementación IA Completada (100%)
1. **✅ COMPLETADO: Implementación completa de análisis IA con Vercel AI SDK**
   - ✅ **PASO 1**: Backend serverless configurado en Vercel
   - ✅ **PASO 2**: Base de datos modificada en Supabase (todas las tablas)
   - ✅ **PASO 3**: Parser PDF/DOCX implementado y funcional
   - ✅ **PASO 4**: `/api/analyze-cv` + Integración CVUploadStep
   - ✅ **PASO 5**: UI AIQuestionsStep + RecruiterQuestionsStep
     - AIQuestionsStep.tsx (371 líneas) ✅
     - RecruiterQuestionsStep.tsx (267 líneas) ✅
     - `/api/save-ai-answers.ts` ✅
     - `/api/save-recruiter-answers.ts` ✅
     - CandidateFlow con 6 steps completo ✅
   - ✅ **PASO 6**: `/api/calculate-scoring` + Filtro eliminatorio
     - Scoring moderado con tolerance
     - Soft delete de rechazados con rejection_reason
     - Evaluación mandatory/optional requirements
   - ✅ **PASO 7**: Dashboard reclutador con análisis completo
     - `/api/get-candidate-analysis.ts` funcional
     - CandidatesTable.tsx con datos reales
     - CandidateProfile.tsx completamente refactorizado
     - Filtros avanzados + estados de seguimiento

### Decisiones Arquitectónicas Clave (Sesión 01-10-2025)

**1. Vercel AI SDK (no SDK directo OpenAI)**
- ✅ Multi-proveedor: Cambiar entre OpenAI, Claude, Gemini sin refactorizar
- ✅ Optimizado para Vercel serverless
- ✅ Timeout y JSON mode integrados
- ✅ Menor overhead y sin vendor lock-in

**2. Desarrollo directo con API real**
- ✅ Implementación incremental con OpenAI desde el principio
- ✅ Resultados y feedback reales en cada iteración
- ✅ Sin sorpresas al pasar a producción
- ✅ Costo de desarrollo estimado: $2-5 USD (testing y ajustes de prompts)

**3. Flujo candidato con 6 steps (actualizado):**
```
1. registration → CandidateRegistration ✅
2. verification → VerificationStep ✅
3. profile → CVUploadStep ✅ + POST /api/analyze-cv
4. ai_questions → AIQuestionsStep (NUEVO) + POST /api/calculate-scoring
5. recruiter_questions → RecruiterQuestionsStep (NUEVO)
6. confirmation → Confirmación ✅
```

**4. Separación AI Questions vs Recruiter Questions**
- **ai_questions:** Generadas por IA → Usadas para scoring → Filtro eliminatorio
- **recruiter_questions:** Configuradas por reclutador → Solo informativas
- **Razón:** Scoring ANTES de formulario = No desperdiciar tiempo candidatos rechazados

**5. Integración `/api/analyze-cv` desde CVUploadStep**
- Llamada DESPUÉS de subir CV a Storage
- Loading state: "Analizando tu CV..." (blocking)
- Si error parsing/IA → Mostrar error, NO avanzar
- Si éxito → Avanzar a ai_questions

**6. Flujo de IA (2 llamadas):**
- **LLAMADA 1 (POST /api/analyze-cv):** Análisis CV + Generación 3-5 preguntas (~$0.03/candidato)
- **LLAMADA 2 (POST /api/calculate-scoring):** Evaluar CV + respuestas + filtro eliminatorio (~$0.04/candidato)
- **Total: $0.07 USD por candidato**

**7. Filtro eliminatorio optimizado:**
- Candidato responde ai_questions → Scoring se calcula
- Si `meetsAllMandatory = false` → Hard delete + Mensaje específico
- Si `meetsAllMandatory = true` → Avanza a recruiter_questions
- **Ventaja:** Candidatos rechazados no pierden tiempo en formulario

**8. Dashboard reclutador:**
- Layout split screen: CV parseado (texto, no PDF embebido) + Análisis completo
- Solo candidatos aprobados visibles (rechazados eliminados de BD)
- Secciones: Scoring + Requisitos + AI Questions + Recruiter Questions

**9. Estructura de requisitos (ACTUALIZADO - Sesión 02/10/2025):**
- ✅ **REFACTOR COMPLETADO**: Separación arquitectónica completa
- Frontend: `mandatoryRequirements` y `optionalRequirements` (arrays separados en estado)
- Backend: `mandatory_requirements` y `optional_requirements` (columnas JSONB separadas)
- Base de datos: Guardar directamente en columnas separadas
- UI: Render unificado con sort para estabilidad visual (toggle sin saltos)

**10. Form questions (dual):**
- Mantener `form_questions` (JSONB) para compatibilidad con código existente del reclutador
- Tabla `recruiter_questions` usada por flujo candidato
- Al crear proceso: guardar en ambos lados (sincronización)

### ✅ Funcionalidades Principales Completadas

1. **✅ COMPLETADO: Persistencia de Procesos de Reclutamiento**
   - ✅ `processService.ts` con CRUD completo
   - ✅ Gestión de estados (active, closed, paused)
   - ✅ Modificación dinámica de límite de candidatos
   - ✅ Vista detallada de postulaciones (PostulationDetailView.tsx)
   - ✅ Dashboard con métricas reales

2. **✅ COMPLETADO: Flujo Candidato Completo** (`/src/candidate/components/`)
   - ✅ Acceso por link único a procesos
   - ✅ Verificación captcha funcional
   - ✅ Subida de CV con Supabase Storage
   - ✅ Sistema de preguntas personalizadas generadas por IA
   - ✅ Lógica de scoring y filtro eliminatorio
   - ✅ AIQuestionsStep + RecruiterQuestionsStep
   - ✅ Resultado final con feedback completo

3. **✅ COMPLETADO: Gestión de Candidatos** (`/src/recruiter/components/candidates/`)
   - ✅ CandidatesTable.tsx con datos reales
   - ✅ Filtrado por nombre, puesto, empresa, estado
   - ✅ CandidateProfile.tsx con layout split screen (PDF + Análisis)
   - ✅ Sistema de scoring y estados de seguimiento
   - ✅ Protección IDOR en todas las APIs

### Funcionalidades Adicionales (Opcional/Futuro)

4. **Mejoras IA Adicionales** (Post-MVP)
   - Selector modo scoring (strict vs moderate)
   - Optimización adicional de prompts
   - Soporte para más modelos LLM

5. **Gestión de sinónimos** (Opcional - Mock implementado)
   - ✅ Panel UI existe pero no se usa en análisis
   - ✅ GPT-4o-mini reconoce variaciones nativamente
   - Implementación real solo si usuarios lo solicitan

6. **Comparación entre candidatos** (Funcionalidad futura)
   - Ranking automático entre candidatos
   - Herramientas de comparación lado a lado

### Optimizaciones (Prioridad Baja)
7. **UX/UI**
   - Mejoras de accesibilidad adicionales
   - Modo oscuro (Next Themes ya instalado)
   - Animaciones y transiciones

8. **Analytics y Reportes**
   - Dashboard de métricas de efectividad
   - Exportación de datos (CSV, PDF)
   - Reportes por período

## 🚨 Consideraciones Importantes

### Limitaciones Resueltas ✅
- **✅ RESUELTO: Procesos persisten**: Guardado real en base de datos funcional
- **✅ RESUELTO: Dashboard con datos reales**: Métricas reales implementadas
- **✅ RESUELTO: Acceso por link único**: URLs funcionales para candidatos
- **✅ RESUELTO: Errores autenticación y flujo**: Estados y props corregidos
- **✅ RESUELTO: Flujo candidato**: 6 steps completamente funcionales
- **✅ RESUELTO: IA implementada**: GPT-4o-mini integrado y funcional
- **✅ RESUELTO: Gestión de candidatos**: Dashboard completo con datos reales

### Estado Actual (13-10-2025)
**No hay limitaciones técnicas críticas.** El sistema está completamente funcional y en producción.

### Principios de Desarrollo
- **Simplicidad**: Mantener código claro para no-programadores
- **Modularidad**: Componentes independientes y reutilizables
- **Escalabilidad**: Preparado para crecimiento funcional
- **Mantenibilidad**: Estructura clara para instrucciones específicas

## 🚦 Reglas de Desarrollo (OBLIGATORIAS)

### 📏 **Regla 1: "Un Cambio, Una Verificación"**
- **NUNCA** implementar múltiples funcionalidades simultáneamente
- **SIEMPRE** verificar que funciona antes de continuar al siguiente paso
- **Verificación obligatoria**: Compilación + Funcionalidad existente + Nueva funcionalidad

### 📏 **Regla 2: "Pasos Atómicos Definidos"**
Para cada tarea grande, **OBLIGATORIAMENTE** dividir en subtareas verificables:

**Ejemplo correcto:**
1. ✅ Paso específico → Verificar que funciona → Documentar
2. ✅ Siguiente paso → Verificar que funciona → Documentar
3. ✅ Siguiente paso → Verificar que funciona → Documentar

**❌ Incorrecto**: Implementar todo → Probar al final

### 📏 **Regla 3: "STOP Obligatorio Después de Cada Paso"**
Después de cada cambio atómico, verificar:
- ✅ **Servidor levanta sin errores** (`npm run dev`)
- ✅ **Funcionalidades existentes funcionan** (navegación, flujos principales)
- ✅ **Nueva funcionalidad funciona** según lo esperado

### 📏 **Regla 4: "Máximo 1 Archivo Complejo por Paso"**
- Si necesito cambiar > 3 archivos = dividir en sub-pasos
- Si es reestructuración arquitectural = crear backup explícito
- Cambios incrementales siempre

### 📏 **Regla 5: "Commit Temprano y Frecuente"**
- Cada paso atómico completado = commit potencial
- Mensajes descriptivos del cambio específico
- Fácil rollback granular si algo falla

### 📏 **Regla 6: "Estructural Antes que Lógico"**
- **Ante errores**: Verificar primero lo estructural (IDs, schemas, permisos, configuración)
- **Antes de asumir bugs**: Confirmar que identificadores, foreign keys y recursos existen
- **Criterio**: Si falla conexión → problema estructural 80% del tiempo
- **Principio**: La mayoría de errores son de configuración/setup, no de lógica de código

### 📏 **Regla 7: "Hello World Primero"**
- **Nueva librería**: Implementar ejemplo más básico posible (1-2 minutos máximo)
- **Test mínimo**: `import + render + compilar` antes de agregar features
- **Criterio**: Si no funciona en 2 minutos, cambiar librería inmediatamente
- **Evita**: Implementar funcionalidad compleja sobre base inestable

### 📏 **Regla 8: "Red Flags = STOP"**
- **Señales de alerta**: Textos en idiomas incorrectos, imágenes rotas, warnings masivos
- **Acción**: Pausar inmediatamente, diagnosticar causa raíz
- **No intentar**: "Arreglar" síntomas, ir directo al problema fundamental
- **Principio**: Red flags indican elección arquitectural incorrecta

### 📏 **Regla 9: "Simple > Complejo"**
- **Preferir librerías**: Con <3 props requeridas para funcionalidad básica
- **Criterio de selección**: 80% funcionalidad con 20% complejidad
- **Timeout**: Si implementación toma >5 minutos, buscar alternativa más simple
- **Objetivo**: Priorizar soluciones que funcionen rápidamente

### 📏 **Regla 10: "Testing Manual Únicamente"**
- **NO crear tests artificiales** o funciones de testing automático
- **Testing manual**: El usuario debe probar flujos reales en la aplicación
- **Verificación directa**: Usar la UI/UX real para confirmar funcionalidad
- **Principio**: Tests manuales son más eficientes y contextuales que artificiales

### 🎯 **Objetivos de estas Reglas:**
- **💡 Evitar errores** en cascada y debugging masivo
- **⏰ Ahorrar tiempo** evitando sesiones de arreglos
- **🪙 Optimizar tokens** reduciendo tool calls de corrección
- **🚀 Fallar rápido** para cambiar approach sin costo elevado

### Comandos de Desarrollo
```bash
# Instalar dependencias
npm install

# Ejecutar servidor desarrollo
npm run dev
# Acceso: http://localhost:3000

# Build para producción
npm run build
```

## 📝 Notas para Futuras Sesiones

### Al reanudar desarrollo:
1. **Revisar este documento** para contexto completo
2. **Leer las Reglas de Desarrollo** y aplicarlas OBLIGATORIAMENTE
3. **Verificar servidor local**: `npm run dev`
4. **Revisar últimos commits** para entender cambios recientes
5. **Dividir la tarea en pasos atómicos** antes de comenzar

### Para dar instrucciones efectivas:
- **Especificar componente exacto** a modificar
- **Describir funcionalidad deseada** en detalle
- **Indicar si es mejora, nueva feature o bug fix**
- **Mencionar si afecta flujo candidato vs reclutador**

---

**Última actualización**: 13-10-2025

**Estado**: ✅ SISTEMA COMPLETAMENTE FUNCIONAL EN PRODUCCIÓN

## 🎉 Funcionalidades Recientes (Octubre 2025)

**Completado en Sesión 02/10/2025 (Parte 1):**
- ✅ **REFACTOR ARQUITECTÓNICO COMPLETO**: Separación de requisitos (5 commits)
  - FASE 1: Tipos actualizados (`JobProfile` + `Process` interfaces)
  - FASE 2: Backend guarda a columnas separadas en Supabase
  - FASE 3: `TextAnalysisMode.tsx` con 2 arrays de estado
  - FASE 4: Componentes visualización actualizados (ProfileSummary, JobPostingConfig, CandidateSimulation)
  - FASE 5: Fix UX - ordenamiento por ID para prevenir saltos visuales en toggle
- ✅ Branch `refactor/separate-requirements` mergeado exitosamente a `main`
- ✅ Build exitoso + flujo completo probado sin breaking changes
- ✅ Base de datos limpia (procesos viejos eliminados)

**Completado en Sesión 02/10/2025 (Parte 2):**
- ✅ **MEJORAS UX/UI EN REQUISITOS**: Niveles explícitos + sinónimos optimizados
  - Niveles actualizados con años de experiencia explícitos:
    - `básico (0-2 años de experiencia)`
    - `intermedio (2-4 años de experiencia)`
    - `avanzado (5+ años de experiencia)`
  - Display en UI: Solo nombre nivel en selector, detalle completo en dropdown
  - Base de datos: Guarda texto completo para claridad en análisis IA
  - Panel de sinónimos simplificado:
    - ✅ Eliminado botón "Sugerir similares con IA" (GPT-4o-mini ya reconoce variaciones)
    - ✅ Tooltip informativo: "La IA ya reconoce variaciones y sinónimos automáticamente"
    - ✅ Panel conservado como mock para confianza del reclutador
    - ✅ No se usan sinónimos en análisis real (optimización de costos)

**Decisión arquitectónica final:**
- **Opción B implementada**: Separación completa (mandatory/optional)
- `JobProfile`: `mandatoryRequirements` + `optionalRequirements` (arrays separados)
- `Process`: `mandatory_requirements` + `optional_requirements` (columnas JSONB)
- UI: Render unificado `allRequirements.sort()` para mantener orden visual estable

**Decisión técnica: Mapeo de niveles a experiencia**
- **Problema**: "básico/intermedio/avanzado" es subjetivo para la IA
- **Solución**: Mapeo explícito a años de experiencia
- **Aplicación**: Todas las categorías (herramientas, habilidades técnicas, idiomas, etc.)
- **Ejemplo**: "React avanzado (5+ años de experiencia)" es objetivo y medible

**Decisión técnica: Sinónimos y extracción de requisitos**
- **Extracción**: Regex + keywords hardcoded (no IA, 0 costo)
- **Sinónimos**: No se usan en análisis (GPT-4o-mini entiende variaciones nativamente)
- **UX**: Panel de sinónimos conservado como mock (confianza del usuario)
- **Ahorro**: ~$0.00002 por candidato al no procesar sinónimos

**Completado en Sesión 03/10/2025 (Parte 3):**
- ✅ **VARIABLES DE ENTORNO IMPLEMENTADAS**: Migración de hardcoded a .env
  - Archivo `.env` creado con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
  - `src/shared/services/supabase.ts` actualizado para usar `import.meta.env.VITE_*`
  - `.gitignore` actualizado para proteger archivos `.env`
  - Variables configuradas en Vercel Dashboard (Production, Preview, Development):
    - ✅ `VITE_SUPABASE_URL` (frontend)
    - ✅ `VITE_SUPABASE_ANON_KEY` (frontend)
    - ✅ `OPENAI_API_KEY` (backend)
    - ✅ `SUPABASE_URL` (backend)
    - ✅ `SUPABASE_SERVICE_ROLE_KEY` (backend)
  - Re-deploy en Vercel completado
  - Build local y producción verificados exitosamente

- ✅ **SOFT DELETE IMPLEMENTADO**: Sistema de rechazo de candidatos
  - Interface `Candidate` actualizada: `status` incluye `'rejected'` + campo `rejection_reason`
  - Función `CandidateService.rejectCandidate()` creada (soft delete)
  - Validación de duplicados confirmada: bloquea re-intentos de rechazados
  - Preparado para `/api/calculate-scoring` (PASO 6)

**Completado Post-Sesión 03/10/2025:**
- ✅ **PASO 5 COMPLETADO**: AIQuestionsStep + RecruiterQuestionsStep implementados
- ✅ **PASO 6 COMPLETADO**: `/api/calculate-scoring` con filtro eliminatorio
- ✅ **PASO 7 COMPLETADO**: Dashboard reclutador con análisis completo
- ✅ **PROTECCIÓN IDOR**: APIs de candidatos protegidas (commit a58574b)
- ✅ **OPTIMIZACIÓN PROMPTS**: Análisis semántico compacto (commit c6487a3)
- ✅ **GESTIÓN POSTULACIONES**: Vista detallada + modificación límites
- ✅ **ESTADOS SEGUIMIENTO**: Favoritos, revisado, contactado con persistencia
- ✅ **FILTRADO CANDIDATOS**: Corrección por proceso (commit 12e128d)

**Notas técnicas:**
- Cache de Vercel: Forzar re-deploy si variables de entorno no se aplican
- APIs serverless: Solo disponibles en Vercel, no en `npm run dev` local
- Desarrollo: Usar deploy directo a producción para probar APIs

**Repositorio**: GitHub sincronizado | Ver AI_ANALYSIS_IMPLEMENTATION.md para tracking detallado paso a paso