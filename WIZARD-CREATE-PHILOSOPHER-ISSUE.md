# 🔧 PROBLEMA: Wizard de Crear Filósofo No Funciona en Vercel

## 📋 RESUMEN DEL PROBLEMA

La aplicación **Dialecticia** (https://dialecticia.vercel.app/) tiene un problema crítico: **el wizard para crear nuevos filósofos/pensadores no se completa**. El proceso se queda colgado en la generación del perfil filosófico y nunca termina.

## 🌐 CONTEXTO DE LA APLICACIÓN

- **Aplicación**: Dialecticia - Plataforma de debates filosóficos con IA
- **URL Producción**: https://dialecticia.vercel.app/
- **Repo**: /Volumes/FK T5 2/PROYECTOS/Labo2025/Dialecticia
- **Base de Datos**: PostgreSQL en Vercel (migrado desde SQLite)
- **Framework**: Next.js 15.3.2 con Prisma
- **Despliegue**: Vercel (auto-deploy desde GitHub main)

## 🎯 PROBLEMA ESPECÍFICO

### Síntomas Observados
```javascript
// Logs del navegador en el wizard:
📊 Estado de página 5: {hasCompleteForm: true, hasGeneratedProfile: false, needsRegeneration: true, isGenerating: true, attributesCount: 5, …}
⏳ Ya generando perfil...
📊 Estado de página 5: {hasCompleteForm: true, hasGeneratedProfile: false, needsRegeneration: true, isGenerating: false, attributesCount: 5, …}
🎯 Mostrando botón "Generar Perfil Filosófico" - SIN auto-generación
```

### Flujo Que Falla
1. Usuario completa pasos 1-4 del wizard ✅
2. Llega a página 5 (Generación de Perfil) ✅  
3. Presiona "Generar Perfil Filosófico" ✅
4. El estado cambia a `isGenerating: true` ✅
5. **AQUÍ SE CUELGA** - Nunca completa la generación ❌
6. Vuelve a `isGenerating: false` sin resultado ❌

## 🔍 DIAGNÓSTICO TÉCNICO

### Archivos Involucrados en el Problema

#### 1. Frontend: Wizard Component
```
src/components/philosopher/PhilosopherWizard.tsx
```
- Función `generateFinalResult()` (línea ~640-690)
- Hace llamada POST a `/api/admin/philosophers/generate-final-result`

#### 2. Backend: API Endpoint Principal
```
src/app/api/admin/philosophers/generate-final-result/route.ts
```
- **PROBLEMA IDENTIFICADO**: Hace llamadas internas a `localhost:3001` (líneas 197, 227)
- **SOLUCIÓN APLICADA**: Cambiado a usar `process.env.NEXTAUTH_URL || 'http://localhost:3002'`

#### 3. Backend: API Endpoint de Generación LLM
```
src/app/api/admin/llm/generate-field/route.ts
```
- **PROBLEMA IDENTIFICADO**: Usa campos incorrectos del esquema Prisma
- **PROBLEMA**: `systemPrompt` → debe ser `template`
- **PROBLEMA**: Intenta acceder a `model` que no existe en `PromptTemplate`

#### 4. Servicio LLM
```
src/lib/llm-service.ts
```
- **PROBLEMA CRÍTICO**: Incompatibilidad total con esquema Prisma actual
- Intenta usar relaciones que no existen (`promptTemplate.model`)

## 🏗️ ESQUEMA DE BASE DE DATOS ACTUAL

### Modelos Relevantes (Prisma Schema)
```prisma
model PromptTemplate {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  template    String   // ⚠️ NO "systemPrompt"
  category    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  // ⚠️ NO tiene relación directa con LLMModel
}

model LLMConfiguration {
  id               String   @id @default(cuid())
  promptTemplateId String?  // Relación opcional
  providerId       String
  modelId          String
  isActive         Boolean  @default(true)
  // ... otros campos
}

model LLMProvider {
  id          String @id @default(cuid())
  name        String @unique
  displayName String
  // ⚠️ NO "apiKeyEncrypted" - tiene "apiKey"
}

model LLMModel {
  id          String @id @default(cuid())
  name        String
  displayName String
  providerId  String
  // ... otros campos
}
```

## 🚨 CAMBIOS YA APLICADOS (Pero Aún No Funcionan)

### ✅ Commits Realizados
1. **Fix wizard create philosopher: correct localhost URLs and Prisma schema fields**
   - Corregido URLs `localhost:3001` → usar variables de entorno
   - Cambiado `systemPrompt` → `template` en generate-final-result

2. **Fix generate-field endpoint: correct Prisma schema field references**
   - Corregido `systemPrompt` → `template` en generate-field
   - Eliminado `include` de relaciones que no existen

### ❌ PROBLEMAS PENDIENTES

#### A. Servicio LLM Roto (`src/lib/llm-service.ts`)
```typescript
// ❌ LÍNEAS PROBLEMÁTICAS:
model = promptTemplate.model  // model NO EXISTE en PromptTemplate
provider = model.provider     // Relación no existe
apiKey = provider.apiKeyEncrypted  // Campo no existe (es "apiKey")
```

#### B. Falta Lógica de Configuración LLM
El código necesita:
1. Buscar `LLMConfiguration` activa para el prompt
2. Obtener `LLMProvider` y `LLMModel` desde la configuración
3. Usar la API key correcta del provider

#### C. Configuración de Environment Variables
- En Vercel: usar `NEXTAUTH_URL` para calls internos
- En local: problema con `DATABASE_POSTGRES_PRISMA_URL` not found

## 🎯 SOLUCIÓN REQUERIDA

### 1. Arreglar Servicio LLM Correctamente
```typescript
// Patrón correcto a implementar:
const configuration = await prisma.lLMConfiguration.findFirst({
  where: { 
    promptTemplateId: promptTemplate.id,
    isActive: true 
  },
  include: {
    provider: true,
    model: true
  }
})
```

### 2. Manejar Fallbacks
- Si no hay configuración específica, usar configuración por defecto
- Priorizar OpenAI como fallback si está configurado

### 3. Testing
- Probar el wizard completo en https://dialecticia.vercel.app/
- Código de acceso admin: `REAL-DATA-IMPORTED-2024`

## 📁 ESTRUCTURA DE ARCHIVOS CLAVE

```
src/
├── app/api/admin/philosophers/
│   └── generate-final-result/route.ts     # Endpoint principal
├── app/api/admin/llm/
│   └── generate-field/route.ts            # Generación LLM
├── components/philosopher/
│   └── PhilosopherWizard.tsx              # Frontend wizard
├── lib/
│   ├── llm-service.ts                     # ⚠️ ROTO - Servicio LLM
│   └── db.ts                              # Cliente Prisma
└── prisma/
    └── schema.prisma                      # Esquema de BD
```

## 🔄 FLUJO CORRECTO ESPERADO

1. **Wizard Frontend** → POST `/api/admin/philosophers/generate-final-result`
2. **generate-final-result** → POST `/api/admin/llm/generate-field` (argumentStyle)
3. **generate-final-result** → POST `/api/admin/llm/generate-field` (coreBeliefs)  
4. **generate-field** → Usa `llm-service.ts` para llamar OpenAI
5. **llm-service** → Busca configuración LLM correcta
6. **llm-service** → Ejecuta prompt con OpenAI API
7. **Resultado** → Se guarda el filósofo en BD

## 🚨 URGENCIA

- **Prioridad**: CRÍTICA
- **Impacto**: Los usuarios no pueden crear nuevos filósofos
- **Entorno**: Producción en Vercel
- **Deadline**: ASAP

## 💡 NOTAS IMPORTANTES

- **NO crear archivos temporales o hacks**
- **SÍ usar el esquema Prisma correcto con LLMConfiguration**  
- **SÍ hacer commits y push para desplegar en Vercel**
- **SÍ probar en https://dialecticia.vercel.app/ después de cada fix**

---

**OBJETIVO**: Que el wizard de crear filósofos funcione completamente desde https://dialecticia.vercel.app/admin/ 