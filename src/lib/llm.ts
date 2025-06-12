import OpenAI from 'openai'
import { Philosopher } from '@prisma/client'
import { parsePersonalityTraits, parseCoreBeliefs } from './utils'
import { getSocraticPrompt, getPhilosopherTemplate } from './prompts'
import { generatePhilosopherChatResponse } from './philosopher-chat-service'
import { LLMService } from './llm-service'
import { prisma } from './db'

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

// Nuevo sistema: Solo usar mock si está explícitamente activado
const MOCK_MODE = process.env.LLM_MOCK_MODE === 'true'

// Initialize OpenAI client (only if we have an API key) - LEGACY SYSTEM
const openai = OPENAI_API_KEY ? new OpenAI({
  apiKey: OPENAI_API_KEY,
}) : null

if (MOCK_MODE) {
  console.log('🚧 LLM running in mock mode (explicitly enabled)')
} else {
  console.log('🚀 LLM using new database-driven system')
}

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
  customPrompt?: string // NUEVO PARÁMETRO
): Promise<SocraticResponse> {
  
  console.log(`🤖 Generating response for ${philosopher.name} using NEW DATABASE SYSTEM`)
  
  if (MOCK_MODE) {
    console.log('📝 Using mock response system')
    return generateMockResponse(philosopher, userLastMessage)
  }

  const personality = parsePersonalityTraits(philosopher.personalityTraits)
  const beliefs = parseCoreBeliefs(philosopher.coreBeliefs)
  
  try {
    console.log('🚀 Using new database-driven LLM system...')
    
    // Usar el nuevo sistema de chat basado en base de datos
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

  } catch (error) {
    console.error('❌ Error using new database system:', error)
    
    // Para debugging: Detectar si el error es por prompt desactivado/no encontrado
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    const isPromptError = errorMessage.includes('no encontrado') || 
                         errorMessage.includes('not found') || 
                         errorMessage.includes('desactivado') ||
                         errorMessage.includes('No se encontró prompt template') ||
                         errorMessage.includes('prompt template') ||
                         errorMessage.includes('Prompt template') ||
                         errorMessage.includes('philosopher_chat_system') ||
                         errorMessage.includes('está desactivado')
    
    if (isPromptError) {
      console.error('🚨 PROMPT ERROR DETECTED FOR DEBUGGING:')
      console.error(`   🔴 Philosopher: ${philosopher.name}`)
      console.error(`   🔴 Error: ${errorMessage}`)
      console.error('   🔴 This is expected during debugging when prompts are deactivated')
      
      // Extraer el nombre del prompt del error si es posible
      let promptName = 'desconocido'
      if (errorMessage.includes('philosopher_chat_system')) {
        promptName = 'philosopher_chat_system'
      } else if (errorMessage.includes('socratic_to_user')) {
        promptName = 'socratic_to_user'
      } else if (errorMessage.includes('socratic_to_philosopher')) {
        promptName = 'socratic_to_philosopher'
      } else if (errorMessage.includes('responding_to_socrates')) {
        promptName = 'responding_to_socrates'
      }
      
      // Retornar un error claro y simple para debugging
      throw new Error(`PROMPT_DEBUGGING_ERROR: Prompt '${promptName}' requerido para ${philosopher.name} está desactivado o no existe`)
    }
    
    console.log('🔄 Using mock response fallback for non-prompt errors')
    const mockResponse = generateMockResponse(philosopher, userLastMessage)
    console.log('📝 Mock response generated:', {
      philosopher: philosopher.name,
      contentLength: mockResponse.content.length,
      contentPreview: mockResponse.content.substring(0, 100) + '...',
      usage: mockResponse.usage
    })
    return mockResponse
  }
}

// Mock responses mejoradas para desarrollo sin API key
function generateMockResponse(philosopher: Philosopher, userMessage: string): SocraticResponse {
  console.log(`🎭 Generating mock response for ${philosopher.name} responding to: "${userMessage.substring(0, 50)}..."`)
  
  const mockResponses = {
    "Sócrato": [
      `Interesante perspectiva, pero dime: ¿qué entiendes exactamente por "${extractKeyTerm(userMessage)}"? Porque si no podemos definir claramente nuestros términos, ¿cómo podemos estar seguros de que estamos hablando de lo mismo?\n\n¿No te parece curioso que des por sentado algo que ni siquiera has examinado? Como yo suelo decir, solo sé que no sé nada, pero tú pareces muy seguro de tu posición.`,
      
      `Hmm, pero ¿has considerado las implicaciones de lo que dices? Si tu idea fuera completamente cierta, ¿no debería llevarnos a conclusiones que contradicen tu experiencia diaria?\n\nPermíteme hacerte una pregunta que quizás te incomode: ¿en qué te basas para estar tan seguro? ¿Acaso la certeza no es muchas veces la enemiga de la sabiduría?`,
      
      `Me parece que asumes algo fundamental sin examinarlo. ¿Podrías explicarme exactamente por qué crees eso? Porque cuando examino mis propias creencias, encuentro que la mayoría se tambalean ante la primera pregunta seria.\n\n¿No crees que deberíamos ser más honestos sobre lo poco que realmente sabemos?`
    ],
    
    "Platín": [
      `Tu argumento se basa en apariencias sensibles, pero ¿no consideras que los sentidos nos engañan constantemente? Lo que percibes como real podría ser meramente una sombra de la verdadera realidad de las Ideas.\n\n¿No te recuerda esto a los prisioneros de mi caverna, que confunden las sombras proyectadas en la pared con la realidad misma?`,
      
      `Estás mezclando el mundo sensible con el inteligible. ¿Acaso la verdad que buscas no debería encontrarse en el reino de las Ideas perfectas, más allá de estas imperfecciones materiales?\n\nDime, ¿qué es más real: la justicia imperfecta que vemos en este mundo, o la Idea perfecta de Justicia que contemplamos con el intelecto?`,
      
      `Como alguien aún encadenado en la caverna, confundes las sombras con la realidad. ¿No crees que deberías ascender dialécticamente hacia el conocimiento verdadero?\n\n¿Te has preguntado si lo que defiendes tiene existencia real, o es apenas un reflejo imperfecto de algo mucho más elevado?`
    ],
    
    "Aristótiles": [
      `Tu teoría suena hermosa, pero ¿dónde está la evidencia empírica? Sin ejemplos concretos de la experiencia, ¿no estamos simplemente especulando en el vacío?\n\nComo buen discípulo de la observación, te pregunto: ¿puedes mostrarme al menos tres casos reales donde tu idea funcione consistentemente?`,
      
      `Veo que generalizas a partir de casos limitados. ¿Has considerado todas las variables y excepciones? La inducción rigurosa requiere más que unos pocos ejemplos.\n\n¿No te parece precipitado concluir tanto a partir de tan poca evidencia? En mi experiencia, la naturaleza es mucho más compleja de lo que nuestras primeras teorías sugieren.`,
      
      `Hablemos con los pies en la tierra: ¿tu idea funciona en la práctica real? Porque una teoría que no se puede aplicar es tan útil como un martillo de papel.\n\n¿Has pensado en las consecuencias prácticas de implementar lo que propones? A veces las ideas más bellas resultan ser las más impracticables.`
    ],
    
    "Nietschka": [
      `¡Ajá! Detecto valores heredados sin examinar. ¿Esas ideas realmente son tuyas, o simplemente repites lo que te enseñaron los "buenos"? ¡Es hora de crear tus propios valores!\n\n¿Tienes el coraje de preguntarte de dónde vienen realmente tus convicciones? ¿O prefieres la comodidad tibia del rebaño?`,
      
      `Tu moral me huele a rebaño. ¿Por qué debería ser "bueno" lo que dices? ¿Quién decidió eso? ¡Libérate de esas cadenas y piensa más allá del bien y del mal!\n\n¿No es hora de que te conviertas en el arquitecto de tus propios valores, en lugar de ser un simple inquilino en la casa moral que otros construyeron?`,
      
      `¿Sabes qué veo en tu argumento? Miedo. Miedo a la libertad terrible de crear significado propio. ¿No es hora de que abraces el abismo y danses sobre él?\n\nDime, ¿qué pasaría si todo lo que crees "bueno" fuera solo una máscara para esconder tu debilidad? ¿Te atreves a mirar detrás de esa máscara?`
    ]
  }

  const responses = mockResponses[philosopher.name as keyof typeof mockResponses] || mockResponses["Sócrato"]
  const randomResponse = responses[Math.floor(Math.random() * responses.length)]

  console.log(`✅ Mock response selected for ${philosopher.name}: "${randomResponse.substring(0, 80)}..."`)

  return {
    content: randomResponse,
    usage: {
      promptTokens: 150,
      completionTokens: 80,
      totalTokens: 230
    }
  }
}

function extractKeyTerm(message: string): string {
  // Extraer un término clave para usar en preguntas socráticas
  const words = message.split(' ').filter(word => word.length > 5)
  return words[Math.floor(Math.random() * words.length)] || "eso"
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
  try {
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
      
      console.log('🔍 JSON content to parse:', jsonContent)
      const parsed = JSON.parse(jsonContent)
      
      if (!parsed.suggestedPhilosopher || !parsed.reasoning) {
        throw new Error('Respuesta incompleta del LLM')
      }

      // Buscar el filósofo por nombre (con búsqueda flexible)
      const suggestedPhilosopher = availablePhilosophers.find(p => 
        p.name.toLowerCase() === parsed.suggestedPhilosopher.toLowerCase() ||
        p.name.toLowerCase().includes(parsed.suggestedPhilosopher.toLowerCase()) ||
        parsed.suggestedPhilosopher.toLowerCase().includes(p.name.toLowerCase())
      )

      if (!suggestedPhilosopher) {
        console.warn('⚠️ Filósofo sugerido no encontrado:', parsed.suggestedPhilosopher)
        console.warn('Filósofos disponibles:', availablePhilosophers.map(p => p.name))
        
        // Retornar el primero como fallback
        return {
          suggestedPhilosopherId: availablePhilosophers[0].id,
          reasoning: `Filósofo sugerido "${parsed.suggestedPhilosopher}" no encontrado. Selección automática por defecto: ${availablePhilosophers[0].name}`
        }
      }

      console.log('✅ Filósofo antagónico seleccionado:', {
        id: suggestedPhilosopher.id,
        name: suggestedPhilosopher.name,
        school: suggestedPhilosopher.philosophicalSchool,
        reasoning: parsed.reasoning.substring(0, 100) + '...'
      })

      return {
        suggestedPhilosopherId: suggestedPhilosopher.id,
        reasoning: parsed.reasoning
      }

    } catch (parseError) {
      console.error('❌ Error parseando respuesta JSON del prompt antagonistic_selection:', parseError)
      console.error('📝 Contenido original recibido:', promptResponse.content)
      console.error('🔍 Contenido que se intentó parsear:', jsonContent)
      
      // Fallback to first available philosopher
      console.log('🔄 Usando fallback: primer filósofo disponible')
      return {
        suggestedPhilosopherId: availablePhilosophers[0].id,
        reasoning: 'Error en análisis automático. Selección por defecto del primer filósofo disponible.'
      }
    }

  } catch (error) {
    console.error('❌ Error en selectAntagonisticPhilosopher:', error)
    
    // Comprobar si es un error de debugging de prompts
    if (error instanceof Error && error.message.includes('PROMPT_DEBUGGING_ERROR')) {
      console.log('🚨 PROMPT ERROR DETECTED FOR DEBUGGING:')
      console.log('   🔴 Function: antagonistic_selection')
      console.log('   🔴 Error:', error.message)
      throw error // Re-lanzar el error para que sea manejado por el UI de debugging
    }
    
    // Fallback: seleccionar el primero disponible
    return {
      suggestedPhilosopherId: availablePhilosophers[0].id,
      reasoning: 'Error en el sistema de selección. Selección automática por defecto.'
    }
  }
}

/**
 * Helper function to execute prompts using the new LLM system
 */
export async function executePrompt(
  promptName: string, 
  variables: Record<string, string>
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
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
    
    return {
      success: true,
      content: response.content
    }
    
  } catch (error) {
    console.error(`❌ Error ejecutando prompt ${promptName}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
} 