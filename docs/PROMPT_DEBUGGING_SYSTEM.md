# Sistema de Debugging de Prompts - Dialecticia

## 🎯 **Objetivo**

Sistema completo para debugging y control del ruteo de prompts en la aplicación Dialecticia, permitiendo detectar y diagnosticar problemas cuando los prompts están desactivados o no existen.

## 🛠️ **Implementación**

### **Fecha de Implementación**: 29 de Mayo 2025
### **Backup**: `BACKUP_20250529_161120_PROMPT_DEBUGGING_SYSTEM`

---

## 🔧 **Componentes Modificados**

### **1. LLM Service (`src/lib/llm-service.ts`)**

#### **Cambio Principal**: Fallo inmediato en lugar de fallbacks silenciosos

```typescript
// ANTES: Fallback silencioso
if (!promptTemplate) {
  console.log(`⚠️ No se encontró prompt template para "${request.functionName}", usando configuración por defecto`)
  // Continuaba con configuración por defecto
}

// AHORA: Fallo inmediato para debugging
if (!promptTemplate) {
  console.log(`⚠️ No se encontró prompt template para "${request.functionName}", usando configuración por defecto`)
  throw new Error(`Prompt template "${request.functionName}" no encontrado o está desactivado`)
}
```

#### **Beneficio**: 
- ✅ Detección inmediata de prompts faltantes
- ✅ No hay respuestas genéricas que oculten problemas
- ✅ Logs claros de qué prompt se buscaba

---

### **2. LLM Manager (`src/lib/llm.ts`)**

#### **Detección Mejorada de Errores de Prompts**

```typescript
const isPromptError = errorMessage.includes('no encontrado') || 
                     errorMessage.includes('not found') || 
                     errorMessage.includes('desactivado') ||
                     errorMessage.includes('No se encontró prompt template') ||
                     errorMessage.includes('prompt template') ||
                     errorMessage.includes('Prompt template') ||
                     errorMessage.includes('philosopher_chat_system') ||
                     errorMessage.includes('está desactivado')
```

#### **Identificación del Prompt Específico**

```typescript
// Extraer el nombre del prompt del error si es posible
let promptName = 'desconocido'
if (errorMessage.includes('philosopher_chat_system')) {
  promptName = 'philosopher_chat_system'
} else if (errorMessage.includes('socratic_to_user')) {
  promptName = 'socratic_to_user'
}
// ... etc
```

#### **Error de Debugging Claro**

```typescript
throw new Error(`PROMPT_DEBUGGING_ERROR: Prompt '${promptName}' requerido para ${philosopher.name} está desactivado o no existe`)
```

---

### **3. API Routes (`src/app/api/debates/[id]/messages/route.ts`)**

#### **Manejo Especial de Errores de Debugging**

```typescript
if (errorMessage.includes('PROMPT_DEBUGGING_ERROR:')) {
  console.error('🔥 DEBUGGING ERROR CAUGHT IN API ROUTE:', errorMessage)
  
  const cleanMessage = errorMessage.replace('PROMPT_DEBUGGING_ERROR: ', '')
  
  return NextResponse.json({
    success: false,
    error: 'Error de debugging: Prompt desactivado',
    message: cleanMessage,
    type: 'PROMPT_DEBUGGING_ERROR',
    details: 'Este error es esperado durante debugging. Activa el prompt desde el panel de administración.'
  }, { status: 422 })
}
```

---

### **4. Frontend (`src/components/debate/DebateChat.tsx`)**

#### **Visualización Especial para Errores de Debugging**

```typescript
// Manejo especial para errores de debugging de prompts
if (result.type === 'PROMPT_DEBUGGING_ERROR') {
  setError(`🚨 DEBUG: ${result.message} | ${result.details}`)
} else {
  setError(result.error || 'Error al enviar el mensaje')
}
```

#### **Estilo Visual Diferenciado**

```typescript
<div className={`border px-4 py-3 rounded-lg mb-4 ${
  error.includes('🚨 DEBUG:') 
    ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' // Estilo especial para debug
    : 'bg-red-500/20 border-red-500/50 text-red-400'        // Estilo normal para errores
}`}>
```

---

## 🚀 **Scripts de Utilidad**

### **1. Inicio con Logs Coloreados (`start-dev-with-logs.sh`)**

```bash
#!/bin/bash
echo "🚀 Iniciando servidor de desarrollo con logs detallados..."
# Limpia puerto 3001 y inicia con logs colorados por tipo
npm run dev 2>&1 | while IFS= read -r line; do
    case "$line" in
        *"🤖"*) echo -e "\\033[1;34m$line\\033[0m" ;;           # Azul para filósofos
        *"✅"*) echo -e "\\033[1;32m$line\\033[0m" ;;           # Verde para éxito
        *"❌"*) echo -e "\\033[1;31m$line\\033[0m" ;;           # Rojo para errores
        *"🚨"*) echo -e "\\033[1;91m$line\\033[0m" ;;           # Rojo brillante para debugging
    esac
done
```

### **2. Monitoreo de Logs de Debugging (`watch-debug-logs.sh`)**

```bash
#!/bin/bash
# Filtra solo logs importantes de debugging
npm run dev | grep -E "(🤖|✅|❌|🚨|🔥|📋|🎯|PROMPT|DEBUGGING|Error)" --color=always
```

---

## 📊 **Flujo de Debugging**

### **Escenario: Prompt Desactivado**

1. **Usuario envía mensaje** → API `/api/debates/[id]/messages`
2. **Sistema intenta generar respuesta** → `generatePhilosopherResponse()`
3. **Busca prompt en BD** → `LLMService.getPromptTemplate()`
4. **Prompt no encontrado/desactivado** → `throw Error(...)`
5. **Error detectado como prompt error** → `isPromptError = true`
6. **Error de debugging lanzado** → `PROMPT_DEBUGGING_ERROR`
7. **API captura error de debugging** → Status 422
8. **Frontend muestra error amarillo** → `🚨 DEBUG: Prompt 'X' desactivado`

### **Logs Esperados**

```
🤖 Generating response for Sócrato using NEW DATABASE SYSTEM
🚀 Using new database-driven LLM system...
⚠️ No se encontró prompt template para "philosopher_chat_system"
🚨 PROMPT ERROR DETECTED FOR DEBUGGING:
   🔴 Philosopher: Sócrato
   🔴 Error: Prompt template "philosopher_chat_system" no encontrado o está desactivado
   🔴 This is expected during debugging when prompts are deactivated
🔥 DEBUGGING ERROR CAUGHT IN API ROUTE: PROMPT_DEBUGGING_ERROR: Prompt 'philosopher_chat_system' requerido para Sócrato está desactivado o no existe
```

---

## 🎮 **Uso del Sistema**

### **Para Activar/Desactivar Prompts**:
1. Ir a `/admin/llm-management`
2. Pestaña "Prompts"
3. Usar botón de poder (⚡/⭕) para activar/desactivar

### **Para Ver Logs de Debugging**:
```bash
# Opción 1: Logs con colores
./start-dev-with-logs.sh

# Opción 2: Solo logs de debugging
./watch-debug-logs.sh

# Opción 3: Logs estándar
npm run dev
```

### **Para Probar el Sistema**:
1. Desactivar un prompt crítico (ej: `philosopher_chat_system`)
2. Intentar un debate con cualquier filósofo
3. Verificar que se muestra error de debugging en amarillo
4. Verificar logs detallados en terminal

---

## ✅ **Verificación de Funcionamiento**

### **Síntomas de Sistema Funcionando Correctamente**:

✅ **Cuando prompt está ACTIVO**:
- Logs muestran: `📋 PROMPT DETAILS: ID, Nombre, Versión, Modelo`
- Chat funciona normalmente
- No errores de debugging

✅ **Cuando prompt está DESACTIVADO**:
- Error inmediato sin fallbacks
- Mensaje amarillo en UI: `🚨 DEBUG: Prompt 'X' desactivado`
- Logs claros: `🚨 PROMPT ERROR DETECTED FOR DEBUGGING`
- Status 422 en API

❌ **Señales de Problema**:
- Mock responses cuando debería fallar
- Errores genéricos sin especificar prompt
- Fallbacks silenciosos
- No aparece información de prompt en logs

---

## 🔄 **Rollback**

Para volver al estado anterior:
```bash
# Restaurar desde backup
cp -r docs/backups/BACKUP_20250529_161120_PROMPT_DEBUGGING_SYSTEM/src/* src/
cp -r docs/backups/BACKUP_20250529_161120_PROMPT_DEBUGGING_SYSTEM/prisma/* prisma/
```

---

## 📈 **Beneficios Implementados**

1. **🔍 Debugging Transparente**: Se ve exactamente qué prompt falla
2. **🎯 Errores Específicos**: Cada error indica el prompt exacto que falta
3. **🎨 UI Diferenciada**: Errores de debugging se ven diferentes a errores reales
4. **📊 Logs Detallados**: Información completa de prompts usados
5. **🛠️ Control Total**: Activar/desactivar prompts desde UI
6. **⚡ Detección Inmediata**: No hay fallbacks que oculten problemas

---

## 👥 **Equipo de Desarrollo**

- **Implementado por**: Claude Sonnet 4 + Federico
- **Fecha**: 29 de Mayo 2025
- **Versión del Sistema**: v1.0 - Prompt Debugging Complete 