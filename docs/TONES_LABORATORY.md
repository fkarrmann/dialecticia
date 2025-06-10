# 🧪 Laboratorio de Tonos - Dialecticia

## Descripción General

El **Laboratorio de Tonos** es un sistema avanzado de meta-configuración que permite a los administradores crear y gestionar tonos personalizados para las interacciones filosóficas en Dialecticia. Este sistema utiliza inteligencia artificial para transformar descripciones en lenguaje natural en prompts técnicos optimizados.

## 🎯 Características Principales

### 1. **Creación Inteligente de Tonos**
- **Descripción en Lenguaje Natural**: Describe cómo quieres que se comporte el filósofo
- **Generación Automática con IA**: GPT-4o-mini analiza tu descripción y genera:
  - **Etiqueta**: Una palabra que categoriza el tono (Sarcástico, Devastador, Quirúrgico, etc.)
  - **Interpretación**: Explicación de lo que la IA entendió de tu descripción
  - **Prompt Optimizado**: Prompt técnico listo para usar en producción

### 2. **Sistema de Activación Único**
- **Solo un tono activo**: Garantiza consistencia en todas las interacciones
- **Activación/Desactivación**: Control total sobre qué tono está vigente
- **Aplicación Global**: Afecta todos los mensajes de todas las charlas
- **Invisible al Usuario Final**: Los usuarios no saben de la existencia del sistema

### 3. **Laboratorio de Pruebas**
- **Contexto Configurable**: Define filósofo, tema y mensaje de prueba
- **Generación en Tiempo Real**: Ve cómo responde el tono antes de activarlo
- **Comparación de Resultados**: Prueba diferentes tonos con el mismo contexto

### 4. **Gestión Completa**
- **Biblioteca de Tonos**: Almacena todos los tonos creados
- **Contador de Uso**: Rastrea cuántas veces se ha usado cada tono
- **Historial de Activación**: Ve cuándo fue la última vez que se usó
- **Eliminación Segura**: Borra tonos que ya no necesites

## 🚀 Cómo Usar el Laboratorio

### Acceso
- **URL Directa**: `http://localhost:3001/admin/tones`
- **Desde Panel Admin**: `http://localhost:3001/admin/prompts` → Pestaña "Laboratorio de Tonos"
- **Desde Página Principal**: Enlace "🧪 Laboratorio de Tonos"

### Crear un Nuevo Tono

1. **Ve a la pestaña "Crear Tono"**
2. **Completa los campos**:
   - **Título**: Nombre descriptivo (ej: "Sócrates Sarcástico")
   - **Descripción**: Explica en lenguaje natural cómo debe comportarse
3. **Haz clic en "Crear Tono"**
4. **La IA generará automáticamente**:
   - Etiqueta categorizada
   - Interpretación de tu descripción
   - Prompt técnico optimizado

### Activar un Tono

1. **Ve a la pestaña "Gestionar"**
2. **Encuentra el tono que quieres activar**
3. **Haz clic en "Activar"**
4. **El tono anterior se desactivará automáticamente**
5. **Verás el tono activo destacado en verde**

### Probar un Tono

1. **Ve a la pestaña "Probar"**
2. **Configura el contexto de prueba**:
   - Filósofo (ej: Platón, Nietzsche)
   - Tema del debate (ej: la justicia, el amor)
   - Mensaje del usuario (ej: "¿Qué opinas sobre esto?")
3. **En la pestaña "Gestionar", haz clic en "Probar" en cualquier tono**
4. **Ve el resultado en tiempo real**

## 🎭 Ejemplos de Tonos

### Tono Sarcástico
```
Título: Sócrates Sarcástico
Descripción: Quiero que sea muy sarcástico, que use ironía para cuestionar las ideas del usuario, pero sin ser ofensivo. Debe hacer preguntas retóricas y usar ejemplos absurdos para mostrar contradicciones.

Resultado IA:
- Etiqueta: Sarcástico
- Interpretación: Un filósofo que usa ironía inteligente y ejemplos exagerados para exponer contradicciones sin atacar personalmente
- Prompt: [Generado automáticamente por IA]
```

### Tono Devastador
```
Título: Crítico Implacable
Descripción: Debe ser extremadamente directo y demoledor con los argumentos débiles. Sin piedad intelectual, pero siempre constructivo. Que desarme completamente las ideas mal fundamentadas.

Resultado IA:
- Etiqueta: Devastador
- Interpretación: Un enfoque directo y sin concesiones que desmantela argumentos débiles de manera constructiva pero implacable
- Prompt: [Generado automáticamente por IA]
```

### Tono Empático
```
Título: Guía Comprensivo
Descripción: Debe ser muy empático y comprensivo, guiar al usuario con preguntas suaves pero profundas. Como un mentor sabio que ayuda a descubrir verdades sin juzgar.

Resultado IA:
- Etiqueta: Empático
- Interpretación: Un enfoque gentil y comprensivo que guía al descubrimiento a través de preguntas cuidadosas y apoyo emocional
- Prompt: [Generado automáticamente por IA]
```

## 🔧 Integración Técnica

### Base de Datos
```sql
-- Tabla custom_tones
CREATE TABLE custom_tones (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  user_description TEXT NOT NULL,
  ai_interpretation TEXT NOT NULL,
  ai_label TEXT NOT NULL,
  generated_prompt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  usage_count INTEGER DEFAULT 0
);
```

### API Endpoints
- `GET /api/admin/tones` - Listar todos los tonos
- `POST /api/admin/tones` - Crear nuevo tono
- `GET /api/admin/tones/[id]` - Obtener tono específico
- `PATCH /api/admin/tones/[id]` - Activar/desactivar tono
- `DELETE /api/admin/tones/[id]` - Eliminar tono
- `POST /api/admin/tones/test` - Probar tono con contexto
- `POST /api/admin/tones/generate` - Generar tono con IA

### Integración con Sistema de Debates
El sistema verifica automáticamente si hay un tono activo antes de generar respuestas:

```typescript
// En src/lib/llm.ts
const activeTone = await getActiveCustomTone()
if (activeTone) {
  // Usar el prompt personalizado del tono activo
  systemPrompt = activeTone.generatedPrompt
  // Incrementar contador de uso
  await incrementToneUsage(activeTone.id)
}
```

## 📊 Métricas y Seguimiento

### Información Disponible
- **Contador de Uso**: Cuántas veces se ha usado cada tono
- **Fecha de Creación**: Cuándo se creó el tono
- **Última Actualización**: Cuándo se modificó por última vez
- **Estado Activo**: Qué tono está actualmente vigente

### Logs del Sistema
```
🎭 Usando tono personalizado: Sócrates Sarcástico (Sarcástico)
🤖 Generating response for Sócrato | Mode: OPENAI | Model: gpt-4o-mini | Prompts: custom-tone
✅ OpenAI response received | Tokens: 234
```

## 🛡️ Consideraciones de Seguridad

### Control de Acceso
- **Solo Administradores**: El sistema es invisible para usuarios finales
- **URLs Protegidas**: Todas las rutas están bajo `/admin/`
- **Validación de Entrada**: Todos los inputs son validados

### Fallbacks
- **Error de IA**: Si falla la generación, usa un prompt genérico
- **Tono Inactivo**: Si no hay tono activo, usa prompts por defecto
- **Base de Datos**: Si falla la conexión, continúa con sistema normal

## 🔮 Casos de Uso Avanzados

### A/B Testing de Tonos
1. Crear múltiples variaciones de un tono
2. Activar uno durante una semana
3. Comparar métricas de engagement
4. Activar el más efectivo

### Tonos Temáticos
- **Tono Académico**: Para debates universitarios
- **Tono Casual**: Para usuarios nuevos
- **Tono Intenso**: Para debates avanzados
- **Tono Humorístico**: Para aliviar tensiones

### Personalización por Contexto
- **Tono Matutino**: Más energético en las mañanas
- **Tono Nocturno**: Más reflexivo en las noches
- **Tono de Fin de Semana**: Más relajado

## 📈 Roadmap Futuro

### Funcionalidades Planeadas
- **Tonos Programados**: Activación automática por horarios
- **Tonos por Usuario**: Diferentes tonos para diferentes tipos de usuario
- **Análisis de Sentimiento**: Ajuste automático según el estado emocional
- **Tonos Colaborativos**: Múltiples administradores trabajando en tonos
- **Exportar/Importar**: Compartir tonos entre instalaciones

### Integraciones Futuras
- **Analytics Avanzados**: Métricas detalladas de efectividad
- **Machine Learning**: Optimización automática de tonos
- **API Externa**: Permitir tonos desde servicios externos
- **Versionado**: Historial de cambios en tonos

---

## 🎉 ¡Experimenta y Crea!

El Laboratorio de Tonos te da el poder de moldear la personalidad de Dialecticia. Experimenta con diferentes enfoques, crea tonos únicos y descubre nuevas formas de hacer que las interacciones filosóficas sean más efectivas y atractivas.

**¡La única limitación es tu imaginación!** 🚀 