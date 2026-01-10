# Fix: Validación de límites al reactivar procesos

**Fecha:** 10 de Enero, 2026
**Commits:** `9dc0f33`, `9bcfd39`
**Status:** ✅ Deployado y testeado en producción

---

## 🐛 Bug Resuelto

**Problema original:**
Los usuarios podían reactivar procesos cerrados o pausados sin validación de límites, permitiendo sobrepasar el límite de su plan.

**Escenario:**
1. Usuario con plan Starter (límite: 5 procesos activos)
2. Tiene 5 procesos activos
3. Cierra 1 proceso → Ahora tiene 4 activos
4. Crea 1 proceso nuevo → Ahora tiene 5 activos
5. **Reactivaba el proceso cerrado → Ahora tiene 6 activos** ❌ (BUG)

**Solución:**
Ahora valida límites al reactivar procesos. Si alcanzó el límite, retorna 403 Forbidden.

---

## 📝 Cambios Implementados

### **Archivos Nuevos:**

#### 1. `api/_utils/subscription.ts`
Función reutilizable para validar límites de suscripción:
```typescript
export async function validateProcessLimit(
  recruiterId: string,
  excludeProcessId?: string
): Promise<{ canProceed: boolean; error?: string; ... }>
```

**Lógica:**
- Valida si `subscription_status = 'expired'` → BLOQUEA
- Si plan pago (`subscription_status = 'active'` y `processes_limit ≠ null`):
  - Cuenta procesos con `status = 'active'`
  - Excluye el proceso que se está reactivando del conteo
  - Compara `currentCount >= processes_limit` → BLOQUEA si alcanzó límite
- Si trial o corporate (`processes_limit = null`) → PERMITE

#### 2. `api/process.ts`
Endpoint consolidado que maneja todas las operaciones de procesos:
- **POST** → Crear proceso (valida límites)
- **PATCH** → Actualizar status (valida límites al reactivar)
- **DELETE** → Eliminar proceso

**Validación crítica al reactivar (líneas 195-211):**
```typescript
// Si se está reactivando (closed/paused → active), validar límites
if (status === 'active' && process.status !== 'active') {
  const validation = await validateProcessLimit(recruiterId, processId);

  if (!validation.canProceed) {
    return res.status(403).json({
      success: false,
      error: validation.error,
      reason: validation.reason
    });
  }
}
```

---

### **Archivos Actualizados:**

#### 3. `src/recruiter/services/processService.ts`
- `createProcess()` → Ahora llama a `/api/process` (POST)
- `updateProcessStatus()` → Ahora llama a `/api/process` (PATCH) y recibe `recruiterId` como parámetro
- `deleteProcess()` → Ahora llama a `/api/process` (DELETE)

#### 4. `src/recruiter/components/postulations/PostulationsTable.tsx`
- `handleStatusChange()` → Ahora pasa `userProfile.id` a `updateProcessStatus()`

#### 5. `src/recruiter/components/postulations/PostulationDetailView.tsx`
- `handleStatusChange()` → Ahora pasa `process.recruiter_id` a `updateProcessStatus()`

---

### **Archivos Eliminados:**

- ~~`api/create-process.ts`~~ → Consolidado en `api/process.ts`
- ~~`api/delete-process.ts`~~ → Consolidado en `api/process.ts`

**Resultado:** Liberamos 1 slot de función serverless en Vercel (12→11)

---

## ✅ Testing Validado

### **Casos probados en producción:**

1. ✅ **Crear proceso con espacio disponible** → Funciona
2. ✅ **Crear proceso con límite alcanzado** → Bloquea con mensaje de error
3. ✅ **Cerrar proceso** → Funciona
4. ✅ **Pausar proceso** → Funciona
5. ✅ **Reactivar proceso con espacio disponible** → Funciona
6. ✅ **Reactivar proceso con límite alcanzado** → **Bloquea con 403** (bug resuelto)
7. ✅ **Eliminar proceso** → Funciona

### **Mensaje de error mejorado:**
```
"Has alcanzado el límite de procesos activos para tu plan Starter (5/5).
Cierra o pausa un proceso existente, o actualiza tu plan para continuar."
```

### **Logs de Vercel:**
- Los 403 Forbidden observados son **comportamiento esperado** cuando se intenta reactivar con límite alcanzado

---

## 📊 Lógica de Conteo de Límites

### **¿Qué cuenta para el límite?**

| Status | ¿Cuenta para límite? | ¿Puede recibir candidatos? |
|--------|---------------------|---------------------------|
| `active` | ✅ SÍ | ✅ SÍ |
| `paused` | ❌ NO | ❌ NO |
| `closed` | ❌ NO | ❌ NO |

**Solo procesos con `status='active'` cuentan para el límite.**

---

## 🔄 Plan de Rollback

Si se detecta algún problema crítico en producción:

### **Opción 1: Rollback completo (Recomendado)**

```bash
# Revertir ambos commits
git revert 9bcfd39 9dc0f33 --no-edit

# Push a producción
git push origin main

# Vercel desplegará automáticamente los cambios revertidos
```

**Efecto:**
- Restaura endpoints `api/create-process.ts` y `api/delete-process.ts`
- Elimina validación de límites al reactivar (vuelve al comportamiento original con bug)
- Vuelve a tener 12 funciones serverless

---

### **Opción 2: Rollback parcial (Solo mensaje)**

Si el único problema es el mensaje de error:

```bash
# Revertir solo el commit del mensaje
git revert 9bcfd39 --no-edit
git push origin main
```

---

### **Opción 3: Hot-fix manual**

Si necesitas un fix rápido sin revertir todo:

1. Identificar el problema específico
2. Hacer cambio quirúrgico en el archivo afectado
3. Commit con prefijo `hotfix:`
4. Push directo a `main`

---

## 🎯 Comportamiento al Pasar de Trial a Plan Pago

**Escenario:**
Usuario en trial con 10 procesos activos → Se suscribe a plan Starter (límite: 5)

**Resultado:**
- ✅ Usuario mantiene los 10 procesos activos existentes
- ❌ NO puede crear nuevos procesos hasta cerrar/pausar 5
- ❌ NO puede reactivar procesos cerrados/pausados hasta tener espacio

**Filosofía:** Permisivo - no rompemos procesos existentes del usuario

---

## 📈 Métricas de Éxito

- ✅ Bug crítico resuelto
- ✅ Arquitectura mejorada (endpoint consolidado)
- ✅ 1 slot de función serverless liberado
- ✅ Lógica de validación centralizada
- ✅ Testing exitoso en producción
- ✅ Sin regresiones detectadas

---

## 👥 Créditos

**Desarrollado por:** Claude Code (Claude Sonnet 4.5)
**Product Owner:** Guillermo Figueroa
**Testing:** Validado en producción con cuenta de plan pago

---

## 📚 Referencias

**Commits:**
- `9dc0f33` - Consolidar endpoints y agregar validación de límites
- `9bcfd39` - Mejorar mensaje de error de límites

**Archivos clave:**
- `api/_utils/subscription.ts` - Validación de límites
- `api/process.ts` - Endpoint consolidado
- `src/recruiter/services/processService.ts` - Cliente del endpoint

**Documentación relacionada:**
- `SUBSCRIPTION_SYSTEM_ROADMAP.md` - Roadmap del sistema de suscripciones
