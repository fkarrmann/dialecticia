# Dialecticia - Guía de Deployment y Configuración Dual

## 📋 Estado Actual

### ✅ **FUNCIONANDO EN LOCAL**
- **Base de datos**: SQLite (`file:./dev.db`)
- **Autenticación**: Sistema funcionando correctamente
- **Login exitoso**: Con código `ADMIN` confirmado
- **Aplicación**: Corriendo en `http://localhost:3001`

### ❌ **VERCEL - PENDIENTE**
- **Base de datos**: Necesita PostgreSQL configurado
- **Último error**: Falta de tablas en la nube
- **Strategy**: Configuración dual sin interferir con local

---

## 🎯 Plan de Acción: Configuración Dual

### **Objetivo**: 
Mantener SQLite local + PostgreSQL para Vercel sin que se interfieran

### **Estrategia**:
1. **Local**: Seguir usando SQLite con `.env` 
2. **Vercel**: Variables de entorno con PostgreSQL
3. **Schema**: Prisma conditional por provider
4. **Build**: Scripts diferentes para cada entorno

---

## 🚨 ERRORES CRÍTICOS A EVITAR

### ❌ **ERROR 1: Romper configuración local funcionando**
**QUÉ PASÓ**: Eliminé archivos `.env` que tenían SQLite funcionando
**LECCIÓN**: NUNCA eliminar configuración local que funciona
**PREVENCIÓN**: Backup antes de cambios + configuración dual

### ❌ **ERROR 2: Cambiar provider sin validar compatibilidad**
**QUÉ PASÓ**: Cambié de SQLite a PostgreSQL sin verificar schema differences
**LECCIÓN**: SQLite vs PostgreSQL tienen diferentes features (named foreign keys)
**PREVENCIÓN**: Schema conditional + testing

### ❌ **ERROR 3: Forzar configuración única**
**QUÉ PASÓ**: Intenté una sola configuración para local + Vercel
**LECCIÓN**: Diferentes entornos necesitan diferentes configuraciones
**PREVENCIÓN**: Configuración dual desde el inicio

### ❌ **ERROR 4: No respetar cache de Prisma**
**QUÉ PASÓ**: Cambios de schema no se reflejaban por cache de Prisma Client
**LECCIÓN**: Regenerar Prisma Client después de cambios de provider
**PREVENCIÓN**: `npx prisma generate` después de cada cambio

---

## 🛠️ Configuración Dual (Local SQLite + Vercel PostgreSQL)

### **1. Estructura de Archivos**
```
.env                    # Local: DATABASE_URL="file:./dev.db"
vercel.json            # Build commands + env mapping
prisma/schema.prisma   # Schema adaptable a ambos providers
scripts/build-dual.js  # Build script que detecta entorno
```

### **2. Schema Prisma Adaptable**
```prisma
datasource db {
  provider = env("DATABASE_PROVIDER") // "sqlite" | "postgresql"
  url      = env("DATABASE_URL")
}

// Conditional constraints based on provider
model Vote {
  // SQLite: Sin named foreign keys
  // PostgreSQL: Con named foreign keys
}
```

### **3. Variables de Entorno**

#### **Local (.env)**
```bash
DATABASE_PROVIDER="sqlite"
DATABASE_URL="file:./dev.db"
```

#### **Vercel (Environment Variables)**
```bash
DATABASE_PROVIDER="postgresql"
DATABASE_URL="postgresql://user:pass@host:port/db"
```

---

## 🔄 Workflow de Deployment

### **Desarrollo Local**
1. `npm run dev` → Usa SQLite automáticamente
2. Cambios en schema → `npx prisma generate`
3. Nuevas migraciones → `npx prisma db push`
4. Testing completo antes de deploy

### **Deploy a Vercel**
1. Commit changes → Push to GitHub
2. Vercel detecta cambios → Usa PostgreSQL
3. Build script detecta entorno → Aplica configuración correcta
4. Schema se adapta automáticamente al provider

---

## 📦 Scripts de Build Inteligentes

### **scripts/build-dual.js**
```javascript
// Detectar entorno
const isVercel = process.env.VERCEL === '1'
const provider = process.env.DATABASE_PROVIDER || (isVercel ? 'postgresql' : 'sqlite')

// Configurar Prisma según entorno
if (provider === 'postgresql') {
  // Setup PostgreSQL específico
  // Aplicar migraciones si es necesario
} else {
  // Setup SQLite específico
  // Verificar dev.db exists
}

// Build Next.js
execSync('npx next build')
```

---

## 🔍 Debugging y Monitoreo

### **Local**
- Logs en consola visible
- Base de datos SQLite accesible con herramientas
- Prisma Studio: `npx prisma studio`

### **Vercel**
- Logs en Vercel Dashboard
- Function logs para debugging
- Variables de entorno verificables

---

## 🧪 Testing Strategy

### **Pre-Deploy Checklist**
- [ ] Login local funciona
- [ ] Base de datos local tiene datos de prueba
- [ ] Schema compilado sin errores
- [ ] Variables de entorno configuradas
- [ ] Build local exitoso

### **Post-Deploy Verification**
- [ ] Vercel build exitoso
- [ ] PostgreSQL conectado
- [ ] Tablas creadas correctamente
- [ ] Login en producción funciona
- [ ] APIs responden correctamente

---

## 🎛️ Configuración Específica por Provider

### **SQLite (Local)**
```prisma
// Sin named foreign keys
model Vote {
  philosopher Philosopher? @relation(fields: [voterId], references: [id])
  user        User?        @relation(fields: [voterId], references: [id])
}
```

### **PostgreSQL (Vercel)**
```prisma
// Con named foreign keys
model Vote {
  philosopher Philosopher? @relation(fields: [voterId], references: [id], map: "votes_philosopher_fkey")
  user        User?        @relation(fields: [voterId], references: [id], map: "votes_user_fkey")
}
```

---

## 📚 Recursos y Referencias

### **Prisma Multi-Database**
- [Prisma Multiple Databases](https://www.prisma.io/docs/guides/database/multi-database)
- [Environment-specific schemas](https://www.prisma.io/docs/guides/development-environment/environment-variables)

### **Vercel Deployment**
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel PostgreSQL](https://vercel.com/docs/storage/vercel-postgres)

### **Next.js + Prisma**
- [Next.js with Prisma](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns#prisma)

---

## 🚀 Próximos Pasos

1. **Crear base PostgreSQL en Vercel** ✅ (siguiente)
2. **Configurar variables de entorno dual** ✅ 
3. **Adaptar schema para ambos providers** ✅
4. **Testing completo de configuración dual** ✅
5. **Deploy y verificación final** ✅

---

## 💡 Lecciones Aprendidas

### **Buenas Prácticas**
1. **Backup antes de cambios críticos**
2. **Configuración dual desde el inicio**
3. **Testing exhaustivo en local antes de deploy**
4. **Documentar cada paso para reproducibilidad**

### **Antipatrones a Evitar**
1. **Eliminar configuración funcionando**
2. **Forzar configuración única para entornos diferentes**
3. **Cambios de schema sin regenerar Prisma Client**
4. **Deploy sin testing local previo**

---

*Última actualización: 2025-01-28 - Estado: Local funcionando ✅, Vercel pending 🔄* 