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

#### ✅ Completamente Funcional (Reclutador)
- **Flujo completo del reclutador**
- **Configuración de perfiles** con IA
- **Dashboard con métricas** (datos mock)
- **Gestión de postulaciones** (datos mock)
- **Sistema de autenticación** (mock)
- **Simulación de candidatos** para testing

#### 🚧 En Desarrollo (Candidato)
- **Flujo de candidato**: Registro + Verificación Captcha + Subida de CV (UI completa)
- **Subida de CV**: UI funcional con drag & drop, validación, pero sin persistencia
- **Proceso de preguntas**: Placeholders únicamente
- **Integración con backend**: Parcial (falta Supabase Storage y persistencia)
- **Datos reales**: Captcha y CV upload locales, resto mock

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

### Prioridad Alta - EN PROGRESO (Sesión 30-09-2025)
1. **🚧 EN PROGRESO: Implementación completa de análisis IA**
   - ✅ **PASO 1 COMPLETADO**: Backend serverless configurado en Vercel
     - Endpoint `/api/health` funcional en producción
     - Deploy automático desde GitHub configurado
   - ✅ **PASO 2 COMPLETADO**: Base de datos modificada en Supabase
     - Tabla `processes`: Columnas `mandatory_requirements` y `optional_requirements` agregadas
     - Tabla `candidates`: Columnas `cv_analysis`, `scoring_details`, `parsing_failed`, `parsing_error`, `ai_analysis_failed` agregadas
     - Tabla `ai_questions` creada para preguntas generadas por IA
     - Tabla `recruiter_questions` creada para preguntas formulario
     - Tabla `recruiter_answers` creada para respuestas a formulario
     - Tipos TypeScript actualizados en `supabase.ts`
   - ✅ **PASO 3 COMPLETADO**: Parser de PDF/DOCX implementado
     - `/api/utils/supabase.ts`: Cliente backend con SERVICE_ROLE_KEY
     - `/api/utils/pdfParser.ts`: Extracción de texto PDF y DOCX
     - `/api/test-parser.ts`: Endpoint de prueba funcional en producción
     - Soporte para bucket `candidate-cvs`
     - Validación de texto extraído (mínimo 50 caracteres)
     - Probado exitosamente con CV real
   - ⏳ **PASO 4**: Integración con OpenAI para análisis de CV (requiere API key)
   - ⏳ **PASO 5**: UI de preguntas para candidato
   - ⏳ **PASO 6**: Cálculo de scoring y resultado final

### Decisiones Arquitectónicas Clave (Sesión 30-09-2025)
**Flujo de IA (2 llamadas):**
- LLAMADA 1: Análisis CV + Generación de preguntas personalizadas
- LLAMADA 2: Scoring final (después de que candidato responda)

**Manejo de candidatos rechazados:**
- Candidato responde TODAS las preguntas (IA + formulario)
- Validación al final: Si no cumple requisitos indispensables → Hard delete (no guardar en BD)
- Mensaje transparente indicando qué requisito no cumplió

**Tipos de requisitos:**
- Indispensables (`required: true`): Filtro eliminatorio
- Deseables (`required: false`): Suman al scoring

**Tipos de preguntas:**
- Preguntas IA: Generadas dinámicamente, para scoring
- Preguntas formulario: Configuradas por reclutador, solo informativas

**Dashboard reclutador:**
- Layout split screen: PDF original (izquierda) + Análisis/Scoring (derecha)
- Secciones colapsables: Análisis de Compatibilidad, Respuestas del Proceso

### Prioridad Alta - SIGUIENTE SESIÓN
1. **✅ COMPLETADO: Persistencia de Procesos de Reclutamiento**
   - ✅ `processService.ts` creado con CRUD completo
   - ✅ Guardado automático integrado en `JobPostingConfig.tsx`
   - ✅ Procesos reales mostrados en `PostulationsTable.tsx`
   - ✅ Edición/eliminación de procesos implementada
   - ✅ Dashboard conectado con datos reales de Supabase

2. **✅ PARCIALMENTE COMPLETADO: Desarrollo del flujo candidato** (`/src/candidate/components/`)
   - ✅ Acceso por link único a procesos implementado
   - ✅ Verificación captcha implementada y funcional
   - ✅ UI de subida de CV completa (drag & drop, validación)
   - ❌ **PENDIENTE**: Integración con Supabase Storage para persistir CVs
   - ❌ **PENDIENTE**: Creación de candidateService.ts
   - ❌ **PENDIENTE**: Sistema de preguntas personalizadas generadas por IA (en progreso)
   - ❌ **PENDIENTE**: Lógica de scoring y evaluación (arquitectura definida)
   - ❌ **PENDIENTE**: Resultado final para candidato con feedback

3. **Gestión de candidatos** (`/src/recruiter/components/candidates/`)
   - Conectar `CandidatesTable.tsx` con datos reales
   - Mostrar candidatos por proceso específico
   - Implementar `CandidateProfile.tsx` con layout split screen (PDF + Análisis)
   - Sistema de scoring y ranking de candidatos

### Prioridad Media
4. **Funcionalidades IA** (Una vez que flujos básicos estén completos)
   - Integración con LLM para análisis de CV
   - Generación dinámica de preguntas
   - Sistema de scoring inteligente

5. **✅ COMPLETADO: Sistema de links únicos**
   - ✅ Generación de URLs específicas por proceso
   - ⏳ Gestión de accesos candidatos (pendiente flujo candidato)

6. **Gestión de sinónimos**
   - Interface para configurar términos de búsqueda
   - Algoritmo de matching avanzado

7. **Comparación entre candidatos**
   - Ranking automático (funcionalidad futura)
   - Herramientas de comparación

### Prioridad Baja
8. **Optimizaciones UX/UI**
   - Feedback en tiempo real
   - Mejoras de accesibilidad
   - Modo oscuro

9. **Analytics y Reportes**
   - Métricas de efectividad
   - Exportación de datos

## 🚨 Consideraciones Importantes

### Limitaciones Actuales
- **✅ RESUELTO: Procesos persisten**: Guardado real en base de datos funcional
- **✅ RESUELTO: Dashboard con datos reales**: Métricas reales implementadas
- **✅ RESUELTO: Acceso por link único**: URLs funcionales para candidatos
- **✅ RESUELTO: Errores autenticación y flujo**: Estados y props corregidos
- **Flujo candidato incompleto**: Solo registro implementado, faltan pasos CV, preguntas, scoring
- **IA no implementada**: Funcionalidades simuladas, pendiente integración con LLM
- **Gestión de candidatos**: Componentes existen pero sin conexión a datos reales

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

**Última actualización**: 30-09-2025
**Estado**: Backend serverless configurado en Vercel. Arquitectura completa de análisis IA definida y documentada. Iniciando implementación PASO 2 (modificación de base de datos). Ver AI_ANALYSIS_IMPLEMENTATION.md para detalles técnicos completos.
**Repositorio**: GitHub sincronizado y actualizado