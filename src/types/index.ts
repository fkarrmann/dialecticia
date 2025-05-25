import { Debate, Philosopher, Message, Vote, User, DebateParticipant } from '@prisma/client'

// Extended types with relations
export type PhilosopherWithStats = Philosopher & {
  _count: {
    participations: number
    messages: number
    votes: number
  }
}

export type DebateWithDetails = Debate & {
  messages: (Message & {
    philosopher?: Philosopher
    user?: User
    votes: Vote[]
  })[]
  participants: (DebateParticipant & {
    philosopher: Philosopher
  })[]
  user?: User
}

export type MessageWithDetails = Message & {
  philosopher?: Philosopher
  user?: User
  votes: Vote[]
}

// Personality traits interface
export interface PhilosopherPersonality {
  formality: number      // 1-10: Formal vs Casual
  aggression: number     // 1-10: Gentil vs Agresivo
  humor: number          // 1-10: Serio vs Divertido
  complexity: number     // 1-10: Simple vs Complejo
  patience: number       // 1-10: Impaciente vs Paciente
  creativity: number     // 1-10: Literal vs Creativo
}

// Debate context for AI
export interface DebateContext {
  topic: string
  currentPhase: string
  turnCount: number
  participants: {
    user: boolean
    philosophers: string[]
  }
  keyArguments: string[]
  contradictions: string[]
  currentFocus: string
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// LLM Response types
export interface LLMResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// Debate creation request
export interface CreateDebateRequest {
  topic: string
  description?: string
  selectedPhilosopherId?: string
}

// Message creation request
export interface CreateMessageRequest {
  content: string
  debateId: string
} 