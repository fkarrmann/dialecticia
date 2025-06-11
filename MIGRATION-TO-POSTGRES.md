# 🔄 Migración de SQLite a PostgreSQL (Vercel)

## 📋 Proceso de Migración Selectiva

### 🎯 Objetivo
Migrar solo los datos críticos desde SQLite local hacia PostgreSQL en Vercel:
- **Usuario Admin**: Federico Karrmann
- **Sistema LLM completo**: Proveedores, modelos, prompts, configuraciones
- **Filósofos predeterminados** con aspectos de personalidad
- **Tonos personalizados**

### 📊 Datos que SE MIGRAN
✅ **LLM Providers** (OpenAI, Anthropic)  
✅ **LLM Models** (GPT-4o, Claude Sonnet 4, etc.)  
✅ **Prompt Templates** (20 templates trabajados)  
✅ **LLM Configurations** (configuraciones activas)  
✅ **Usuario Admin** (fkarrmann@gmail.com)  
✅ **Filósofos** (solo isDefault=true o isPublic=true)  
✅ **Aspectos de Personalidad** de filósofos  
✅ **Custom Tones** (activos)  

### ❌ Datos que NO se migran
❌ Usuarios de prueba  
❌ Debates de desarrollo  
❌ Mensajes de testing  
❌ Sessions temporales  
❌ Datos de desarrollo  

## 🚀 Pasos de Ejecución

### **Paso 1: Preparar Entorno Local**

```bash
# Asegurarse de tener las dependencias
npm install sqlite3

# Verificar que dev.db existe y tiene datos
sqlite3 dev.db ".tables"
```

### **Paso 2: Configurar Variables de Entorno**

Asegúrate de tener en tu `.env` o variables de Vercel:

```bash
# PostgreSQL URL (Vercel te la proporciona)
DATABASE_URL="postgresql://username:password@host:port/database"

# APIs necesarias
OPENAI_API_KEY="sk-proj-tu-clave"
ANTHROPIC_API_KEY="sk-ant-tu-clave"
```

### **Paso 3: Ejecutar Migración**

```bash
# Migrar datos desde SQLite a PostgreSQL
npm run migrate:to-postgres
```

Este script:
1. ✅ Conecta a ambas bases de datos
2. ✅ Migra proveedores LLM
3. ✅ Migra modelos LLM  
4. ✅ Migra prompt templates (CRÍTICO)
5. ✅ Migra configuraciones LLM
6. ✅ Migra usuario admin
7. ✅ Migra filósofos con personalidades
8. ✅ Migra tonos personalizados

### **Paso 4: Configurar Producción**

```bash
# Configurar códigos de invitación y verificar datos
npm run setup:production
```

Este script:
1. 🎫 Crea códigos de invitación para producción
2. 👤 Verifica usuario administrador
3. 🤖 Valida configuración LLM completa
4. 🏛️ Confirma filósofos disponibles

## 📊 Resultado Esperado

### **Configuración LLM Migrada:**
- **2 Proveedores**: OpenAI + Anthropic
- **5 Modelos**: GPT-4o, GPT-4o-mini, Claude 3.5 Sonnet, Claude Sonnet 4, Claude Opus 4
- **~12 Prompt Templates**: Todos los prompts trabajados
- **~5 Configuraciones**: Configuraciones de chat y generación

### **Filósofos Migrados:**
- **~14 Filósofos** con personalidades completas
- Aspectos de personalidad generados por IA
- Configuraciones de debate específicas

### **Acceso:**
- **Admin**: fkarrmann@gmail.com (Federico Karrmann)
- **Códigos**: DIALECTICIA-LAUNCH-2024, ADMIN-ACCESS-FEDERICO, BETA-TESTERS-2024

## 🔧 Troubleshooting

### Error: "Provider not found"
```bash
# Verificar que los proveedores se migraron
psql $DATABASE_URL -c "SELECT name, displayName FROM llm_providers;"
```

### Error: "Prompt template missing"
```bash
# Verificar templates migrados
psql $DATABASE_URL -c "SELECT name, version, isActive FROM prompt_templates;"
```

### Error: "Admin user not found"
```bash
# Verificar usuario admin
psql $DATABASE_URL -c "SELECT email, name, isAdmin FROM users WHERE isAdmin = true;"
```

## 🎯 Verificación Final

Después de la migración, verifica en tu aplicación:

1. **Panel Admin** → LLM Management funcional
2. **Filósofos** → Lista completa disponible  
3. **Debates** → Pueden iniciarse correctamente
4. **Autenticación** → Login con códigos funciona

## 📝 Notas Importantes

- ⚠️ **Backup**: El `dev.db` original permanece intacto
- 🔄 **Idempotente**: Los scripts pueden ejecutarse múltiples veces
- 🎯 **Selectivo**: Solo migra datos de producción
- 🔒 **Seguro**: No migra datos sensibles de desarrollo

---

✅ **Migración completada exitosamente**: Tu sistema LLM está listo en producción! 