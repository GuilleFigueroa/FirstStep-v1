# FirstStep - Documentación de Desarrollo

## 📋 Contexto General de la Aplicación

### ¿Qué es FirstStep?
**FirstStep** es una aplicación web de **preselección inteligente de personal** destinada a reclutadores. Su objetivo es mejorar el primer filtro de candidatos mediante IA, optimizando la transparencia y calidad de información en el proceso de selección.

### Problema que Resuelve
- **Problema**: Los reclutadores descartan candidatos prematuramente por información incompleta o malentendidos en CVs
- **Solución**: IA que detecta gaps y genera preguntas específicas para aclarar y mejorar la información del perfil

## 🔄 Flujo Funcional Completo

### 1. Configuración del Reclutador
- **Input**: Descripción del perfil/puesto buscado
- **Proceso**: IA extrae requisitos automáticamente
- **Configuración**:
  - Requisitos **obligatorios** (eliminatorios) vs **deseables**
  - Configuración de **sinónimos** para detección precisa
  - Prompts específicos para contexto de IA
  - Hasta **2 preguntas tipo formulario** (ej: residencia, salario)

### 2. Proceso del Candidato
- **Acceso**: Link único por proceso de postulación
- **Flujo**:
  1. Postulación con CV
  2. IA analiza CV contra requisitos configurados
  3. IA detecta gaps, información confusa o faltante
  4. Genera **preguntas personalizadas específicas** para cada candidato
  5. Candidato responde preguntas específicas
  6. Sistema re-evalúa con información mejorada

### 3. Evaluación y Gestión
- **Scoring**: IA combina análisis de CV + respuestas
- **Criterios fijos**: No se pueden modificar una vez establecidos
- **Dashboard**: Gestión de múltiples procesos de postulación
- **Output**: Reclutador revisa CV + respuestas + score de cada candidato

### 4. Transparencia
- **Candidato informado**: Se le explica el proceso de preguntas antes de comenzar
- **Resultado final**: Candidato recibe resumen de requisitos cumplidos y mejoras logradas
- **Sin feedback**: No se explica el "por qué" de cada pregunta específica

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
- **Flujo de candidato**: Solo registro implementado
- **Proceso de preguntas**: Placeholders únicamente
- **Integración con backend**: No implementado
- **Datos reales**: Todo es mock actualmente

## 📊 Decisiones Arquitectónicas Tomadas

### Integración de Autenticación Real con Supabase (Commit actual)
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

### Prioridad Alta - SIGUIENTE SESIÓN
1. **Persistencia de Procesos de Reclutamiento** (`/src/recruiter/services/`)
   - Crear `processService.ts` para CRUD de procesos
   - Integrar guardado automático en `JobPostingConfig.tsx`
   - Mostrar procesos reales en `PostulationsTable.tsx`
   - Permitir edición/eliminación de procesos existentes

2. **Mejoras de Dashboard** (`/src/recruiter/components/dashboard/`)
   - Conectar `Dashboard.tsx` con datos reales de Supabase
   - Métricas en tiempo real (procesos activos, candidatos totales)
   - Estados de procesos (activo, cerrado, pausado)

3. **Desarrollo completo del flujo candidato** (Después de procesos)
   - Implementar proceso de preguntas personalizadas
   - Conectar con lógica de scoring
   - Resultado final para candidato

### Prioridad Media
4. **Funcionalidades IA** (Una vez que flujos básicos estén completos)
   - Integración con LLM para análisis de CV
   - Generación dinámica de preguntas
   - Sistema de scoring inteligente

5. **Sistema de links únicos**
   - Generación de URLs específicas por proceso
   - Gestión de accesos candidatos

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
- **Procesos no persisten**: Se crean en memoria, se pierden al recargar
- **Flujo candidato incompleto**: Solo demo/placeholder
- **Dashboard con datos mock**: Métricas no son reales
- **IA no implementada**: Funcionalidades simuladas

### Principios de Desarrollo
- **Simplicidad**: Mantener código claro para no-programadores
- **Modularidad**: Componentes independientes y reutilizables
- **Escalabilidad**: Preparado para crecimiento funcional
- **Mantenibilidad**: Estructura clara para instrucciones específicas

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
2. **Verificar servidor local**: `npm run dev`
3. **Revisar últimos commits** para entender cambios recientes
4. **Identificar scope específico** antes de modificaciones

### Para dar instrucciones efectivas:
- **Especificar componente exacto** a modificar
- **Describir funcionalidad deseada** en detalle
- **Indicar si es mejora, nueva feature o bug fix**
- **Mencionar si afecta flujo candidato vs reclutador**

---

**Última actualización**: 27-09-2024
**Estado**: Autenticación real funcionando, estructura optimizada, listo para persistencia de procesos
**Repositorio**: GitHub sincronizado y actualizado