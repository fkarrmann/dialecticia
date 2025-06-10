# PROBLEMAS PENDIENTES - MODAL DE EXPORTACIÓN

**Fecha de creación:** 3 de Diciembre 2025
**Estado:** PENDIENTES DE RESOLUCIÓN
**Backup creado:** `Dialecticia-backup-20250603-151152.zip`

## RESUMEN EJECUTIVO

A pesar de múltiples intentos de resolución, el modal de exportación (`ExportProgressModal`) presenta **2 problemas críticos persistentes** que requieren investigación adicional.

## PROBLEMAS IDENTIFICADOS

### 🔴 PROBLEMA 1: Z-INDEX INSUFICIENTE
**Descripción:** El modal de progreso de exportación aparece detrás de otros elementos de la UI en lugar de estar en primer plano.

**Síntomas:**
- Modal visible pero parcialmente oculto por otros componentes
- Usuario puede interactuar con elementos de fondo mientras el modal está activo
- UX confusa durante el proceso de exportación

**Intentos de solución implementados:**
- ✅ Z-index configurado al máximo CSS (`2147483647`)
- ✅ Estilos inline para evitar problemas de especificidad CSS
- ✅ Positioning explícito con `position: fixed`

**Estado:** **PERSISTENTE** - El problema continúa a pesar de configuración correcta

### 🔴 PROBLEMA 2: CANCELACIÓN MANUAL INTERPRETADA COMO ERROR
**Descripción:** Cuando el usuario cancela manualmente una exportación, el sistema muestra mensajes de error en lugar de confirmar una cancelación exitosa.

**Síntomas:**
- Usuario hace clic en "Cancelar"
- Se muestra alerta de "Error exportando debate" 
- Experiencia confusa para el usuario

**Intentos de solución implementados:**
- ✅ Implementación de `userCancelledRef` flag
- ✅ Verificación en bloques catch para distinguir cancelación vs error real
- ✅ Lógica de `userCancelledRef.current = true` antes de `abort()`

**Estado:** **PERSISTENTE** - La cancelación sigue siendo reportada como error

## PROBLEMA RAÍZ IDENTIFICADO: CÓDIGO CACHED

### 🟡 HALLAZGO CRÍTICO: ERRORES DE SERVER/CLIENT COMPONENT

Los logs del servidor muestran **errores persistentes** que indican código cached corriendo:

```
⨯ Error: Event handlers cannot be passed to Client Component props.
  <... debateId=... buttonText="" buttonClassName=... onExportError={function onExportError}>
                                                                    ^^^^^^^^^^^^^^^^^^^^^^^^
If you need interactivity, consider converting part of this to a Client Component.
```

**Análisis:**
- La prop `onExportError` **fue completamente eliminada** del código fuente
- Los errores persisten indicando **código cached ejecutándose**
- El problema de espacio en disco fue resuelto pero el cache corrupto persiste

### 🟡 CAUSAS IDENTIFICADAS DEL CACHE CORRUPTO

1. **Crisis de espacio en disco anterior** - Drive al 99% de capacidad
2. **ENOSPC errors durante compilación** - Archivos Next.js corruptos
3. **Cache de Turbopack corrompido** - Archivos `.next` incompletos
4. **Race conditions** durante escritura de archivos por falta de espacio

## ARQUITECTURA ACTUAL

### Archivos involucrados:
```
src/components/ui/ExportProgressModal.tsx
src/components/debate/DebateActions.tsx  
src/components/debate/DebateChat.tsx
src/app/page.tsx
```

### Estado del modal actual:
```typescript
// ExportProgressModal.tsx - CONFIGURACIÓN ACTUAL
export interface ExportProgressModalProps {
  // ✅ onExportError ELIMINADA completamente
  onExportStart: () => void
  onExportComplete: (result: { blob: Blob; filename: string }) => void  
  onExportCancel: () => void
}

// Z-index configuration
style={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 2147483647, // ✅ MÁXIMO VALOR CSS
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
```

### Lógica de cancelación actual:
```typescript
// ✅ IMPLEMENTADA - Flag para distinguir cancelación manual
const userCancelledRef = useRef(false)

const handleCancel = () => {
  userCancelledRef.current = true  // ✅ Set ANTES de abort
  if (abortControllerRef.current) {
    abortControllerRef.current.abort()
  }
}

// ✅ IMPLEMENTADA - Verificación en catch blocks
catch (error) {
  if (userCancelledRef.current) {
    // NO mostrar error para cancelación manual
    return
  }
  // Solo mostrar error para errores reales
  alert('Error durante la exportación')
}
```

## ESTRATEGIAS DE RESOLUCIÓN RECOMENDADAS

### 🔧 PASO 1: LIMPIEZA PROFUNDA DE CACHE
```bash
# Parar todos los procesos
pkill -f "next dev"

# Limpieza completa de caches
rm -rf .next
rm -rf node_modules/.cache  
rm -rf node_modules/.next
rm -rf .turbo

# Limpiar cache de npm
npm cache clean --force

# Reinstalar dependencias
rm -rf node_modules
npm install

# Compilación limpia
npm run build
npm run dev
```

### 🔧 PASO 2: VERIFICACIÓN DE INTEGRIDAD DE ARCHIVOS
- Verificar que no existe `onExportError` en NINGÚN archivo
- Confirmar que todas las props están correctamente tipadas
- Validar que no hay imports corruptos

### 🔧 PASO 3: DEBUGGING ESPECÍFICO
```typescript
// Agregar logs detallados para debugging
console.log('[EXPORT_MODAL] Z-index aplicado:', zIndex)
console.log('[EXPORT_MODAL] User cancelled:', userCancelledRef.current)
console.log('[EXPORT_MODAL] Error type:', error.name)
```

### 🔧 PASO 4: ALTERNATIVAS SI PERSISTE
- Recrear `ExportProgressModal.tsx` desde cero
- Implementar modal con librería externa (React Modal, Radix)
- Separar lógica de exportación del modal visual

## CONFIGURACIÓN DE DESARROLLO

### Puerto utilizado:
```bash
npm run dev  # Puerto 3001 (configurado en package.json)
```

### Comando de inicio limpio recomendado:
```bash
pkill -f "next dev" 2>/dev/null || true && \
rm -rf .next && \
sleep 2 && \
npm run dev
```

## PRÓXIMOS PASOS

1. **CRÍTICO:** Resolver cache corrupto con limpieza profunda
2. **ALTO:** Verificar que problemas persisten post-limpieza  
3. **MEDIO:** Implementar logging detallado para debugging
4. **BAJO:** Considerar refactoring completo si las soluciones anteriores fallan

## NOTAS TÉCNICAS

- **Next.js Version:** 15.3.2 (Turbopack)
- **Entorno:** Desarrollo local Puerto 3001
- **Base de datos:** SQLite (dev.db)
- **Última compilación exitosa:** Funcional pero con problemas de UI

---

**Backup disponible en:** `/Volumes/FK T5 2/PROYECTOS/Labo2025/Dialecticia-backup-20250603-151152.zip` 