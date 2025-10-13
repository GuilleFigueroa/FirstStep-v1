# 📄 Implementación de Paginación - FirstStep

> **Documento de tracking para implementación de paginación en CandidatesTable**
>
> **Fecha creación:** 13-10-2025
> **Prioridad:** 🔴 CRÍTICA
> **Tiempo estimado:** 2.5 horas
> **Estado:** ⏳ PENDIENTE

---

## 🎯 Objetivo

Implementar paginación server-side en `CandidatesTable.tsx` para prevenir crashes del browser cuando hay >100 candidatos.

### Problema Actual

```typescript
// candidateService.ts:219-224
const { data: candidates } = await supabase
  .from('candidates')
  .select('*')
  .in('process_id', processIds)  // 🔴 SIN LÍMITE - Trae TODOS los registros
```

**Escenario crítico:**
- Reclutador con 5 procesos
- 200 candidatos por proceso = 1000 registros
- Frontend renderiza 1000 filas → Browser crashea ❌

---

## 📋 Plan de Implementación

### **FASE 1: Backend (Servicio)** ⏳ PENDIENTE
**Tiempo:** 1 hora
**Archivos:** `src/shared/services/candidateService.ts`

- [ ] **Paso 1.1:** Agregar interface `PaginationOptions` (15 min)
- [ ] **Paso 1.2:** Modificar firma de `getCandidatesByRecruiter()` (15 min)
- [ ] **Paso 1.3:** Implementar conteo total con `{ count: 'exact' }` (15 min)
- [ ] **Paso 1.4:** Agregar `.range(from, to)` en query de candidatos (15 min)
- [ ] **Paso 1.5:** Retornar metadata de paginación (15 min)
- [ ] **Paso 1.6:** Testing con console.log (15 min)

---

### **FASE 2: Componente de Paginación** ⏳ PENDIENTE
**Tiempo:** 30 minutos
**Archivos:** `src/ui/components/ui/pagination-controls.tsx` (NUEVO)

- [ ] **Paso 2.1:** Crear archivo `pagination-controls.tsx` (5 min)
- [ ] **Paso 2.2:** Implementar interface `PaginationControlsProps` (5 min)
- [ ] **Paso 2.3:** Implementar UI de botones Anterior/Siguiente (10 min)
- [ ] **Paso 2.4:** Agregar display "Mostrando X-Y de Z" (5 min)
- [ ] **Paso 2.5:** Agregar disabled states (5 min)

---

### **FASE 3: Integración en CandidatesTable** ⏳ PENDIENTE
**Tiempo:** 1 hora
**Archivos:** `src/recruiter/components/candidates/CandidatesTable.tsx`

- [ ] **Paso 3.1:** Importar `PaginationControls` (2 min)
- [ ] **Paso 3.2:** Agregar estado `currentPage` (5 min)
- [ ] **Paso 3.3:** Agregar estado `pagination` (metadata) (5 min)
- [ ] **Paso 3.4:** Modificar llamada a `getCandidatesByRecruiter()` con opciones (10 min)
- [ ] **Paso 3.5:** Guardar metadata de paginación en estado (5 min)
- [ ] **Paso 3.6:** Agregar `currentPage` como dependency en useEffect (5 min)
- [ ] **Paso 3.7:** Crear handler `handlePageChange()` (10 min)
- [ ] **Paso 3.8:** Insertar componente `<PaginationControls>` en UI (5 min)
- [ ] **Paso 3.9:** Agregar scroll automático al cambiar página (5 min)
- [ ] **Paso 3.10:** Verificar que funcione con filtros existentes (10 min)

---

### **FASE 4: Testing y Ajustes** ⏳ PENDIENTE
**Tiempo:** 30 minutos

- [ ] **Paso 4.1:** Compilar con `npm run build` (5 min)
- [ ] **Paso 4.2:** Testing con 0 candidatos → No mostrar paginación (5 min)
- [ ] **Paso 4.3:** Testing con 1-50 candidatos → No mostrar paginación (5 min)
- [ ] **Paso 4.4:** Testing con 51+ candidatos → Mostrar paginación (5 min)
- [ ] **Paso 4.5:** Testing navegación entre páginas (5 min)
- [ ] **Paso 4.6:** Verificar botones disabled en primera/última página (5 min)

---

## 🛠️ Implementación Detallada

### **FASE 1: Backend (Servicio)**

#### Paso 1.1-1.2: Modificar Servicio

**Archivo:** `src/shared/services/candidateService.ts`

**Ubicación:** Línea 172 (antes de `getCandidatesByRecruiter`)

**AGREGAR:**
```typescript
interface PaginationOptions {
  page?: number;      // Número de página (0-indexed)
  limit?: number;     // Registros por página (default: 50)
}
```

**Ubicación:** Línea 172 (modificar firma del método)

**CAMBIAR DE:**
```typescript
static async getCandidatesByRecruiter(recruiterId: string): Promise<{
  success: boolean;
  candidates?: Array<{...}>;
  error?: string;
}>
```

**CAMBIAR A:**
```typescript
static async getCandidatesByRecruiter(
  recruiterId: string,
  options?: PaginationOptions
): Promise<{
  success: boolean;
  candidates?: Array<{...}>;
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
  error?: string;
}>
```

#### Paso 1.3-1.5: Implementar Paginación

**Ubicación:** Línea 193 (inicio del método)

**AGREGAR al inicio:**
```typescript
try {
  const { page = 0, limit = 50 } = options || {};
  const from = page * limit;
  const to = from + limit - 1;
```

**Ubicación:** Línea 208-214 (después de obtener processes)

**AGREGAR antes de obtener candidatos:**
```typescript
if (!processes || processes.length === 0) {
  return {
    success: true,
    candidates: [],
    pagination: {
      page: 0,
      limit,
      totalCount: 0,
      totalPages: 0,
      hasMore: false
    }
  };
}

const processIds = processes.map(p => p.id);

// 2. Obtener conteo total (para calcular páginas)
const { count: totalCount, error: countError } = await supabase
  .from('candidates')
  .select('*', { count: 'exact', head: true })
  .in('process_id', processIds)
  .in('status', ['completed', 'rejected']);

if (countError) {
  console.error('Error fetching candidate count:', countError);
  return { success: false, error: 'Error al contar candidatos' };
}
```

**Ubicación:** Línea 219-224 (query de candidatos)

**CAMBIAR DE:**
```typescript
const { data: candidates, error: candidatesError } = await supabase
  .from('candidates')
  .select('*')
  .in('process_id', processIds)
  .in('status', ['completed', 'rejected'])
  .order('created_at', { ascending: false });
```

**CAMBIAR A:**
```typescript
// 3. Obtener candidatos paginados
const { data: candidates, error: candidatesError } = await supabase
  .from('candidates')
  .select('*')
  .in('process_id', processIds)
  .in('status', ['completed', 'rejected'])
  .order('created_at', { ascending: false })
  .range(from, to);  // ← PAGINACIÓN
```

**Ubicación:** Línea 257-262 (antes del return final)

**CAMBIAR DE:**
```typescript
return {
  success: true,
  candidates: candidatesWithProcess
};
```

**CAMBIAR A:**
```typescript
// 5. Retornar con metadatos de paginación
const totalPages = Math.ceil((totalCount || 0) / limit);

return {
  success: true,
  candidates: candidatesWithProcess,
  pagination: {
    page,
    limit,
    totalCount: totalCount || 0,
    totalPages,
    hasMore: page < totalPages - 1
  }
};
```

---

### **FASE 2: Componente de Paginación**

#### Paso 2.1-2.5: Crear Componente Reutilizable

**Archivo NUEVO:** `src/ui/components/ui/pagination-controls.tsx`

**Contenido completo:**
```typescript
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  loading = false
}: PaginationControlsProps) {
  const startIndex = currentPage * pageSize + 1;
  const endIndex = Math.min((currentPage + 1) * pageSize, totalCount);

  // No mostrar si no hay resultados
  if (totalCount === 0) return null;

  // No mostrar si solo hay una página
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2 py-4 border-t">
      {/* Información de resultados */}
      <div className="text-sm text-gray-700">
        Mostrando <span className="font-medium">{startIndex}</span> a{' '}
        <span className="font-medium">{endIndex}</span> de{' '}
        <span className="font-medium">{totalCount}</span> resultados
      </div>

      {/* Controles de navegación */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0 || loading}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>

        <div className="text-sm text-gray-700">
          Página <span className="font-medium">{currentPage + 1}</span> de{' '}
          <span className="font-medium">{totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1 || loading}
        >
          Siguiente
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
```

---

### **FASE 3: Integración en CandidatesTable**

#### Paso 3.1-3.3: Modificar Imports y Estado

**Archivo:** `src/recruiter/components/candidates/CandidatesTable.tsx`

**Ubicación:** Línea 12 (después de otros imports)

**AGREGAR:**
```typescript
import { PaginationControls } from '../../../ui/components/ui/pagination-controls';
```

**Ubicación:** Línea 61 (después de `const [profileViewCandidate, setProfileViewCandidate] = ...`)

**AGREGAR:**
```typescript
// Estado de paginación
const [currentPage, setCurrentPage] = useState(0);
const [pagination, setPagination] = useState({
  totalCount: 0,
  totalPages: 0,
  hasMore: false
});
```

#### Paso 3.4-3.6: Modificar loadCandidates

**Ubicación:** Línea 80 (dentro de `loadCandidates`)

**CAMBIAR DE:**
```typescript
const result = await CandidateService.getCandidatesByRecruiter(recruiterId);
```

**CAMBIAR A:**
```typescript
const result = await CandidateService.getCandidatesByRecruiter(
  recruiterId,
  { page: currentPage, limit: 50 }  // ← AGREGAR OPCIONES DE PAGINACIÓN
);
```

**Ubicación:** Línea 96 (después de `setCandidates(candidatesWithDefaults);`)

**AGREGAR:**
```typescript
// Guardar metadatos de paginación
if (result.pagination) {
  setPagination(result.pagination);
}
```

**Ubicación:** Línea 107 (useEffect dependencies)

**CAMBIAR DE:**
```typescript
}, [recruiterId]);
```

**CAMBIAR A:**
```typescript
}, [recruiterId, currentPage]);  // ← AGREGAR currentPage
```

#### Paso 3.7-3.9: Agregar Handler y UI

**Ubicación:** Línea 137 (después de `handleRetry`)

**AGREGAR:**
```typescript
// Handler para cambio de página
const handlePageChange = (newPage: number) => {
  setCurrentPage(newPage);
  // Scroll suave al inicio de la tabla
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
```

**Ubicación:** Línea 469 (después de `</Table>` y `</div>`, dentro de `<CardContent>`)

**AGREGAR antes del mensaje "Mensaje cuando hay candidatos pero los filtros no coinciden":**
```typescript
              </Table>
            </div>
          )}

          {/* Paginación */}
          {!loading && !error && candidates.length > 0 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              pageSize={50}
              onPageChange={handlePageChange}
              loading={loading}
            />
          )}

          {/* Mensaje cuando hay candidatos pero los filtros no coinciden */}
```

---

## ✅ Checklist de Verificación

### Backend
- [ ] Interface `PaginationOptions` definida
- [ ] Método `getCandidatesByRecruiter()` acepta `options?: PaginationOptions`
- [ ] Query usa `.range(from, to)` para limitar resultados
- [ ] Conteo total implementado con `{ count: 'exact', head: true }`
- [ ] Retorna objeto `pagination` con metadata
- [ ] Tipos TypeScript actualizados en return type

### Frontend - Componente
- [ ] Archivo `pagination-controls.tsx` creado
- [ ] Interface `PaginationControlsProps` definida
- [ ] Botones Anterior/Siguiente implementados
- [ ] Display "Mostrando X-Y de Z" funcional
- [ ] Estados disabled correctos (primera/última página)
- [ ] No se muestra si `totalPages <= 1`

### Frontend - Integración
- [ ] Import de `PaginationControls` agregado
- [ ] Estado `currentPage` inicializado en 0
- [ ] Estado `pagination` inicializado
- [ ] Llamada a servicio incluye `{ page, limit }`
- [ ] Metadata de paginación se guarda en estado
- [ ] `currentPage` agregado a dependencies de useEffect
- [ ] Handler `handlePageChange()` implementado
- [ ] Componente `<PaginationControls>` insertado en UI
- [ ] Scroll automático al cambiar página

### Testing
- [ ] Compilación exitosa (`npm run build`)
- [ ] Funciona con 0 candidatos (no muestra paginación)
- [ ] Funciona con 1-50 candidatos (no muestra paginación)
- [ ] Funciona con 51+ candidatos (muestra paginación)
- [ ] Navegación entre páginas funcional
- [ ] Botón "Anterior" disabled en página 1
- [ ] Botón "Siguiente" disabled en última página
- [ ] Filtros siguen funcionando (client-side sobre página actual)
- [ ] No hay errores en consola
- [ ] Performance: <200ms para cargar página

---

## 📊 Resultados Esperados

### Antes de Paginación
```
Reclutador con 500 candidatos:
- Query trae 500 registros (2MB)
- Browser renderiza 500 filas
- Tiempo: ~2000ms
- Resultado: Browser lag/crash ❌
```

### Después de Paginación
```
Reclutador con 500 candidatos:
- Query trae 50 registros (200KB)
- Browser renderiza 50 filas
- Tiempo: ~150ms
- Resultado: App rápida y estable ✅

Navegación:
- Página 1: 1-50 de 500
- Página 2: 51-100 de 500
- ...
- Página 10: 451-500 de 500
```

---

## 🚨 Consideraciones Importantes

### Filtros y Paginación

**Decisión:** Filtros client-side (recomendado para MVP)

Los filtros por nombre, puesto, empresa aplicarán SOLO sobre los 50 registros de la página actual.

**Implicación:**
- Usuario en página 1 filtra por "Juan" → Solo busca en candidatos 1-50
- Si "Juan" está en candidato 51, no aparecerá
- **Solución post-MVP:** Implementar filtros server-side (requiere más cambios)

**Código actual NO requiere cambios** (filtros ya son client-side):
```typescript
// CandidatesTable.tsx:139-148 - Mantener como está
const filteredCandidates = candidates.filter(candidate => {
  const fullName = `${candidate.first_name} ${candidate.last_name}`.toLowerCase();
  const matchesName = fullName.includes(nameFilter.toLowerCase());
  const matchesPosition = candidate.process_title.toLowerCase().includes(positionFilter.toLowerCase());
  const matchesCompany = candidate.process_company.toLowerCase().includes(companyFilter.toLowerCase());
  const matchesStatus = statusFilter === 'all' || candidate.process_status === statusFilter;
  const matchesProcess = !processFilter || candidate.process_id === processFilter;

  return matchesName && matchesPosition && matchesCompany && matchesStatus && matchesProcess;
});
```

### Performance

**Métricas objetivo:**
- Query backend: <100ms
- Render frontend: <100ms
- Total time to interactive: <200ms

**Comparación:**
| Métrica | Sin Paginación (500 registros) | Con Paginación (50 registros) |
|---------|--------------------------------|-------------------------------|
| Query time | ~200ms | ~50ms |
| Render time | ~2000ms | ~100ms |
| Total | ~2200ms ❌ | ~150ms ✅ |

---

## 📝 Notas de Desarrollo

### Decisiones Técnicas

1. **¿Por qué 50 registros por página?**
   - Balance entre UX (no hacer demasiados clicks) y performance
   - 50 filas renderizadas = smooth scrolling
   - Puede ajustarse a 25 o 100 si es necesario

2. **¿Por qué server-side pagination?**
   - Client-side: Trae 500 registros → Filtras en memoria (desperdicio)
   - Server-side: Trae 50 registros → Query optimizado ✅

3. **¿Por qué no infinite scroll?**
   - Paginación es más simple de implementar (2.5 horas)
   - Infinite scroll requiere virtualización (6-8 horas)
   - Para MVP, paginación es suficiente

### Posibles Mejoras Futuras

- [ ] Selector de tamaño de página (25/50/100)
- [ ] Salto directo a página N
- [ ] Infinite scroll con virtualización
- [ ] Filtros server-side con debounce
- [ ] Persistir página en URL (?page=2)
- [ ] Loading skeletons durante carga

---

## 🐛 Troubleshooting

### Problema: "Paginación no aparece"
**Causa:** `totalPages <= 1` o `totalCount === 0`
**Solución:** Verificar que hay >50 candidatos en BD

### Problema: "Botones no funcionan"
**Causa:** Handler `onPageChange` no conectado
**Solución:** Verificar que `handlePageChange` está pasado a `<PaginationControls>`

### Problema: "Página cambia pero datos no"
**Causa:** `currentPage` no está en dependencies de useEffect
**Solución:** Agregar `currentPage` a array de dependencies

### Problema: "Error 'range' is not a function"
**Causa:** Versión antigua de Supabase client
**Solución:** Actualizar `@supabase/supabase-js` a versión >2.0

### Problema: "Filtros no funcionan después de paginar"
**Causa:** Filtros intentan buscar en todos los registros (no solo página actual)
**Solución:** Mantener filtros client-side (buscan solo en página actual)

---

## 📚 Referencias

- [Supabase Pagination Docs](https://supabase.com/docs/reference/javascript/range)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [TypeScript Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

---

**Estado final:** ⏳ PENDIENTE
**Próximo paso:** Iniciar FASE 1 - Backend (Servicio)
**Última actualización:** 13-10-2025
