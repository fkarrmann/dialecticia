# Dialecticia - Plataforma de Debates Filosóficos

## 🎯 **Descripción**

Dialecticia es una plataforma de debates filosóficos donde los usuarios pueden interactuar con filósofos virtuales powered by AI, basada en personalidades auténticas y metodologías de pensamiento reales.

## 🚀 **Características Principales**

- **🤖 Filósofos AI Auténticos**: Sócrates, Platón, Aristóteles, Nietzsche y más
- **💭 Debates Socráticos**: Metodología de questioning socrático
- **🧠 Personalidades Complejas**: Cada filósofo tiene traits de personalidad únicos
- **🎮 Sistema de Gamificación**: Aspectos de personalidad y progresión
- **👑 Sistema de Administración**: Control completo de prompts y LLMs
- **🔍 Sistema de Debugging**: Control y debugging de prompts en tiempo real
- **📄 Exportación PDF Profesional**: Exporta debates como PDFs profesionales con diseño branded

## 🛠️ **Tecnologías**

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: PostgreSQL
- **AI**: Anthropic Claude, OpenAI GPT
- **Autenticación**: Next-Auth
- **UI**: Radix UI, Lucide Icons

## 📦 **Instalación**

```bash
# Clonar repositorio
git clone [repository-url]
cd dialecticia

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Configurar base de datos
npx prisma generate
npx prisma db push

# Iniciar servidor de desarrollo
npm run dev
```

## 🎮 **Uso del Sistema**

### **Inicio Rápido**
```bash
# Iniciar con logs detallados
./start-dev-with-logs.sh

# Solo logs de debugging
./watch-debug-logs.sh
```

### **Administración**
- Panel de administración: `/admin/llm-management`
- Gestión de prompts: Control de activación/desactivación
- Métricas de LLM: Costos y uso de tokens
- Gestión de filósofos: Aspectos de personalidad

### **Sistema de Debugging de Prompts** 🔍
- **Activar/Desactivar prompts** desde la UI administrativa
- **Logs detallados** de qué prompts se usan en cada interacción
- **Errores específicos** cuando prompts están desactivados
- **Visualización diferenciada** de errores de debugging vs errores reales

### **Exportación PDF Profesional** 📄
- **PDFs profesionales** con diseño branded de Dialecticia
- **Layout optimizado** A4 con márgenes profesionales y paginación inteligente
- **Rasgos de personalidad** con escala 0-5 visualizada en barras atractivas
- **Trade-offs filosóficos** personalizados por filósofo con indicadores elegantes
- **Información completa** de filósofos (creencias, estilos, mecánicas)
- **Diferenciación visual** entre usuario (azul) y filósofo (púrpura)
- **Estructura limpia** sin duplicaciones y layout optimizado
- **Metadatos completos** y optimización para impresión
- **Compatibilidad universal** con todos los lectores de PDF

## 📁 **Estructura del Proyecto**

```
├── src/
│   ├── app/              # App Router de Next.js 15
│   │   ├── admin/        # Panel de administración
│   │   ├── api/          # API Routes
│   │   ├── debate/       # Páginas de debate
│   │   └── philosophers/ # Gestión de filósofos
│   ├── components/       # Componentes React reutilizables
│   ├── lib/              # Utilidades y servicios
│   └── types/            # Definiciones de TypeScript
├── prisma/               # Esquema y migraciones de base de datos
├── docs/                 # Documentación del proyecto
└── scripts/              # Scripts de utilidad
```

## 🔧 **Scripts Disponibles**

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
./start-dev-with-logs.sh # Servidor con logs coloreados
./watch-debug-logs.sh    # Solo logs de debugging

# Base de datos
npx prisma studio        # Interfaz gráfica de BD
npx prisma generate      # Generar cliente Prisma
npx prisma db push       # Aplicar cambios al esquema

# Producción
npm run build            # Build de producción
npm start                # Servidor de producción
```

## 📚 **Documentación**

- **[Sistema de Debugging de Prompts](docs/PROMPT_DEBUGGING_SYSTEM.md)**: Guía completa del sistema de debugging
- **[Sistema de Exportación PDF](docs/PDF_EXPORT_SYSTEM.md)**: Guía completa del sistema de exportación PDF editable
- **[Roadmap](ROADMAP.md)**: Características planificadas y progreso
- **[Setup OpenAI](setup-openai.md)**: Configuración de API keys

## 🔄 **Backups**

El proyecto mantiene backups automáticos:
- `Dialecticia-backup-20250610-MODAL_ZINDEX_FIXED.zip`: ✅ **CONTEXTO CONVERSACIONAL + MODAL Z-INDEX** - v2.2
- `Dialecticia-backup-20250603-MODAL_ZINDEX_FIXED.zip`: Modal Z-Index corregido - Portal implementation
- `BACKUP_20250130_PDF_EXPORT_OPTIMIZED`: Sistema de exportación PDF optimizado v2.0
- `BACKUP_20250529_161709_PDF_EXPORT_SYSTEM`: Sistema de exportación PDF editable completo
- `BACKUP_20250529_161120_PROMPT_DEBUGGING_SYSTEM`: Sistema de debugging completo
- `BACKUP_20250530_LLM_CLAUDE4_WORKING`: Sistema LLM funcionando
- `BACKUP_20250529_143327_LLM_PERSONALITY_COMPLETE`: Sistema de personalidades

## 🧪 **Testing del Sistema de Debugging**

Para probar que el debugging funciona correctamente:

1. **Acceder al panel admin**: `/admin/llm-management`
2. **Desactivar un prompt**: Usar el botón de poder (⚡ → ⭕)
3. **Intentar un debate**: Con cualquier filósofo
4. **Verificar error**: Debe aparecer mensaje amarillo específico
5. **Verificar logs**: Terminal debe mostrar detalles del error

**Logs esperados cuando funciona**:
```
🚨 PROMPT ERROR DETECTED FOR DEBUGGING:
   🔴 Philosopher: [Nombre]
   🔴 Error: Prompt template "[nombre_prompt]" no encontrado o está desactivado
🔥 DEBUGGING ERROR CAUGHT IN API ROUTE: PROMPT_DEBUGGING_ERROR: Prompt '[nombre]' requerido para [filósofo] está desactivado o no existe
```

## 🎯 **Estado del Proyecto**

- ✅ **Sistema LLM Multi-Provider**: Anthropic Claude + OpenAI
- ✅ **Base de Datos de Prompts**: 11+ prompts migrados
- ✅ **Sistema de Debugging**: Control total de prompts
- ✅ **Panel de Administración**: Gestión completa
- ✅ **Sistema de Personalidades**: Traits únicos por filósofo
- ✅ **Autenticación**: Sistema de roles (admin/user)
- ✅ **Exportación PDF**: PDFs profesionales con diseño optimizado v2.0
- ✅ **Modal de Exportación**: Z-index corregido con React Portal
- ✅ **Contexto de Conversación**: Índice de mensajes enviado al LLM para respuestas adaptativas
- 🔄 **En Desarrollo**: Gamificación avanzada
- 📋 **Próximo**: Sistema de métricas detalladas

## 👥 **Equipo**

- **Desarrollo**: Federico + Claude Sonnet 4
- **Versión Actual**: v2.2 - Conversational Context + Modal Z-Index Fixed

## ⚠️ **Problemas Conocidos**

### ✅ Problemas Recientemente Solucionados

- **Modal de Exportación PDF**: ✅ **SOLUCIONADO** - Z-index y posicionamiento corregidos
  - **Solución**: Implementación de React Portal para renderizado directo en body
  - **Mejoras**: Z-index optimizado con contexto de apilamiento independiente
  - **Estado**: Modal aparece correctamente por encima de todos los elementos

### 🔴 Problemas Críticos Pendientes

- **Cancelación de Exportación**: Posibles conflictos entre cancelación manual y errores reales
  - Cancelación manual ocasionalmente reportada como error
  - **Backup disponible**: `Dialecticia-backup-20250603-151152.zip`

### Resolución Recomendada
```bash
# Limpieza profunda de cache corrupto
pkill -f "next dev"
rm -rf .next node_modules/.cache .turbo
npm cache clean --force
rm -rf node_modules && npm install
npm run dev
```

## 📞 **Soporte**

Para issues o preguntas:
1. Revisar logs con `./start-dev-with-logs.sh`

# Limpiar puerto y correr app
lsof -ti:3001 | xargs kill -9 2>/dev/null || true && sleep 2 && npm run dev