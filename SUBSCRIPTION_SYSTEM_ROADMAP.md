# FirstStep - Sistema de Suscripciones y Pagos
## Roadmap y Tracking de Implementación

---

## ⚠️ REGLAS DE TRABAJO CRÍTICAS

### Antes de implementar CUALQUIER cambio:

1. **ENTENDER EL CÓDIGO EXISTENTE**
   - Leer y analizar el código que vas a modificar
   - Entender el flujo completo antes de escribir una línea
   - Buscar patrones existentes en el codebase

2. **MANTENER CONSISTENCIA**
   - Revisar cómo están implementadas funcionalidades similares
   - Usar la misma estructura de carpetas y archivos
   - Seguir los mismos patrones de nombres y organización
   - Ejemplo: endpoints en `/api` deben estar en la RAÍZ, no en subdirectorios

3. **VERIFICAR ANTES DE ASUMIR**
   - No asumir que algo funciona de cierta manera
   - Verificar en el código actual
   - Revisar la base de datos
   - Leer los archivos relevantes

4. **PREGUNTAR SI HAY DUDAS**
   - Si algo no está claro → PREGUNTAR
   - Si hay múltiples formas de hacerlo → PREGUNTAR
   - Si puede afectar otros flujos → PREGUNTAR
   - Mejor preguntar 10 veces que romper algo

5. **NO COMETER ERRORES DEL PASADO**
   - ❌ Crear endpoints en subdirectorios cuando deben estar en raíz
   - ❌ Auto-crear perfiles en lugares no autorizados
   - ❌ Duplicar código existente
   - ❌ Inconsistencias con la estructura actual

---

## 📋 CONTEXTO DEL SISTEMA

### Modelo de Negocio

#### Durante Trial (7 días):
- ✓ **Funcionalidad COMPLETA sin límites**
- ✓ Procesos ilimitados
- ✓ Todas las features disponibles
- ✓ `subscription_status = 'trialing'`
- ✓ `processes_limit = null`
- **Objetivo:** Que prueben TODO el sistema

#### Cuando Expira el Trial:
- 🔒 `subscription_status` cambia de `'trialing'` → `'expired'`
- 🔒 Todos los procesos activos se cierran automáticamente (`status='active'` → `'closed'`)
- 🔒 No puede crear nuevos procesos
- 🔒 Candidatos existentes se mantienen (data retenida)
- 🔒 Modal/cuadro informativo con botón para suscribirse

#### Después de Suscribirse:
- ✓ `subscription_status = 'active'`
- ✓ `current_plan` se actualiza al plan elegido
- ✓ `processes_limit` se actualiza según plan
- ✓ Puede reabrir procesos cerrados (respetando límites)

### Planes Disponibles

| Plan | Precio USD | Procesos Activos | Características |
|------|-----------|------------------|-----------------|
| **Trial** | $0 | Ilimitado (7 días) | Funcionalidad completa |
| **Starter** | $15/mes | 5 | Plan básico |
| **Pro** | $35/mes | 10 | Plan profesional |
| **Corporate** | Custom | Ilimitado | Requiere contacto |

### Lógica de Límites

- **Procesos activos:** Solo cuentan los que tienen `status='active'`
- **Procesos pausados/cerrados:** NO cuentan para el límite
- **Durante trial:** No se validan límites (`processes_limit = null`)
- **Con plan pago:** Se valida contra `processes_limit`
- **Plan Corporate:** `processes_limit = null` (ilimitado)

### Flujo de Datos

```
Usuario se registra
  ↓
profiles.subscription_status = 'trialing'
profiles.current_plan = 'trial'
profiles.processes_limit = null
profiles.trial_ends_at = NOW() + 7 days
  ↓
user_subscriptions (registro de trial)
  ↓
[7 DÍAS DE USO ILIMITADO]
  ↓
Cron job diario detecta trial vencido
  ↓
profiles.subscription_status = 'expired'
Todos los procesos activos → 'closed'
  ↓
Usuario intenta crear proceso → BLOQUEADO
  ↓
Modal: "Suscríbete para continuar"
  ↓
Usuario elige plan y paga en Mercado Pago
  ↓
Webhook recibe confirmación de pago
  ↓
profiles.subscription_status = 'active'
profiles.current_plan = 'starter' | 'pro' | 'corporate'
profiles.processes_limit = 5 | 10 | null
  ↓
payments (registro del pago)
  ↓
Usuario puede reabrir procesos (respetando límite)
```

---

## 🎯 ETAPAS DEL PROYECTO

### ✅ ETAPA 1: Crear 4 tablas nuevas en Supabase
**Estado:** COMPLETADA

**Pasos:**
1. Crear tabla `subscription_plans`
2. Crear tabla `user_subscriptions`
3. Crear tabla `payments`
4. Crear tabla `exchange_rates`
5. Verificar tablas en Supabase

---

### ✅ ETAPA 2: Modificar tabla profiles + migrar usuarios existentes
**Estado:** COMPLETADA

**Pasos:**
1. Agregar columnas a `profiles`:
   - `current_plan`
   - `subscription_status`
   - `trial_ends_at`
   - `processes_limit`
2. Migrar usuarios existentes (si aplica)
3. Verificar estructura en Supabase

---

### ✅ ETAPA 3: Crear trial automático al registrarse
**Estado:** COMPLETADA

**Pasos:**
1. Modificar `authService.ts` función `signUp()`
2. Al crear perfil, establecer:
   - `current_plan = 'trial'`
   - `subscription_status = 'trialing'`
   - `trial_ends_at = NOW() + 7 days`
   - `processes_limit = null`
3. Crear registro en `user_subscriptions`
4. Probar registro y verificar en DB

---

### ✅ ETAPA 4: Backend endpoints de lectura
**Estado:** COMPLETADA

**Pasos:**
1. Crear `/api/subscription-plans.ts` (raíz de /api)
2. Crear `/api/subscription-status.ts` (raíz de /api)
3. Verificar que endpoints respondan correctamente
4. Commit y deploy

**Archivos creados:**
- `api/subscription-plans.ts`
- `api/subscription-status.ts`

---

### ✅ ETAPA 5: Frontend mostrar estado suscripción
**Estado:** COMPLETADA

**Pasos:**
1. Crear `subscriptionService.ts` con funciones de llamada a API
2. Crear hook `useSubscription.ts` para manejar estado
3. Crear componente `SubscriptionBanner.tsx`:
   - Banner de trial activo con días restantes
   - Alerta urgente cuando quedan ≤3 días
   - Banner de trial expirado
4. Integrar en `Layout.tsx`
5. Build, commit y deploy
6. Verificar banner en producción

**Archivos creados:**
- `src/recruiter/services/subscriptionService.ts`
- `src/recruiter/hooks/useSubscription.ts`
- `src/recruiter/components/subscription/SubscriptionBanner.tsx`
- Modificado: `src/recruiter/components/dashboard/Layout.tsx`

---

### 🔄 ETAPA 6: Backend validación de límites
**Estado:** EN PROGRESO

**Objetivo:** Bloquear creación de procesos cuando trial expire o se exceda límite del plan.

#### Paso 1: Análisis del código existente ✅
- Entender cómo se crean procesos actualmente
- Identificar dónde agregar validación
- Confirmar lógica de estados y límites

#### Paso 2: Backend - Endpoint de validación
**Crear `/api/validate-process-limit.ts`**
- Recibe: `recruiterId`
- Obtiene profile del recruiter
- Evalúa según `subscription_status`:
  - `'expired'` → `canCreate: false, reason: 'trial_expired'`
  - `'trialing'` → `canCreate: true` (sin validar límites)
  - `'active'` → cuenta procesos activos y valida contra `processes_limit`
- Retorna: `{ canCreate: boolean, reason: string, currentCount: number, limit: number }`

#### Paso 3: Backend - Endpoint de creación con validación
**Crear `/api/create-process.ts`**
- Recibe: `recruiterId` + datos del proceso
- Llama internamente a lógica de validación
- Si validación pasa: crea el proceso
- Si validación falla: retorna error con razón específica
- Retorna: `{ success: boolean, process?: Process, error?: string, reason?: string }`

#### Paso 4: Frontend - Modificar servicio
**Actualizar `src/recruiter/services/processService.ts`**
- Crear función `validateProcessLimit(recruiterId)` que llama a `/api/validate-process-limit`
- Modificar función `createProcess()` para llamar a `/api/create-process`

#### Paso 5: Frontend - Validación preventiva en UI
- Llamar a `validateProcessLimit()` antes de mostrar formulario
- Si `canCreate === false`:
  - Deshabilitar botón "Crear proceso"
  - Mostrar mensaje según razón
- Si `canCreate === true`: permitir crear normalmente

#### Paso 6: Frontend - Manejo de errores
- Capturar errores del endpoint
- Mostrar mensaje de error al usuario
- Mantener formulario abierto

#### Paso 7: Build, commit y deploy
- Build del frontend
- Commit con mensaje descriptivo
- Push a repositorio
- Verificar deploy en Vercel

#### Paso 8: Testing manual
- Usuario en trial activo → puede crear ilimitado ✓
- Usuario trial expirado → bloqueado ✗
- Usuario plan Starter con 4 activos → puede crear ✓
- Usuario plan Starter con 5 activos → bloqueado ✗
- Usuario plan Corporate → puede crear ilimitado ✓

---

### ⏳ ETAPA 7: Cron job trials vencidos
**Estado:** PENDIENTE

**Objetivo:** Ejecutar diariamente un proceso que marque trials expirados y cierre sus procesos.

#### Pasos:
1. Crear script `/api/cron/expire-trials.ts`
2. Buscar profiles con:
   - `subscription_status = 'trialing'`
   - `trial_ends_at < NOW()`
3. Para cada perfil encontrado:
   - Actualizar `subscription_status = 'expired'`
   - Cerrar todos sus procesos activos: `UPDATE processes SET status='closed' WHERE recruiter_id=X AND status='active'`
4. Configurar Vercel Cron en `vercel.json`
5. Testing en sandbox
6. Activar en producción

---

### ⏳ ETAPA 8: Integración DolarAPI
**Estado:** PENDIENTE

**Objetivo:** Obtener tipo de cambio USD → ARS en tiempo real para mostrar precios en pesos.

#### Pasos:
1. Investigar DolarAPI (https://dolarapi.com/ o similar)
2. Crear endpoint `/api/exchange-rate.ts`
3. Cachear tasa de cambio (actualizar cada X horas)
4. Guardar en tabla `exchange_rates`
5. Frontend: mostrar precios en USD y ARS
6. Testing

---

### ⏳ ETAPA 9: Mercado Pago sandbox
**Estado:** PENDIENTE

**Objetivo:** Configurar Mercado Pago en modo prueba para testear flujo de pagos.

#### Pasos:
1. Crear cuenta de Mercado Pago
2. Obtener credenciales de sandbox (Access Token de prueba)
3. Configurar variables de entorno en Vercel:
   - `MP_ACCESS_TOKEN_SANDBOX`
   - `MP_PUBLIC_KEY_SANDBOX`
4. Crear endpoint `/api/mercado-pago/create-preference.ts`
5. Crear preferencia de pago con datos del plan
6. Frontend: botón "Suscribirse" redirige a checkout de MP
7. Testing con tarjetas de prueba

---

### ⏳ ETAPA 10: Webhook Mercado Pago
**Estado:** PENDIENTE

**Objetivo:** Recibir notificaciones cuando un usuario paga y actualizar su suscripción.

#### Pasos:
1. Crear endpoint `/api/mercado-pago/webhook.ts`
2. Configurar URL del webhook en panel de Mercado Pago
3. Recibir notificación de pago aprobado
4. Validar firma de Mercado Pago (seguridad)
5. Actualizar profiles:
   - `subscription_status = 'active'`
   - `current_plan = 'starter' | 'pro' | 'corporate'`
   - `processes_limit = 5 | 10 | null`
6. Crear registro en tabla `payments`
7. Enviar email de confirmación (Etapa 13)
8. Testing exhaustivo

**Actualización de `processes_limit` según plan:**
```javascript
if (plan === 'starter') processes_limit = 5
if (plan === 'pro') processes_limit = 10
if (plan === 'corporate') processes_limit = null
```

---

### ⏳ ETAPA 11: Frontend pantalla pricing
**Estado:** PENDIENTE

**Objetivo:** Crear página donde usuarios pueden ver planes y suscribirse.

#### Pasos:
1. Crear componente `PricingPage.tsx`
2. Mostrar 3 planes (Starter, Pro, Corporate)
3. Para cada plan:
   - Nombre, precio, características
   - Botón "Suscribirse" (Starter y Pro)
   - Botón "Contactar" (Corporate)
4. Integrar con `/api/mercado-pago/create-preference`
5. Redirigir a checkout de Mercado Pago
6. Manejar retorno después de pago
7. Agregar ruta en el router
8. Link desde banner cuando trial expira

---

### ⏳ ETAPA 11.5: Página Account Settings (NUEVA)
**Estado:** PENDIENTE

**Objetivo:** Permitir al usuario gestionar su cuenta y plan.

#### Pasos:
1. Crear componente `AccountSettings.tsx`
2. Secciones:
   - **Plan actual:** Mostrar plan, límites, fecha de renovación
   - **Billing:** Historial de pagos
   - **Datos de empresa:** Nombre, información de contacto
   - **Cambiar plan:** Link a pricing page
3. Agregar en menú/sidebar
4. Integración con datos de Mercado Pago
5. Testing

---

### ⏳ ETAPA 12: Frontend modales y UX
**Estado:** PENDIENTE

**Objetivo:** Mejorar experiencia de usuario con modales informativos.

#### Pasos:
1. **Modal de bienvenida al trial:**
   - Se muestra primera vez que entra después de registrarse
   - Explica: "Tienes 7 días de prueba gratis"
   - Botón "Empezar prueba"
   - Guardar en localStorage que ya lo vio

2. **Modal cuando trial expira:**
   - Reemplaza mensaje simple de Etapa 6
   - Diseño bonito con información clara
   - Botón "Ver planes" → redirige a pricing
   - Se muestra cuando intenta crear proceso o acción bloqueada

3. **Modal de límite alcanzado:**
   - Cuando plan pago alcanza límite de procesos
   - Opciones: "Cerrar procesos" o "Actualizar plan"

4. **Otros modales:**
   - Confirmaciones importantes
   - Mensajes de éxito/error mejorados

---

### ⏳ ETAPA 13: Templates emails Resend
**Estado:** PENDIENTE

**Objetivo:** Enviar emails transaccionales (confirmación de pago, trial expirando, etc.)

#### Pasos:
1. Crear cuenta en Resend
2. Configurar variables de entorno
3. Crear templates:
   - Bienvenida con trial
   - Trial por expirar (2 días antes)
   - Trial expirado
   - Confirmación de suscripción
   - Renovación de plan
4. Crear servicio `emailService.ts`
5. Integrar en:
   - Registro (Etapa 3)
   - Webhook MP (Etapa 10)
   - Cron job (Etapa 7)
6. Testing

---

### ⏳ ETAPA 14: Mercado Pago producción
**Estado:** PENDIENTE

**Objetivo:** Activar pagos reales en producción.

#### Pasos:
1. Obtener credenciales de producción de Mercado Pago
2. Actualizar variables de entorno en Vercel:
   - `MP_ACCESS_TOKEN_PROD`
   - `MP_PUBLIC_KEY_PROD`
3. Configurar webhook URL de producción
4. Testing con pago real pequeño
5. Verificar flujo completo end-to-end
6. Monitorear primeras transacciones
7. Activar sistema

---

### ⏳ ETAPA 15: Vercel Cron automático
**Estado:** PENDIENTE

**Objetivo:** Configurar cron job de Etapa 7 para ejecutarse automáticamente cada día.

#### Pasos:
1. Configurar `vercel.json` con cron:
   ```json
   {
     "crons": [{
       "path": "/api/cron/expire-trials",
       "schedule": "0 2 * * *"
     }]
   }
   ```
2. Deploy a Vercel
3. Verificar que cron se ejecuta
4. Monitorear logs
5. Configurar alertas si falla

---

### ✅ ETAPA 16: Limpieza aprobación manual
**Estado:** COMPLETADA

Código de aprobación manual removido del sistema.

---

### ✅ ETAPA 17: Desactivar verificación email
**Estado:** COMPLETADA

Verificación de email desactivada. Usuarios entran directo al panel.

---

### ⏳ ETAPA 18: Testing end-to-end
**Estado:** PENDIENTE

**Objetivo:** Probar flujo completo de usuario desde registro hasta renovación.

#### Escenarios a probar:
1. **Registro y trial:**
   - Registrarse → verificar trial de 7 días
   - Crear procesos ilimitados
   - Verificar banner con días restantes

2. **Expiración de trial:**
   - Simular que pasaron 7 días (modificar DB)
   - Ejecutar cron job manualmente
   - Verificar procesos cerrados
   - Intentar crear proceso → bloqueado
   - Ver modal de suscripción

3. **Suscripción a plan:**
   - Click en "Suscribirse"
   - Completar pago en MP sandbox
   - Verificar webhook actualiza DB
   - Verificar email de confirmación
   - Crear procesos (respetar límite)

4. **Límites de plan:**
   - Con plan Starter, crear 5 procesos
   - Intentar crear 6to → bloqueado
   - Cerrar uno, crear otro → permitido
   - Pausar uno → sigue contando en límite

5. **Upgrade de plan:**
   - Cambiar de Starter a Pro
   - Verificar límite aumenta a 10

6. **Plan Corporate:**
   - Flujo de contacto
   - Procesos ilimitados

---

### ⏳ ETAPA 19: Monitoreo y ajustes
**Estado:** PENDIENTE

#### Tareas:
1. Configurar Sentry o similar para errores
2. Dashboards de métricas:
   - Conversión trial → pago
   - Planes más populares
   - Ingresos mensuales
3. Ajustar límites/precios según data
4. Optimizaciones de performance

---

### ⏳ ETAPA 20: Documentación final
**Estado:** PENDIENTE

#### Documentos a crear:
1. README del sistema de suscripciones
2. Guía de troubleshooting
3. Documentación de webhooks
4. Guía de testing
5. Changelog de versiones

---

## 📊 PROGRESO GENERAL

**Completadas:** 5/20 etapas (25%)
**En progreso:** 1/20 etapas (Etapa 6)
**Pendientes:** 14/20 etapas (70%)

### Etapas Críticas Próximas:
1. ✅ Etapa 6: Validación de límites
2. 🔜 Etapa 7: Cron job trials vencidos
3. 🔜 Etapa 8-11: Sistema de pagos completo

---

## 🔧 STACK TECNOLÓGICO

- **Frontend:** React + TypeScript + Vite
- **Backend:** Vercel Serverless Functions
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Pagos:** Mercado Pago
- **Emails:** Resend
- **Exchange rates:** DolarAPI
- **Deployment:** Vercel
- **Cron jobs:** Vercel Cron

---

## 📝 NOTAS IMPORTANTES

### Seguridad:
- Todos los endpoints backend usan `supabaseAdmin` (SERVICE_ROLE_KEY)
- Validaciones siempre en backend, nunca confiar solo en frontend
- Webhooks de MP deben validar firma

### Consistencia de código:
- Endpoints API en raíz de `/api`, NO en subdirectorios
- Servicios en `src/recruiter/services/`
- Hooks en `src/recruiter/hooks/`
- Componentes organizados por feature en `src/recruiter/components/`

### Datos críticos:
- NUNCA eliminar datos de usuarios
- Al expirar trial: cerrar procesos, NO eliminar
- Retener candidatos, CVs, respuestas
- Permitir reactivación al suscribirse

---

**Última actualización:** 2025-12-05
**Versión del documento:** 1.0
