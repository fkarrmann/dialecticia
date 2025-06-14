import { Philosopher } from '@prisma/client'
import { parsePersonalityTraits, parseCoreBeliefs } from './utils'
import { getSocraticPrompt, getPhilosopherTemplate } from './prompts'
import { generatePhilosopherChatResponse } from './philosopher-chat-service'
import { LLMService } from './llm-service'
import { prisma } from './db'

console.log('🚀 LLM using ONLY new database-driven system - NO ENVIRONMENT VARIABLES, NO FALLBACKS')

// Available models for reference
const AVAILABLE_MODELS = {
  'gpt-4o': 'GPT-4o (Más avanzado, más caro)',
  'gpt-4o-mini': 'GPT-4o Mini (Balanceado)',
  'gpt-4-turbo': 'GPT-4 Turbo (Alternativo)',
  'gpt-4': 'GPT-4 (Clásico)',
} as const

export interface SocraticResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export async function generatePhilosopherResponse(
  philosopher: Philosopher & { personalityAspects?: Array<{aspectName: string, value: number}> },
  debateTopic: string,
  conversationHistory: Array<{
    sender: string
    content: string
    timestamp: Date
  }>,
  userLastMessage: string,
  specificRole?: 'SOCRATIC_MODERATOR' | 'COUNTERPOINT_PHILOSOPHER' | 'SOCRATIC_MODERATOR_PLURAL' | 'SOCRATIC_TO_USER' | 'SOCRATIC_TO_PHILOSOPHER' | 'RESPONDING_TO_SOCRATES',
  customPrompt?: string
): Promise<SocraticResponse> {
  
  console.log(`🤖 Generating response for ${philosopher.name} using ONLY NEW DATABASE SYSTEM - NO FALLBACKS`)
  
  const personality = parsePersonalityTraits(philosopher.personalityTraits)
  const beliefs = parseCoreBeliefs(philosopher.coreBeliefs)
  
  console.log('🚀 Using new database-driven LLM system...')
  
  // Usar SOLO el nuevo sistema de chat basado en base de datos
  const llmResponse = await generatePhilosopherChatResponse(
    philosopher,
    debateTopic,
    conversationHistory,
    userLastMessage,
    personality,
    beliefs,
    specificRole
  )
  
  // Adaptar la respuesta al formato esperado por el sistema legacy
  const response: SocraticResponse = {
    content: llmResponse.content,
    usage: {
      promptTokens: llmResponse.usage.inputTokens,
      completionTokens: llmResponse.usage.outputTokens,
      totalTokens: llmResponse.usage.totalTokens,
    }
  }

  console.log(`✅ Database LLM response received | Provider: ${llmResponse.provider} | Model: ${llmResponse.model} | Tokens: ${response.usage?.totalTokens} | Cost: $${llmResponse.cost.toFixed(6)}`)
  console.log(`📝 CONTENIDO DE RESPUESTA: "${response.content.substring(0, 200)}..."`)
  return response
}

export async function selectAntagonisticPhilosopher(
  topic: string,
  userPosition: string,
  availablePhilosophers: Array<{
    id: string
    name: string
    description: string
    philosophicalSchool: string
    argumentStyle?: string
    questioningApproach?: string
  }>
): Promise<{
  suggestedPhilosopherId: string
  reasoning: string
}> {
  // Preparar el contexto de filósofos disponibles
  const philosophersContext = availablePhilosophers.map(p => 
    `- ${p.name} (${p.philosophicalSchool}): ${p.description}${p.argumentStyle ? ` | Estilo: ${p.argumentStyle}` : ''}${p.questioningApproach ? ` | Enfoque: ${p.questioningApproach}` : ''}`
  ).join('\n')

  console.log('🧠 Analizando tema y postura para selección antagónica...', {
    topic: topic.substring(0, 100) + '...',
    userPosition: userPosition.substring(0, 100) + '...',
    availableCount: availablePhilosophers.length
  })

  // Usar el nuevo sistema de prompts
  const promptResponse = await executePrompt('antagonistic_selection', {
    TEMA: topic,
    POSTURA_USUARIO: userPosition,
    FILOSOFOS_DISPONIBLES: philosophersContext
  })

  if (!promptResponse.success) {
    throw new Error('Error executing antagonistic_selection prompt: ' + promptResponse.error)
  }

  console.log('📝 Respuesta del sistema de prompts:', promptResponse.content?.substring(0, 200) + '...')

  console.log('🔍 Prompt response received:', promptResponse)

  // Handle markdown code blocks if present
  let jsonContent = promptResponse.content || '{}'
  
  try {
    // Remove markdown code blocks if present
    const codeBlockMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1].trim()
    }

    const parsed = JSON.parse(jsonContent)
    
    if (!parsed.suggestedPhilosopherId || !parsed.reasoning) {
      throw new Error('Invalid response format: missing required fields')
    }

    // Verificar que el filósofo sugerido existe en la lista
    const suggestedPhilosopher = availablePhilosophers.find(p => p.id === parsed.suggestedPhilosopherId)
    if (!suggestedPhilosopher) {
      throw new Error(`Suggested philosopher ${parsed.suggestedPhilosopherId} not found in available list`)
    }

    console.log('✅ Filósofo antagónico seleccionado:', {
      id: parsed.suggestedPhilosopherId,
      name: suggestedPhilosopher.name,
      reasoning: parsed.reasoning.substring(0, 100) + '...'
    })

    return {
      suggestedPhilosopherId: parsed.suggestedPhilosopherId,
      reasoning: parsed.reasoning
    }

  } catch (parseError) {
    console.error('❌ Error parsing antagonistic selection response:', parseError)
    console.error('Raw content:', jsonContent)
    throw new Error('Failed to parse antagonistic philosopher selection response')
  }
}

export async function executePrompt(
  promptName: string, 
  variables: Record<string, string>
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    console.log(`🎯 Executing prompt: ${promptName}`)
    
    // Buscar el prompt template
    const promptTemplate = await prisma.promptTemplate.findFirst({
      where: { 
        name: promptName,
        isActive: true 
      }
    })
    
    if (!promptTemplate) {
      throw new Error(`Prompt template "${promptName}" no encontrado o está desactivado`)
    }
    
    // Reemplazar variables en el prompt
    let finalPrompt = promptTemplate.template
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`
      finalPrompt = finalPrompt.replace(new RegExp(placeholder, 'g'), value)
    })
    
    // Usar el LLMService para hacer la llamada
    const response = await LLMService.callLLM({
      functionName: promptName,
      messages: [
        {
          role: 'system',
          content: finalPrompt
        },
        {
          role: 'user',
          content: 'Procede con el análisis según las instrucciones.'
        }
      ],
      temperature: 0.7,
      maxTokens: 500
    })
    
    console.log(`✅ Prompt executed successfully: ${promptName}`)
    return {
      success: true,
      content: response.content
    }
  } catch (error) {
    console.error(`❌ Error executing prompt ${promptName}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 