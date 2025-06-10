# 🏛️ Dialecticia

**Plataforma de diálogo socrático con filósofos virtuales basada en IA**

Una aplicación web innovadora que permite a los usuarios participar en debates filosóficos profundos con filósofos virtuales impulsados por inteligencia artificial, utilizando la metodología socrática clásica adaptada para el siglo XXI.

## ✨ Características Principales

### 🎭 Filósofos Virtuales
- **18+ filósofos únicos** con personalidades auténticas basadas en escuelas filosóficas reales
- Cada filósofo tiene **aspectos de personalidad únicos** y **trade-offs filosóficos** específicos
- Sistemas de **creencias fundamentales** y **enfoques argumentativos** distintivos

### 🌟 Timeline Socrático
- **Sistema de etapas progresivas** que guía el diálogo siguiendo el método socrático auténtico:
  - **Bienvenida**: Invitación al debate
  - **Provocación**: Formulación de preguntas fundamentales
  - **Definición**: Exploración de conceptos clave
  - **Élenchos**: Refutación y contradicciones
  - **Aporía**: Reconocimiento de la ignorancia
  - **Búsqueda**: Construcción colaborativa de conocimiento

### 🎛️ Panel de Administración Avanzado
- **Gestión de LLM**: Configuración de proveedores de IA (Anthropic Claude, OpenAI, etc.)
- **Editor de Timeline Visual**: Interfaz intuitiva para configurar las etapas socráticas
- **Sistema de Presets**: Configuraciones predefinidas (Académico, Moderno, Intenso)
- **Gestión de Invitaciones**: Sistema de códigos de acceso y control de usuarios

### 🤖 Integración de IA Avanzada
- **Múltiples proveedores LLM** soportados
- **Prompts dinámicos** adaptados por etapa y personalidad del filósofo
- **Sistema de compatibilidad** entre Timeline Socrático y personalidades tradicionales
- **Métricas y costos** de uso de IA en tiempo real

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: SQLite (desarrollo) / PostgreSQL (producción)
- **UI**: Tailwind CSS, Radix UI, Lucide Icons
- **IA**: Anthropic Claude, OpenAI GPT
- **Deployment**: Vercel

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm o yarn
- SQLite (desarrollo)

### Instalación

1. **Clonar repositorio**
```bash
git clone https://github.com/fkarrmann/dialecticia.git
cd dialecticia
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Editar `.env.local` con tus claves de API:
```env
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="your_anthropic_key_here"
OPENAI_API_KEY="your_openai_key_here"
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3001"
```

4. **Configurar base de datos**
```bash
npx prisma migrate deploy
npx prisma db seed
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3001`

## 📁 Estructura del Proyecto

```
dialecticia/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Panel de administración
│   │   ├── api/               # API Routes
│   │   ├── debate/            # Páginas de debate
│   │   └── login/             # Autenticación
│   ├── components/            # Componentes React
│   │   ├── admin/             # Componentes admin
│   │   ├── debate/            # Componentes de debate
│   │   ├── philosopher/       # Componentes de filósofos
│   │   └── ui/                # Componentes base
│   ├── lib/                   # Utilidades y servicios
│   ├── hooks/                 # React Hooks personalizados
│   ├── store/                 # Estado global
│   └── types/                 # Tipos TypeScript
├── prisma/                    # Esquema y migraciones de BD
├── public/                    # Archivos estáticos
└── docs/                      # Documentación
```

## 🔧 Configuración de IA

### Proveedores Soportados
- **Anthropic Claude** (Recomendado)
- **OpenAI GPT-4**
- **Otros proveedores** (fácil extensión)

### Timeline Socrático
Configura las etapas del diálogo desde el panel admin:
1. Ve a `/admin/llm-management`
2. Selecciona "Timeline Socrático"
3. Ajusta etapas, tonos e intensidades
4. Aplica presets o crea configuraciones personalizadas

## 🎯 Uso

1. **Crear cuenta** con código de invitación
2. **Seleccionar filósofo** de la galería
3. **Iniciar debate** con un tema filosófico
4. **Participar** en el diálogo socrático guiado
5. **Explorar** diferentes perspectivas y enfoques

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🙏 Reconocimientos

- Inspirado en la tradición filosófica socrática
- Powered by Anthropic Claude y OpenAI
- Diseño basado en principios de UX moderno
- Comunidad open source

---

**Dialecticia** - *Donde la sabiduría antigua encuentra la tecnología moderna* 🏛️✨