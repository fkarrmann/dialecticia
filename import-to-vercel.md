# 🚀 DIALECTICIA - RESTAURACIÓN DE DATOS EN VERCEL

## 📋 **Resumen de la Restauración**

**Fuente:** `Dialecticia-BACKUP-PRE-GITHUB-20250610-132758`
**Destino:** Vercel PostgreSQL (Neon)
**Datos a restaurar:**
- ✅ **7 códigos de invitación** (críticos para acceso)
- ✅ **5 prompts esenciales** (Sócrates, Platón, Aristóteles, Kant, Nietzsche)
- ✅ **8 filósofos principales** (figuras clave para debates)

## 🎯 **Pasos para la Restauración**

### **1. Acceder a la Base de Datos de Vercel**

```bash
# Opción A: Usar Vercel CLI
vercel env pull .env.local
npx prisma studio

# Opción B: Usar conexión directa a Neon
# Obtener la URL de conexión desde Vercel Dashboard
```

### **2. Ejecutar el Script de Importación**

```bash
# Desde el directorio del proyecto Vercel
psql $DATABASE_POSTGRES_PRISMA_URL -f vercel-data-import.sql
```

### **3. Verificar la Importación**

```sql
-- Verificar que los datos se importaron correctamente
SELECT COUNT(*) as invitation_codes FROM "InvitationCode";
SELECT COUNT(*) as prompt_templates FROM "PromptTemplate";
SELECT COUNT(*) as philosophers FROM "Philosopher";

-- Mostrar códigos disponibles
SELECT code, description, "maxUses", "currentUses" 
FROM "InvitationCode" 
WHERE "isActive" = true;
```

## 🔑 **Códigos de Invitación Disponibles**

Después de la importación, estos códigos estarán disponibles:

| Código | Descripción | Usos Disponibles |
|--------|-------------|------------------|
| `FILOSOFO-BETA` | Beta testers | 4/5 |
| `SOCRATES-VIP` | Acceso premium | 24/30 |
| `DEMO-ACCESS` | Demostración | 1/1 |
| `NUEVO-TEST` | Prueba nuevo | 4/5 |
| `ADMIN-FEDE-2025` | Administrativo | 9/10 |
| `DIALECTICIA-LAUNCH` | Lanzamiento | 100/100 |
| `REAL-DATA-IMPORTED-2024` | Datos importados | 8/10 |

## 🧠 **Filósofos Disponibles**

- **Sócrates** - Método socrático, preguntas penetrantes
- **Platón** - Mundo de las Ideas, dialéctica
- **Aristóteles** - Lógica formal, término medio
- **Immanuel Kant** - Imperativo categórico, moral del deber
- **Friedrich Nietzsche** - Crítica de valores, voluntad de poder
- **René Descartes** - Racionalismo, duda metódica
- **John Stuart Mill** - Utilitarismo, libertad individual
- **Simone de Beauvoir** - Feminismo existencialista

## 📝 **Prompts Esenciales**

1. **Sócrates - Moderador Plural** (socratic)
2. **Aristóteles - Lógica y Ética** (classical)
3. **Platón - Ideas y Realidad** (classical)
4. **Kant - Imperativo Categórico** (modern)
5. **Nietzsche - Crítica de Valores** (modern)

## ✅ **Verificación Post-Importación**

1. **Acceder a la aplicación:** https://dialecticia.vercel.app
2. **Probar login:** Usar código `DEMO-ACCESS` o `FILOSOFO-BETA`
3. **Verificar admin panel:** https://dialecticia.vercel.app/admin/llm-management
4. **Confirmar prompts:** Deben aparecer 5+ prompts sin errores JavaScript
5. **Confirmar filósofos:** Deben aparecer 8+ filósofos activos

## 🔧 **Solución de Problemas**

### Si los prompts no aparecen:
```bash
# Verificar que el schema coincide
npx prisma db pull
npx prisma generate
```

### Si hay errores de JavaScript:
- Los endpoints de compatibilidad ya están implementados
- Los campos dummy están mapeados correctamente
- El frontend debería funcionar sin modificaciones

### Si no se puede acceder:
- Usar cualquiera de los códigos de invitación listados arriba
- Todos tienen usos disponibles

## 🎉 **Resultado Esperado**

Después de esta restauración:
- ✅ **Login funcional** con múltiples códigos disponibles
- ✅ **Admin panel sin crashes** JavaScript
- ✅ **Prompts visibles** en la interfaz de administración
- ✅ **Filósofos disponibles** para debates
- ✅ **Aplicación completamente funcional**

---

**¡La aplicación Dialecticia estará completamente restaurada y funcional en Vercel!** 🚀 