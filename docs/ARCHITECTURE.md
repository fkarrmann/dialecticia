# Dialecticia - Arquitectura Técnica 🏗️

## Visión General

Dialecticia utiliza una arquitectura full-stack moderna con Next.js, centrada en la generación inteligente de debates socráticos mediante IA.

## 🏛️ Arquitectura de Alto Nivel

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │◄──►│   (API Routes)  │◄──►│   (OpenAI)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Components    │    │   Database      │    │   LLM APIs      │
│   (React/TSX)   │    │   (Prisma)      │    │   (Multiple)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🎯 Stack Tecnológico

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand (global) + React State (local)
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

### Backend
- **API**: Next.js API Routes
- **Database**: SQLite (dev) → PostgreSQL (prod)
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: NextAuth.js (futuro)

### External Services
- **Primary LLM**: OpenAI GPT-4
- **Backup LLMs**: Anthropic Claude, Google Gemini
- **Real-time**: Server-Sent Events (SSE)

---

## 📊 Modelo de Datos

### Core Entities

```prisma
model Philosopher {
  id              String   @id @default(cuid())
  name            String
  description     String
  personalityTraits Json
  philosophicalSchool String
  createdAt       DateTime @default(now())
  
  // Relations
  participations  DebateParticipant[]
  messages       Message[]
}

model Debate {
  id          String   @id @default(cuid())
  topic       String
  status      DebateStatus
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  messages      Message[]
  participants  DebateParticipant[]
}

model Message {
  id          String   @id @default(cuid())
  content     String
  senderType  SenderType
  debateId    String
  philosopherId String?
  timestamp   DateTime @default(now())
  
  // Relations
  debate      Debate @relation(fields: [debateId], references: [id])
  philosopher Philosopher? @relation(fields: [philosopherId], references: [id])
  votes       Vote[]
}

model Vote {
  id        String   @id @default(cuid())
  messageId String
  voterType VoterType
  value     Int      // -1, 0, 1
  createdAt DateTime @default(now())
  
  // Relations
  message   Message @relation(fields: [messageId], references: [id])
}
```

### Enums

```typescript
enum DebateStatus {
  TOPIC_CLARIFICATION = "TOPIC_CLARIFICATION"
  ACTIVE_DEBATE = "ACTIVE_DEBATE"
  CONCLUDED = "CONCLUDED"
}

enum SenderType {
  USER = "USER"
  PHILOSOPHER = "PHILOSOPHER"
  SYSTEM = "SYSTEM"
}

enum VoterType {
  USER = "USER"
  PHILOSOPHER = "PHILOSOPHER"
  EXTERNAL = "EXTERNAL"
}
```

---

## 🔄 Flujo de Datos

### 1. Inicio de Debate
```
User Input (Topic) → API (/api/debates) → Philosopher Generation → DB Save → UI Update
```

### 2. Generación de Filósofos
```
Topic Analysis → LLM Prompt → Philosopher Creation → Personality Assignment → DB Save
```

### 3. Mensaje en Debate
```
User Message → DB Save → Context Building → LLM Call → Response Generation → DB Save → UI Update
```

### 4. Sistema de Votación
```
Vote Input → Validation → DB Save → Vote Aggregation → UI Update
```

---

## 🎭 Sistema de Filósofos

### Generación Inteligente
```typescript
interface PhilosopherProfile {
  name: string;              // ej: "Platín" (inspired by Platón)
  school: string;            // ej: "Idealismo Clásico"
  coreBeliefs: string[];     // Creencias fundamentales
  argumentStyle: string;     // Estilo de argumentación
  questioningApproach: string; // Approach socrático
  personalityTraits: {
    formality: number;       // 1-10
    aggression: number;      // 1-10
    humor: number;          // 1-10
    complexity: number;     // 1-10
  };
}
```

### Motor de Diferenciación
- **Análisis del tema** → Identificación de perspectivas opuestas
- **Selección de escuelas** → Garantizar contraste argumental
- **Asignación de roles** → Definir quién ataca qué aspectos
- **Calibración de personalidad** → Evitar solapamiento de estilos

---

## 🏛️ Motor Socrático

### Prompt Engineering
```typescript
interface SocraticPrompt {
  systemPrompt: string;      // Personalidad del filósofo
  contextPrompt: string;     // Estado actual del debate
  methodPrompt: string;      // Instrucciones socráticas
  constraintsPrompt: string; // Limitaciones y objetivos
}
```

### Estrategias de Desarme
1. **Definición de términos**: "¿Qué entiendes exactamente por...?"
2. **Exploración de consecuencias**: "Si eso fuera cierto, entonces..."
3. **Búsqueda de contradicciones**: "Pero antes dijiste que..."
4. **Casos límite**: "¿Tu idea aplica también cuando...?"
5. **Fundamentos**: "¿En qué basas esa afirmación?"

---

## 🔧 API Design

### Endpoints Core

```typescript
// Debates
POST   /api/debates          // Crear nuevo debate
GET    /api/debates/:id      // Obtener debate específico
PUT    /api/debates/:id      // Actualizar estado del debate
DELETE /api/debates/:id      // Eliminar debate

// Messages
POST   /api/debates/:id/messages  // Enviar mensaje
GET    /api/debates/:id/messages  // Obtener mensajes
POST   /api/messages/:id/vote     // Votar mensaje

// Philosophers
GET    /api/philosophers           // Lista de filósofos
POST   /api/philosophers           // Crear filósofo manual
GET    /api/philosophers/:id       // Perfil detallado
GET    /api/philosophers/:id/stats // Estadísticas del filósofo

// LLM Integration
POST   /api/llm/generate-philosopher  // Generar nuevo filósofo
POST   /api/llm/debate-response       // Generar respuesta en debate
POST   /api/llm/analyze-topic         // Analizar tema propuesto
```

### Error Handling
```typescript
interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Códigos de error estándar
enum ErrorCodes {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  LLM_SERVICE_ERROR = "LLM_SERVICE_ERROR",
  DEBATE_NOT_FOUND = "DEBATE_NOT_FOUND",
  PHILOSOPHER_GENERATION_FAILED = "PHILOSOPHER_GENERATION_FAILED"
}
```

---

## 🎨 Arquitectura de Componentes

### Estructura de Carpetas
```
src/
├── app/                    # Next.js App Router
│   ├── (debates)/         # Grupo de rutas de debates
│   ├── api/               # API Routes
│   └── globals.css        # Estilos globales
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui style)
│   ├── debate/           # Componentes específicos de debate
│   ├── philosopher/      # Componentes de filósofos
│   └── layout/           # Componentes de layout
├── lib/                  # Utilidades y configuración
│   ├── db.ts            # Configuración Prisma
│   ├── llm.ts           # Integración LLM
│   └── utils.ts         # Utilidades generales
├── hooks/               # Custom React hooks
├── store/              # Estado global (Zustand)
└── types/              # Definiciones TypeScript
```

### Componentes Principales
```typescript
// Debate Room - Componente principal
<DebateRoom debateId={string}>
  <DebateHeader />
  <PhilosopherProfiles />
  <MessageList />
  <MessageInput />
  <VotingPanel />
</DebateRoom>

// Philosopher Library
<PhilosopherLibrary>
  <PhilosopherGrid />
  <PhilosopherDetail />
  <PhilosopherStats />
</PhilosopherLibrary>

// Topic History
<TopicHistory>
  <DebateTimeline />
  <DebatePreview />
  <SearchFilter />
</TopicHistory>
```

---

## 🔐 Seguridad y Performance

### Rate Limiting
- **LLM Calls**: 30 requests/minute por usuario
- **API Endpoints**: 100 requests/minute por IP
- **Debate Creation**: 5 debates/hour por usuario

### Caching Strategy
- **Philosopher Profiles**: Cache en memoria (1 hora)
- **Debate Messages**: Cache en Redis (24 horas)
- **LLM Responses**: Cache persistente para respuestas similares

### Error Recovery
- **LLM Fallbacks**: OpenAI → Anthropic → Google → Respuesta predeterminada
- **Database**: Connection pooling con retry automático
- **UI**: Error boundaries con fallbacks informativos

---

## 🚀 Deployment Strategy

### Development
- **Local**: SQLite + Next.js dev server
- **Hot reload**: Components y API routes
- **Testing**: Jest + React Testing Library

### Production
- **Platform**: Vercel (recomendado) o AWS
- **Database**: PostgreSQL (Supabase o AWS RDS)
- **CDN**: Automático con Vercel
- **Monitoring**: Vercel Analytics + Sentry

---

## 📈 Escalabilidad

### Horizontal Scaling
- **Stateless API**: Todos los endpoints sin estado
- **Database**: Read replicas para consultas de historial
- **LLM**: Load balancing entre providers

### Vertical Optimizations
- **Bundle splitting**: Por rutas y funcionalidades
- **Lazy loading**: Componentes y datos no críticos
- **Compression**: Gzip para todos los assets

---

💡 **Principios de Diseño**: Modularidad, testabilidad, escalabilidad y experiencia de usuario fluida. 