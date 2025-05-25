# Dialecticia - Roadmap 🗺️

## Visión General

Desarrollo de Dialecticia en 5 fases principales, desde MVP hasta aplicación completa con todas las funcionalidades.

---

## 🏗️ Fase 1: Fundaciones (MVP)
**Objetivo**: Base técnica funcionando con debate básico

### Setup y Arquitectura Base
- [x] Configuración Next.js con TypeScript
- [x] Setup Tailwind CSS y sistema de diseño base
- [x] Configuración Prisma + SQLite
- [x] Variables de entorno y configuración OpenAI
- [x] Estructura de carpetas y arquitectura inicial

### Base de Datos Core
- [x] Schema Prisma básico (Debates, Messages, Philosophers)
- [x] Migraciones iniciales
- [x] Seeders con filósofos de ejemplo

### API Fundamental
- [ ] `/api/debates` - CRUD básico
- [ ] `/api/philosophers` - Gestión básica
- [ ] `/api/llm` - Integración OpenAI
- [ ] Middleware de validación

### UI Base
- [ ] Layout principal con navegación
- [ ] Componente de chat básico
- [ ] Selector de tema simple
- [ ] Vista de mensaje con identificación de emisor

### Funcionalidad MVP
- [ ] Crear nuevo debate con tema
- [ ] Generar 2 filósofos automáticamente
- [ ] Chat básico entre usuario y 2 AIs
- [ ] Persistencia de conversación

**🎯 Entregable**: Debate funcional básico con 2 filósofos virtuales

---

## 🎭 Fase 2: Sistema de Filósofos
**Objetivo**: Personalidades únicas y generación inteligente

### Generación de Filósofos
- [ ] Prompts especializados para crear personalidades
- [ ] Sistema de traits y características filosóficas
- [ ] Generación de nombres creativos (ej: Platín, Aristótiles)
- [ ] Asignación automática de corrientes filosóficas

### Gestión de Personalidades
- [ ] Biblioteca de filósofos creados
- [ ] Sistema de selección (1 manual, 1 automático)
- [ ] Perfiles detallados con historial
- [ ] Persistencia de personalidades coherentes

### Diferenciación de Argumentos
- [ ] Prompts específicos por corriente filosófica
- [ ] Sistema para asegurar perspectivas contrastantes
- [ ] Memoria contextual por filósofo
- [ ] Validación de coherencia argumental

**🎯 Entregable**: Filósofos únicos con personalidades distintivas

---

## 🏛️ Fase 3: Mecánica Socrática
**Objetivo**: Debate estructurado con método socrático

### Estructura de Debate
- [ ] Ronda inicial de clarificación del tema
- [ ] Sistema de turnos estructurado
- [ ] Gestión de cambios de tema
- [ ] "Acción de oro" del usuario para control temático

### Motor Socrático
- [ ] Prompts especializados en preguntas socráticas
- [ ] Sistema de desarme de argumentos
- [ ] Progresión lógica de preguntas
- [ ] Detección y explotación de contradicciones

### Control de Flujo
- [ ] Moderación automática de debates
- [ ] Prevención de loops argumentales
- [ ] Sistema de conclusiones naturales
- [ ] Manejo de tangentes y refocusing

**🎯 Entregable**: Debates socráticos estructurados y efectivos

---

## 🗳️ Fase 4: Sistema de Votación y Social
**Objetivo**: Engagement y evaluación de calidad

### Votación por Mensaje
- [ ] UI de votación (👍/👎) por mensaje
- [ ] Tracking de votos por usuario vs IA
- [ ] Sistema de pesos (votos de participantes vs externos)
- [ ] Analytics de calidad argumental

### Métricas y Rankings
- [ ] Ranking de mejores argumentos
- [ ] Estadísticas por filósofo
- [ ] Métricas de persuasión efectiva
- [ ] Dashboard de performance

### Aspectos Sociales
- [ ] Compartir debates interesantes
- [ ] Votación externa en debates públicos
- [ ] Comentarios en debates cerrados
- [ ] Sistema de badges/achievements

**🎯 Entregable**: Sistema completo de evaluación y engagement

---

## 📚 Fase 5: Historial y Aprendizaje
**Objetivo**: Persistencia inteligente y mejora continua

### Organización de Historial
- [ ] Vista por temas con threading
- [ ] Búsqueda avanzada en debates
- [ ] Filtros por filósofos y corrientes
- [ ] Exportación de debates

### Aprendizaje Contextual
- [ ] Acceso de AIs a debates anteriores
- [ ] Mejora de argumentos basada en historial
- [ ] Detección de patrones en argumentos del usuario
- [ ] Adaptación progresiva de estrategias

### Biblioteca de Conocimiento
- [ ] Wiki de filósofos creados
- [ ] Mejores momentos y argumentos destacados
- [ ] Evolución de ideas a través del tiempo
- [ ] Insights sobre efectividad argumentativa

**🎯 Entregable**: Sistema completo con aprendizaje y memoria

---

## 🚀 Fase 6: Optimización y Escalabilidad
**Objetivo**: Aplicación lista para producción

### Performance
- [ ] Optimización de consultas DB
- [ ] Caching inteligente
- [ ] Lazy loading de historial
- [ ] Compresión y optimización de assets

### Robustez
- [ ] Testing automatizado completo
- [ ] Manejo de errores robusto
- [ ] Fallbacks para APIs externas
- [ ] Monitoring y alertas

### Deployment
- [ ] Configuración de producción
- [ ] CI/CD pipeline
- [ ] Backup automático de debates
- [ ] Documentación de deployment

**🎯 Entregable**: Aplicación completa lista para usuarios

---

## 📊 Progreso Actual

**Fase Actual**: 🏗️ Fase 1 - Fundaciones
**Progreso General**: 25% - Fundaciones establecidas

### Próximos Pasos Inmediatos:
1. Setup inicial de Next.js y dependencias
2. Configuración de base de datos
3. Primer chat funcional
4. Integración básica con OpenAI

---

## 🎯 Hitos Importantes

| Fecha Objetivo | Hito | Descripción |
|---------------|------|-------------|
| Semana 1 | MVP Funcional | Debate básico entre usuario y 2 AIs |
| Semana 2 | Filósofos Únicos | Personalidades distintivas y coherentes |
| Semana 3 | Método Socrático | Debates estructurados con preguntas efectivas |
| Semana 4 | Sistema Social | Votación y métricas de calidad |
| Semana 5 | Historial Inteligente | Persistencia y aprendizaje contextual |
| Semana 6 | Producción | Aplicación optimizada y desplegada |

---

💡 **Nota**: Este roadmap es iterativo. Cada fase se puede ajustar basada en hallazgos de la fase anterior. 