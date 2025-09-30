# FirstStep - Flujo de Producto

## 📋 Resumen de la Aplicación

**FirstStep** es una aplicación de preselección inteligente de personal que mejora el primer filtro de candidatos mediante IA. La aplicación tiene **dos flujos principales**: reclutador y candidato.

**Problema que resuelve**: Los reclutadores descartan candidatos prematuramente por información incompleta o malentendidos en CVs.

**Solución**: IA que detecta gaps, información incompleta, incongruencias o requisitos faltantes en los CVs y genera preguntas específicas para aclarar y mejorar la información del perfil de cada candidato.

---

## 🏢 Flujo del Reclutador

### 1. Registro y Autenticación
- **Primera vez**: Autenticación por email
- **Subsecuentes**: Login con email y contraseña
- Acceso al panel principal de la aplicación

### 2. Creación de Proceso de Postulación

#### 2.1 Descripción del Perfil
- Reclutador copia/pega o describe el perfil buscado
- IA extrae automáticamente los requisitos encontrados

#### 2.2 Configuración de Requisitos
- **Editar requisitos**: Eliminar, agregar, modificar requisitos detectados
- **Clasificación**: Establecer requisitos como "indispensables" vs "deseables"
- **Sinónimos**: Ver y configurar términos que la IA considerará equivalentes
- **Prompt personalizado**: Dar indicaciones específicas a la IA sobre el análisis

#### 2.3 Preguntas Adicionales (Opcional)
- Configurar hasta **2 preguntas tipo formulario**
- Ejemplos: residencia del candidato, sueldo pretendido
- Estas preguntas las responde el candidato al final del proceso

#### 2.4 Información del Proceso
- **Datos del puesto**: Título, descripción
- **Datos de la empresa**: Nombre, información relevante
- **Límite de candidatos**: Máximo de aplicaciones que acepta
- **Generación de link único**: Para compartir en redes sociales

### 3. Gestión de Procesos

#### 3.1 Estados del Proceso
- **Abierto**: Acepta nuevas aplicaciones
- **Cerrado**: No acepta más aplicaciones
- **Cierre automático**: Cuando se alcanza el límite de candidatos

#### 3.2 Dashboards Disponibles
- **Dashboard de Candidatos**: Todos los candidatos de todos los procesos
- **Dashboard de Procesos**: Gestión de procesos de postulación

#### 3.3 Revisión de Candidatos
Por cada candidato el reclutador puede ver:
- **CV original** subido por el candidato
- **Scoring parcial**: Basado en análisis de CV + respuestas
- **Respuestas a preguntas de IA**: Preguntas específicas generadas
- **Respuestas a preguntas del reclutador**: Las 2 preguntas tipo formulario
- **Comentario final**: Si el candidato agregó alguno

### 4. Características Importantes
- **No hay plantillas**: Cada proceso es completamente individual
- **No hay comparación**: No se pueden comparar candidatos entre procesos
- **Control total**: El reclutador puede abrir/cerrar procesos manualmente

---

## 👤 Flujo del Candidato

### 1. Acceso al Proceso
- **Link único**: Accede a través del enlace compartido por el reclutador
- **Registro obligatorio**: Nombre, apellido, email, URL de LinkedIn
- No necesita crear cuenta, solo proporcionar datos básicos

### 2. Información del Proceso
- **Visualización**: Ve información del puesto, empresa y explicación del proceso
- **No ve requisitos**: No tiene acceso a los criterios específicos de evaluación
- **Comprende el flujo**: Se le explica cómo funciona el proceso de preguntas

### 3. Proceso de Análisis

#### 3.1 Subida de CV
- Candidato sube su CV en formato digital
- IA inicia análisis automático contra los requisitos configurados

#### 3.2 Generación de Preguntas Personalizadas
- **IA analiza gaps**: Detecta información faltante o confusa en el CV
- **Generación específica**: Crea preguntas únicas para cada candidato
- **Límite**: Máximo 5 preguntas de IA por candidato
- **Dos tipos de preguntas**:
  - **Preguntas IA**: Generadas dinámicamente para aclarar requisitos
  - **Preguntas formulario**: Configuradas por el reclutador (máximo 2)

#### 3.3 Respuestas del Candidato
- **Preguntas de IA**: Responde las preguntas específicas generadas
- **Preguntas del reclutador**: Responde las 2 preguntas tipo formulario (si existen)
- **Progreso visible**: Ve cuántas preguntas ha respondido vs total

### 4. Evaluación y Resultado Final

#### 4.1 Validación de Requisitos Indispensables
- **Responde todas las preguntas**: El candidato completa TODAS las preguntas (IA + formulario)
- **Análisis final**: La IA evalúa CV + respuestas vs requisitos indispensables
- **Criterio eliminatorio**: Si no cumple algún requisito indispensable:
  - Se cierra su proceso
  - Recibe mensaje claro indicando qué requisito no cumplió
  - Sus datos NO se guardan en la base de datos
  - Ejemplo: "Tu postulación no cumple con: React 3+ años (indicaste: 1 año)"

#### 4.2 Devolución Completa (Solo si cumple requisitos indispensables)
El candidato recibe información sobre:
- **Requisitos cumplidos**: Qué criterios satisface
- **Requisitos faltantes**: Qué le falta para el perfil ideal
- **Scoring final**: Puntaje de 0-100 basado en cumplimiento de requisitos
- **Mejoras logradas**: Cómo sus respuestas mejoraron su perfil inicial

#### 4.3 Finalización
- **Comentario opcional**: Puede agregar un mensaje final al reclutador
- **Aplicación**: Confirma su postulación y termina el proceso
- **Sin ediciones**: No puede modificar respuestas una vez en el resumen final
- **Resultado único**: Solo ve el resultado una vez, no puede volver a acceder

### 5. Limitaciones del Candidato
- **Sin guardar progreso**: No puede pausar y continuar después (MVP - sin límite de tiempo)
- **Sin re-acceso**: Una vez terminado, no puede volver a ver el resultado
- **Sin información del puesto**: No ve detalles específicos del trabajo
- **Feedback limitado**: Solo recibe la devolución automática, el contacto posterior depende del reclutador
- **Rechazo inmediato**: Si no cumple requisitos indispensables, sus datos no se guardan

---

## 🔄 Interacción entre Flujos

### Puntos de Conexión
1. **Link único**: Generado por reclutador, usado por candidato
2. **Análisis de IA**: Configurado por reclutador, ejecutado con CV del candidato
3. **Datos del candidato**: Capturados en flujo candidato, visibles en dashboard reclutador
4. **Scoring**: Calculado automáticamente, visible para reclutador
5. **Estado del proceso**: Controlado por reclutador, afecta acceso del candidato

### Flujo de Datos
```
Reclutador configura proceso → Genera link único →
Candidato accede y se registra → Sube CV →
IA analiza según configuración del reclutador →
Candidato responde preguntas →
Sistema calcula scoring →
Candidato ve resultado final →
Reclutador ve perfil completo en dashboard
```

---

## 📊 Entidades Principales

### Reclutador
- Cuenta con autenticación
- Puede gestionar múltiples procesos
- Ve todos sus candidatos consolidados

### Proceso de Postulación
- Configuración única e individual
- Estado abierto/cerrado
- Link único asociado
- Límite de candidatos configurable

### Candidato
- Datos de registro básicos
- Asociado a UN proceso específico
- CV + respuestas a preguntas
- Scoring automático calculado

### Análisis/Scoring
- Basado en CV inicial + respuestas
- Visible para reclutador
- Devolución parcial para candidato

---

**Última actualización**: 30-09-2025
**Estado**: Flujo del reclutador completamente funcional, flujo del candidato en desarrollo. Arquitectura de IA definida y documentada en AI_ANALYSIS_IMPLEMENTATION.md