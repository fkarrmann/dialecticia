# 🔧 Dialecticia - Estado de Debugging y Corrección de Errores

## 📊 Estado Actual del Sistema

### ✅ Problemas Resueltos

#### 1. **Error "Endpoint temporarily disabled - schema mismatch"**
- **Problema**: Endpoints de administración LLM deshabilitados por incompatibilidad de schema
- **Causa**: Frontend esperaba campos diferentes a los del schema de base de datos
- **Solución**: Mapeo de campos entre frontend y database schema
- **Archivos modificados**:
  - `src/app/api/admin/llm/prompts/[id]/route.ts` - Habilitado PUT/DELETE
  - `src/app/api/admin/llm/prompts/route.ts` - Habilitado POST
  - `src/app/api/admin/llm/models/route.ts` - Habilitado POST

#### 2. **TypeError: Cannot read properties of undefined (reading 'interactions')**
- **Problema**: Acceso no seguro a `_count.interactions` en componentes React
- **Causa**: Componentes accedían directamente sin verificar si `_count` existe
- **Solución**: Agregado safe navigation (`?.`) y fallbacks (`|| 0`)
- **Archivos modificados**:
  - `src/components/admin/LLMProvidersManager.tsx`
  - `src/components/admin/LLMPromptsManager.tsx`

#### 3. **Campos faltantes en respuestas de API**
- **Problema**: APIs no devolvían campo `_count` esperado por frontend
- **Causa**: Queries de Prisma no incluían `_count` con `interactions`
- **Solución**: Agregado `_count` a todas las queries relevantes
- **Archivos modificados**:
  - `src/app/api/admin/llm/prompts/route.ts`
  - `src/app/api/admin/llm/providers/route.ts`
  - `src/app/api/admin/llm/models/route.ts`

#### 4. **Error "Error interno del servidor" en selección de antagonista**
- **Problema**: Función de seleccionar antagonista fallaba con error interno
- **Causa**: Mismatch entre campos del prompt template y código de parsing
  - Prompt devuelve: `suggestedPhilosopher` (nombre del filósofo)
  - Código esperaba: `suggestedPhilosopherId` (ID del filósofo)
- **Solución**: Corregido parsing para buscar por nombre y mapear a ID
- **Archivos modificados**:
  - `src/lib/llm.ts` - Función `selectAntagonisticPhilosopher`

#### 5. **Error "undefined" en generación de nuevos pensadores**
- **Problema**: Al generar nuevos filósofos, el campo "Descripción Filosófica" mostraba variables sin reemplazar como `DESCRIPCION: [falta completar]`, `ESTILO_ARGUMENTATIVO: [falta completar]`, `ENFOQUE_CUESTIONAMIENTO: [falta completar]`
- **Causa**: Desalineación entre las variables del prompt template en la base de datos y las variables que se reemplazaban en el código:
  - BD: `{DESCRIPCION}` (sin tilde) vs Código: `{DESCRIPCIÓN}` (con tilde)
  - BD: `{ESTILO_ARGUMENTATIVO}` vs Código: `{ESTILO_ARGUMENTACION}`
  - BD: `{ENFOQUE_CUESTIONAMIENTO}` vs Código: No se reemplazaba
- **Solución**: Agregado soporte para todas las variables del prompt template de BD, manteniendo compatibilidad con versiones anteriores
- **Archivos modificados**:
  - `src/app/api/admin/philosophers/generate-final-result/route.ts` - Función `generateDescription`

#### 6. **Formato incorrecto de descripción y error en creación de filósofos**
- **Problema**: 
  1. La descripción filosófica llegaba con formato JSON + texto en lugar de solo texto natural
  2. Error al crear el filósofo por mapeo incorrecto de datos (`personalityTraits` vs `personalityScores`)
- **Causa**: 
  1. El LLM devolvía respuestas mixtas con JSON y texto, sin limpieza adecuada
  2. El frontend enviaba `personalityTraits` pero el API esperaba `personalityScores`
- **Solución**: 
  1. Agregada limpieza avanzada de formato JSON/markdown en descripciones
  2. Corregido mapeo de datos en `handleCreatePhilosopher`
  3. Agregadas validaciones y fallbacks para descripciones muy cortas
- **Archivos modificados**:
  - `src/app/api/admin/philosophers/generate-final-result/route.ts` - Función `generateDescription`
  - `src/app/philosophers/page.tsx` - Función `handleCreatePhilosopher`

#### 7. **Fallbacks en creencias fundamentales y error en creación final**
- **Problema**: 
  1. Las creencias fundamentales caían en fallback por falta de prompt template `questioning_approach_generation`
  2. Error al crear el filósofo por campo `publicDescription` faltante en schema de validación
- **Causa**: 
  1. Prompt template `questioning_approach_generation` no existía en la base de datos
  2. Frontend enviaba `publicDescription` pero el schema de validación no lo incluía
- **Solución**: 
  1. Creado prompt template `questioning_approach_generation` en la base de datos
  2. Agregado campo `publicDescription` al schema de validación y creación
  3. Verificados todos los prompt templates necesarios (3/3 disponibles)
- **Archivos modificados**:
  - Base de datos: Nuevo prompt template `questioning_approach_generation`
  - `src/app/api/philosophers/route.ts` - Schema de validación y creación

#### 8. **Filósofos creados no aparecen en la página**
- **Problema**: Después de crear un filósofo exitosamente, no aparece en la lista de filósofos disponibles
- **Causa**: La consulta GET solo incluía filósofos públicos (`isPublic: true`) o por defecto (`isDefault: true`), excluyendo filósofos privados creados por usuarios
- **Solución**: Agregado `createdBy: session.user.id` al filtro OR para incluir filósofos creados por el usuario actual
- **Archivos modificados**:
  - `src/app/api/philosophers/route.ts` - Consulta GET con filtro expandido

### 🎯 Funcionalidades Restauradas

- ✅ **Edición de System Prompts** - Funcional
- ✅ **Creación de nuevos Prompts** - Funcional
- ✅ **Eliminación de Prompts** - Funcional
- ✅ **Creación de nuevos Modelos** - Funcional
- ✅ **Visualización de estadísticas LLM** - Funcional
- ✅ **Página de administración LLM** - Carga sin errores
- ✅ **Selección de filósofo antagonista** - Funcional
- ✅ **Generación de nuevos pensadores** - Funcional
- ✅ **Creación completa de filósofos** - Funcional
- ✅ **Visualización de filósofos creados por usuario** - Funcional

## 🗺️ Mapeo de Campos Frontend ↔ Database

### Prompts
| Frontend Field | Database Field | Tipo |
|----------------|----------------|------|
| `displayName` | `name` | string |
| `systemPrompt` | `template` | string |
| `userPrompt` | - | dummy field |
| `parameters` | - | dummy field |
| `testData` | - | dummy field |
| `modelId` | - | dummy field |

### Models
| Frontend Field | Database Field | Tipo |
|----------------|----------------|------|
| `modelName` | `modelIdentifier` | string |
| `displayName` | `name` | string |
| `capabilities` | `capabilities` | JSON string |
| `parameters` | `parameters` | JSON string |

## 🔍 Metodología de Debugging

### 1. **Identificación de Errores**
```bash
# Revisar logs del navegador
- Abrir DevTools → Console
- Buscar errores JavaScript
- Identificar stack trace y línea específica
```

### 2. **Localización del Problema**
```bash
# Buscar en el código
grep -r "texto_del_error" src/
grep -r "función_problemática" src/
```

### 3. **Análisis de Causa Raíz**
- **Frontend Error**: Revisar componentes React y acceso a datos
- **API Error**: Revisar endpoints y respuestas
- **Database Error**: Revisar schema y queries de Prisma

### 4. **Aplicación de Fix**
- Modificar código
- Commit con mensaje descriptivo
- Push para deploy automático en Vercel
- Verificar en producción

### 5. **Verificación**
- Probar funcionalidad específica
- Revisar que no se introduzcan nuevos errores
- Documentar el fix aplicado

## 🚀 Proceso de Deploy

### Comandos Estándar
```bash
git add .
git commit -m "Fix: descripción del problema resuelto"
git push origin main
```

### Tiempo de Deploy
- **Vercel**: 1-2 minutos típicamente
- **Verificación**: Esperar deploy completo antes de probar

## 🛠️ Herramientas de Debugging

### 1. **Búsqueda en Código**
```bash
# Buscar patrones específicos
grep -r "pattern" src/
grep -r "\.interactions" src/ --include="*.tsx"
```

### 2. **Análisis de APIs**
```bash
# Probar endpoints directamente
curl -X GET "https://dialecticia.vercel.app/api/admin/llm/prompts"
```

### 3. **Revisión de Schema**
```bash
# Verificar estructura de base de datos
cat prisma/schema.prisma | grep -A 10 "model PromptTemplate"
```

## 📋 Checklist para Nuevos Errores

### Antes de Empezar
- [ ] Identificar error exacto en console del navegador
- [ ] Copiar stack trace completo
- [ ] Identificar qué acción del usuario causó el error

### Durante el Debug
- [ ] Localizar archivo y línea específica del error
- [ ] Entender la causa raíz (frontend/backend/database)
- [ ] Verificar si hay otros lugares con el mismo patrón
- [ ] Aplicar fix con null safety cuando sea apropiado

### Después del Fix
- [ ] Commit con mensaje descriptivo
- [ ] Push y esperar deploy
- [ ] Probar funcionalidad específica
- [ ] Verificar que no se rompió nada más
- [ ] Actualizar este documento si es necesario

## 🎯 Próximos Pasos Recomendados

### Si aparecen nuevos errores:
1. **Seguir la metodología establecida**
2. **Documentar el problema y solución**
3. **Verificar patrones similares en el código**
4. **Aplicar fixes preventivos cuando sea posible**

### Mejoras preventivas sugeridas:
- Agregar más validaciones de null safety en componentes
- Implementar error boundaries en React
- Agregar logging más detallado en APIs
- Crear tests unitarios para componentes críticos

## 📞 Contacto y Soporte

Para reportar nuevos errores, proporcionar:
1. **Screenshot del error** (si es visual)
2. **Mensaje de error completo** del console
3. **Pasos para reproducir** el error
4. **URL específica** donde ocurre

---

**Última actualización**: $(date)
**Estado del sistema**: ✅ Funcional
**Próxima revisión**: Cuando aparezcan nuevos errores 