# 🚀 Guía de Deployment en Vercel

## 📋 Pasos para Deploy

### 1. Acceder a Vercel
- Ve a: **https://vercel.com**
- Login/Signup con GitHub

### 2. Import Project
1. Click **"Add New..."** → **"Project"**
2. **Import Git Repository**
3. Buscar: `fkarrmann/dialecticia`
4. Click **"Import"**

### 3. Environment Variables (CRÍTICO)

En la sección **Environment Variables**, agrega estas variables:

```bash
# Base de datos (Vercel te proporcionará una PostgreSQL)
DATABASE_URL="postgresql://..." # Vercel automática

# APIs de IA (OBLIGATORIAS - usar tus claves reales)
OPENAI_API_KEY="sk-proj-TU_CLAVE_OPENAI_REAL"
ANTHROPIC_API_KEY="sk-ant-TU_CLAVE_ANTHROPIC_REAL"

# Autenticación
JWT_SECRET="dialecticia-super-secret-prod-2024"
ADMIN_PASSWORD="tu-password-admin-seguro"

# Configuración
NODE_ENV="production"
```

### 4. Build Settings (Auto-detectado)
- **Framework**: Next.js
- **Build Command**: `npm run build`  
- **Install Command**: `npm install`
- **Output Directory**: `.next`

### 5. Deploy
Click **"Deploy"** y esperar ~2-3 minutos.

## 🎯 URLs de Resultado

Después del deploy tendrás:
- **🌐 App pública**: `https://dialecticia.vercel.app`
- **🏛️ Filósofos funcionando** con Timeline Socrático
- **🤖 18+ filósofos únicos** listos para debatir
- **📊 Panel admin** completamente funcional

¡Tu plataforma de diálogo socrático estará **LIVE** en internet! 