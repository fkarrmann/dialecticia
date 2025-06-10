# Sistema de Prompts Dinámicos 🤖

## Overview

Sistema híbrido que permite editar prompts en **Markdown** (fácil para humanos) y usar **JSON** estructurado en la aplicación (eficiente para código).

## 🔄 Flujo de Trabajo

### Opción A: UI Web (Recomendado) 🆕
```bash
# 1. Abrir el panel de administración
http://localhost:3001/admin/prompts

# 2. Editar prompts visualmente con preview en tiempo real
# 3. Guardar cambios directamente desde la UI
# 4. Los cambios se aplican inmediatamente
```

### Opción B: Markdown (Método Original)
```bash
# 1. Editar estrategia
vim docs/prompts/socratic-strategy.md

# 2. Transformar y aplicar
npm run restart

# 3. Desarrollar
npm run dev
```

## 📁 Estructura de Archivos

```
docs/prompts/
├── socratic-strategy.md      # 📝 EDITABLE - Tu archivo principal
├── generated-prompts.json   # 🤖 AUTO-GENERADO - No editar
├── prompts.schema.json      # 📋 Schema de validación
├── .prompts-cache           # 🔍 Hash para detección de cambios
├── .gitignore              # 🚫 Archivos a ignorar
├── versions/               # 💾 Backups automáticos
│   ├── 2025-01-28T14-30.backup.json
│   └── 2025-01-28T15-45.backup.json
└── README.md               # 📖 Esta documentación
```

## 🛠️ Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run restart` | Transforma prompts + reinicia desarrollo |
| `npm run transform-prompts` | Solo transforma MD → JSON |

## ✨ Nueva UI Web de Administración

### 🎯 **Panel de Control Completo** - `/admin/prompts`
- **Editor Visual de Prompts**: Edita los 5 tipos de prompts socráticos con syntax highlighting
- **Gestión de Personalidades**: Configura plantillas y estilos argumentativos de filósofos
- **Preview en Tiempo Real**: Prueba cambios con contexto simulado antes de aplicar
- **Gestión de Versiones**: Historial completo con backup/restore/export
- **Auto-guardado**: Los cambios se aplican inmediatamente sin restart

### 🚀 **Ventajas de la UI**
- ✅ Sin necesidad de terminal o editar archivos manualmente
- ✅ Preview inmediato de cómo funcionan los prompts
- ✅ Rollback con un click a versiones anteriores
- ✅ Interfaz intuitiva con validación en tiempo real
- ✅ Compatible con el sistema de archivos existente

## ⚡ Características

### ✅ **Detección Inteligente de Cambios**
- Solo transforma si el `.md` cambió (usa hash MD5)
- Evita gastos innecesarios de tokens GPT-4o-mini

### 💾 **Backup Automático**
- Cada transformación crea backup con timestamp
- Incluye tanto MD original como JSON anterior
- Posibilidad de restaurar versiones anteriores

### 🤖 **Transformación GPT-4o-mini**
- Usa modelo económico para transformaciones
- Extrae prompts de código markdown → JSON estructurado
- Validación automática del resultado

### 🔄 **Fallback Robusto**
- Si falla la carga del JSON, usa prompts hardcodeados
- La app nunca se rompe por problemas de prompts
- Logs claros sobre qué sistema está usando

## 📝 Editando Prompts

### Formato del Markdown

Los prompts deben estar en bloques de código:

```markdown
### SOCRATIC_TO_USER
**Prompt**:
```
Eres Sócrates dirigiéndote al usuario...
```

**Ejemplos**:
- "Dime, ¿no es contradictorio..."
```

### Variables en Plantillas

Para filósofos no-Sócrates, usa variables:

```markdown
Eres {NOMBRE}, especialista en {ESCUELA_FILOSOFICA}...
```

Variables disponibles:
- `{NOMBRE}` - Nombre del filósofo
- `{DESCRIPCIÓN}` - Descripción de personalidad
- `{CREENCIAS_CORE}` - Creencias fundamentales
- `{ESTILO_ARGUMENTATIVO}` - Estilo de debate
- `{ENFOQUE_CUESTIONAMIENTO}` - Enfoque de preguntas
- `{FORMALIDAD}`, `{AGRESIVIDAD}`, etc. - Traits numéricos

## 🚨 Troubleshooting

### Error: "No se encontró socratic-strategy.md"
```bash
# Verifica que el archivo existe
ls docs/prompts/socratic-strategy.md
```

### Error: "GPT-4o-mini no devolvió contenido"
```bash
# Verifica tu API key
echo $OPENAI_API_KEY

# O usa el fallback hardcodeado
# (la app sigue funcionando)
```

### Error: "Validación de estructura falló"
```bash
# Revisa el schema esperado
cat docs/prompts/prompts.schema.json

# El script te dirá exactamente qué falta
```

## 🔍 Debugging

### Ver qué prompts está usando la app:
```bash
# En los logs del servidor verás:
# "✅ Prompts cargados desde JSON (v1.0.0)"
# o
# "📄 Usando prompts de fallback (hardcodeados)"
```

### Forzar regeneración:
```bash
# Borra el cache para forzar transformación
rm docs/prompts/.prompts-cache
npm run restart
```

### Ver historial de cambios:
```bash
# Lista los backups disponibles
ls docs/prompts/versions/
```

## 🎯 Mejores Prácticas

1. **Itera rápido**: Edita MD → `npm run restart` → prueba
2. **Sé específico**: Define longitud máxima y estilo claramente
3. **Usa ejemplos**: Incluye 2-3 ejemplos por tipo de prompt
4. **Mide impacto**: Observa si las respuestas mejoran
5. **Haz backups**: Los backups son automáticos, pero puedes hacer manuales

## 🚀 Próximas Mejoras

- [x] **UI web para editar prompts** ✅ **COMPLETADO** - `/admin/prompts`
- [ ] Comparador visual de versiones
- [ ] Métricas de efectividad automáticas
- [ ] A/B testing de prompts
- [ ] Rollback con un click

---

💡 **Tip**: Para cambios menores, edita directamente el `.md`. Para experimentación mayor, considera hacer un backup manual primero. 