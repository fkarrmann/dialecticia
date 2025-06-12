import { prisma } from '@/lib/db'
import { LLMService } from '@/lib/llm-service'
import { Philosopher } from '@prisma/client'

export interface PhilosopherChatOptions {
  philosopher: Philosopher & { personalityAspects?: Array<{aspectName: string, value: number}> }
  personality: Record<string, number>
  beliefs: string[]
  specificRole?: 'SOCRATIC_MODERATOR' | 'COUNTERPOINT_PHILOSOPHER' | 'SOCRATIC_MODERATOR_PLURAL' | 'SOCRATIC_TO_USER' | 'SOCRATIC_TO_PHILOSOPHER' | 'RESPONDING_TO_SOCRATES'
}

/**
 * Construye el prompt de sistema para un filósofo usando la base de datos
 * Reemplaza la función buildSystemPrompt hardcodeada
 */
export async function buildPhilosopherChatPrompt(options: PhilosopherChatOptions): Promise<string> {
  const { philosopher, personality, beliefs, specificRole } = options
  
  try {
    console.log(`🎭 Construyendo prompt de chat para ${philosopher.name}...`)
    
    // Manejo especial para Sócrates (usa prompts socráticos específicos)
    const isSocrates = philosopher.name === 'Sócrato'
    
    if (isSocrates) {
      console.log('👑 Es Sócrates, usando prompts socráticos específicos...')
      
      // Obtener el prompt socrático apropiado basado en el rol
      let socraticPromptName = 'socratic_default'
      
      switch (specificRole) {
        case 'SOCRATIC_MODERATOR_PLURAL':
          socraticPromptName = 'socratic_moderator_plural'
          break
        case 'SOCRATIC_TO_USER':
          socraticPromptName = 'socratic_to_user'
          break
        case 'SOCRATIC_TO_PHILOSOPHER':
          socraticPromptName = 'socratic_to_philosopher'
          break
        default:
          socraticPromptName = 'socratic_default'
      }
      
      const socraticPrompt = await prisma.promptTemplate.findFirst({
        where: { 
          name: socraticPromptName,
          isActive: true 
        }
      })
      
      if (socraticPrompt) {
        console.log(`✅ Usando prompt socrático: ${socraticPromptName}`)
        console.log(`📋 PROMPT DETAILS:`)
        console.log(`   📌 ID: ${socraticPrompt.id}`)
        console.log(`   📌 Nombre: ${socraticPrompt.name}`)
        console.log(`   📌 Contenido: ${socraticPrompt.template.substring(0, 100)}...`)
        return socraticPrompt.template
      } else {
        console.warn(`⚠️ No se encontró prompt socrático ${socraticPromptName}, usando fallback`)
        throw new Error(`Prompt socrático ${socraticPromptName} no encontrado`)
      }
    }
    
    // Para filósofos respondiendo a Sócrates
    if (specificRole === 'RESPONDING_TO_SOCRATES') {
      console.log('💬 Filósofo respondiendo a Sócrates...')
      
      const respondingPrompt = await prisma.promptTemplate.findFirst({
        where: { 
          name: 'responding_to_socrates',
          isActive: true 
        }
      })
      
      if (respondingPrompt) {
        console.log('✅ Usando prompt responding_to_socrates')
        console.log(`📋 PROMPT DETAILS:`)
        console.log(`   📌 ID: ${respondingPrompt.id}`)
        console.log(`   📌 Nombre: ${respondingPrompt.name}`)
        console.log(`   📌 Contenido: ${respondingPrompt.template.substring(0, 100)}...`)
        return respondingPrompt.template.replace('[FILÓSOFO]', philosopher.name)
      } else {
        console.warn('⚠️ No se encontró prompt responding_to_socrates, usando fallback')
        throw new Error('Prompt responding_to_socrates no encontrado')
      }
    }
    
    // Para filósofos normales: usar el nuevo prompt philosopher_chat_system
    console.log('🤖 Filósofo normal, usando prompt de base de datos...')
    
    const promptTemplate = await prisma.promptTemplate.findFirst({
      where: { 
        name: 'philosopher_chat_system',
        isActive: true 
      }
    })
    
    if (!promptTemplate) {
      console.error('❌ No se encontró prompt philosopher_chat_system en la base de datos')
      throw new Error('Prompt template philosopher_chat_system no encontrado en la base de datos')
    }
    
    console.log('✅ Usando prompt philosopher_chat_system de la base de datos')
    console.log(`📋 PROMPT DETAILS:`)
    console.log(`   📌 ID: ${promptTemplate.id}`)
    console.log(`   📌 Nombre: ${promptTemplate.name}`)
    console.log(`   📌 Contenido original: ${promptTemplate.template.substring(0, 100)}...`)
    
    // Construir información de trade-offs
    let tradeOffsInfo = ''
    if (philosopher.personalityAspects && philosopher.personalityAspects.length > 0) {
      const getTradeOffLabel = (aspectName: string, value: number): string => {
        const tradeOffs: Record<string, {left: string, right: string}> = {
          'Enfoque Cognitivo': { left: 'Creativo', right: 'Conservador' },
          'Orientación Práctica': { left: 'Idealista', right: 'Pragmático' },
          'Método de Conocimiento': { left: 'Intuitivo', right: 'Sistemático' },
          'Actitud hacia el Cambio': { left: 'Revolucionario', right: 'Tradicional' },
          'Estilo de Razonamiento': { left: 'Sintético', right: 'Analítico' }
        }
        
        const tradeOff = tradeOffs[aspectName]
        if (!tradeOff) return 'Equilibrado'
        
        if (value <= 2) return tradeOff.left
        if (value >= 8) return tradeOff.right
        if (value <= 4) return `Más ${tradeOff.left}`
        if (value >= 6) return `Más ${tradeOff.right}`
        return 'Equilibrado'
      }

      const tradeOffsList = philosopher.personalityAspects
        .map(aspect => `• ${aspect.aspectName}: ${getTradeOffLabel(aspect.aspectName, aspect.value)} (${aspect.value}/10)`)
        .join('\n')
      
      tradeOffsInfo = `\n\nTRADE-OFFS FILOSÓFICOS ESPECÍFICOS:\n${tradeOffsList}\n\nIMPORTANTE: Estos trade-offs definen tu personalidad filosófica única. ÚSALOS para determinar cómo respondes, qué enfatizas, y tu estilo de argumentación. Por ejemplo:\n- Si eres "Revolucionario" en Actitud hacia el Cambio, desafía el status quo\n- Si eres "Sistemático" en Método de Conocimiento, busca estructura lógica\n- Si eres "Creativo" en Enfoque Cognitivo, usa analogías y perspectivas originales`
    }
    
    // Preparar las variables para reemplazo
    const variables = {
      NOMBRE: philosopher.name,
      DESCRIPCIÓN: philosopher.description,
      CREENCIAS_CENTRALES: beliefs.map(belief => `• ${belief}`).join('\n'),
      ESTILO_ARGUMENTACION: philosopher.argumentStyle,
      ENFOQUE_CUESTIONAMIENTO: philosopher.questioningApproach,
      FORMALIDAD: String(personality.formality || 5),
      AGRESIVIDAD: String(personality.aggression || 5),
      HUMOR: String(personality.humor || 5),
      COMPLEJIDAD: String(personality.complexity || 5),
      TRADE_OFFS_INFO: tradeOffsInfo
    }
    
    // Reemplazar todas las variables en el prompt
    let finalPrompt = promptTemplate.template
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`
      if (finalPrompt.includes(placeholder)) {
        finalPrompt = finalPrompt.replace(new RegExp(placeholder, 'g'), value)
      }
    })
    
    console.log('📤 PROMPT FINAL CONSTRUIDO:')
    console.log('=' .repeat(50))
    console.log(finalPrompt)
    console.log('=' .repeat(50))
    
    return finalPrompt
    
  } catch (error) {
    console.error(`❌ Error construyendo prompt para ${philosopher.name}:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    throw new Error(`La IA no está respondiendo correctamente para la construcción del prompt: ${errorMessage}`)
  }
}

/**
 * Obtiene la configuración de etapas conversacionales desde la base de datos
 */
async function getConversationSettings() {
  try {
    // Por ahora usar configuración por defecto ya que no tenemos un modelo específico para esto
    console.warn('⚠️ Usando configuración conversation_settings por defecto')
    return getDefaultConversationSettings()
    
  } catch (error) {
    console.error('❌ Error cargando configuración de conversación:', error)
    return getDefaultConversationSettings()
  }
}

/**
 * ADAPTADOR DE COMPATIBILIDAD: Convierte Timeline Socrático al formato viejo
 */
function adaptSocraticTimelineToOldFormat(socraticStages: any): any {
  // Mapear etapas socráticas a fases conversacionales clásicas
  const stageMapping = {
    bienvenida: 'initial',
    provocacion: 'development', 
    definicion: 'intermediate',
    elenchos: 'advanced',
    aporia: 'advanced',
    busqueda: 'deep'
  }

  const adaptedStages: any = {}
  
  // Procesar cada etapa socrática (ahora es un objeto)
  Object.entries(socraticStages).forEach(([stageKey, stageData]: [string, any]) => {
    // Extraer el nombre base de la etapa (ej: "bienvenida_1_1" -> "bienvenida")
    const stageName = stageKey.split('_')[0]
    const mappedName = stageMapping[stageName as keyof typeof stageMapping]
    
    if (mappedName && !adaptedStages[mappedName]) {
      adaptedStages[mappedName] = {
        min: stageData.min_messages,
        max: stageData.max_messages,
        tone: getToneFromIntensity(stageData.intensity),
        style: getStyleFromSocraticStage(stageName),
        description: stageData.description || `Fase ${mappedName} adaptada del timeline socrático`
      }
    }
  })

  // Completar con defaults si faltan etapas
  const defaultStages = getDefaultConversationSettings().conversation_stages
  Object.keys(defaultStages).forEach(key => {
    if (!adaptedStages[key]) {
      adaptedStages[key] = (defaultStages as any)[key]
    }
  })

  return {
    conversation_stages: adaptedStages,
    response_guidance: {
      use_message_index: true,
      adapt_tone_by_stage: true,
      reference_previous_messages: true,
      escalate_philosophical_method: true
    }
  }
}

/**
 * Convierte intensidad socrática a tono conversacional
 */
function getToneFromIntensity(intensity: number): string {
  if (intensity <= 3) return 'formal'
  if (intensity <= 5) return 'confident'
  if (intensity <= 7) return 'direct'
  if (intensity <= 8) return 'challenging'
  return 'familiar'
}

/**
 * Convierte etapa socrática a estilo conversacional
 */
function getStyleFromSocraticStage(stageName: string): string {
  const styleMap = {
    bienvenida: 'presentation',
    provocacion: 'building_arguments',
    definicion: 'questioning',
    elenchos: 'contradictions',
    aporia: 'contradictions',
    busqueda: 'synthesis'
  }
  return styleMap[stageName as keyof typeof styleMap] || 'questioning'
}

/**
 * Configuración por defecto de etapas conversacionales
 */
function getDefaultConversationSettings() {
  return {
    conversation_stages: {
      initial: {
        min: 1,
        max: 2,
        tone: "formal",
        style: "presentation",
        description: "Fase inicial formal donde el filósofo se presenta y plantea su posición de manera estructurada"
      },
      development: {
        min: 3,
        max: 5,
        tone: "confident",
        style: "building_arguments",
        description: "Desarrollo de argumentos con confianza creciente, construyendo sobre la posición inicial"
      },
      intermediate: {
        min: 6,
        max: 10,
        tone: "direct",
        style: "questioning",
        description: "Cuestionamiento directo y referencias a puntos previos de la conversación"
      },
      advanced: {
        min: 11,
        max: 15,
        tone: "challenging",
        style: "contradictions",
        description: "Contradicciones profundas usando el método filosófico completo"
      },
      deep: {
        min: 16,
        max: null,
        tone: "familiar",
        style: "synthesis",
        description: "Familiaridad personal, síntesis y conclusiones basadas en todo el diálogo"
      }
    },
    response_guidance: {
      use_message_index: true,
      adapt_tone_by_stage: true,
      reference_previous_messages: true,
      escalate_philosophical_method: true
    }
  }
}

/**
 * Determina la fase de conversación basada en el número de respuesta
 */
async function getConversationPhase(responseIndex: number): Promise<{ stage: string; description: string; tone: string; style: string }> {
  const settings = await getConversationSettings()
  const stages = settings.conversation_stages

  // Encontrar la etapa correspondiente
  for (const [stageName, config] of Object.entries(stages)) {
    const stage = config as any
    if (responseIndex >= stage.min && (stage.max === null || responseIndex <= stage.max)) {
      return {
        stage: stageName,
        description: stage.description,
        tone: stage.tone,
        style: stage.style
      }
    }
  }

  // Fallback a la etapa más profunda
  const deepStage = stages.deep as any
  return {
    stage: 'deep',
    description: deepStage.description,
    tone: deepStage.tone,
    style: deepStage.style
  }
}

/**
 * Proporciona orientación específica según el número de respuesta
 */
async function getResponseGuidance(responseIndex: number): Promise<string> {
  const settings = await getConversationSettings()
  const phaseInfo = await getConversationPhase(responseIndex)

  // Construir orientación basada en la configuración
  let guidance = `Tu respuesta #${responseIndex} debe tener un tono ${phaseInfo.tone} y estilo ${phaseInfo.style}. `
  guidance += `${phaseInfo.description}. `

  // Orientaciones específicas adicionales basadas en la configuración
  if (settings.response_guidance.reference_previous_messages && responseIndex > 3) {
    guidance += "Referencia puntos específicos de intercambios anteriores. "
  }

  if (settings.response_guidance.escalate_philosophical_method && responseIndex > 7) {
    guidance += "Aplica tu método filosófico completo y no temas contradicciones profundas. "
  }

  if (responseIndex >= 16 && settings.response_guidance.adapt_tone_by_stage) {
    guidance += "Puedes asumir familiaridad y ser más personal en tu enfoque. "
  }

  return guidance
}

/**
 * Función de conveniencia que genera respuesta completa del filósofo usando el nuevo sistema
 */
export async function generatePhilosopherChatResponse(
  philosopher: Philosopher & { personalityAspects?: Array<{aspectName: string, value: number}> },
  debateTopic: string,
  conversationHistory: Array<{
    sender: string
    content: string
    timestamp: Date
  }>,
  userLastMessage: string,
  personality: Record<string, number>,
  beliefs: string[],
  specificRole?: 'SOCRATIC_MODERATOR' | 'COUNTERPOINT_PHILOSOPHER' | 'SOCRATIC_MODERATOR_PLURAL' | 'SOCRATIC_TO_USER' | 'SOCRATIC_TO_PHILOSOPHER' | 'RESPONDING_TO_SOCRATES'
): Promise<{
  content: string
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  provider: string
  model: string
  cost: number
  latencyMs: number
}> {
  try {
    console.log(`🎯 Generando respuesta de ${philosopher.name} usando nuevo sistema...`)
    
    // Construir el prompt de sistema usando la base de datos
    const systemPrompt = await buildPhilosopherChatPrompt({
      philosopher,
      personality,
      beliefs,
      specificRole
    })
    
    // Calcular el índice de respuesta del filósofo
    // conversationHistory incluye el mensaje del usuario actual, así que el filósofo responderá con el índice siguiente
    const responseIndex = Math.ceil(conversationHistory.length / 2) // División por 2 porque alterna usuario-filósofo
    const totalMessages = conversationHistory.length
    
    console.log(`📊 Contexto del mensaje: Respuesta #${responseIndex} (total de intercambios: ${totalMessages})`)
    
    // Obtener información de la fase actual
    const phaseInfo = await getConversationPhase(responseIndex)
    const guidance = await getResponseGuidance(responseIndex)
    
    // Construir contexto de la conversación
    const recentHistory = conversationHistory.slice(-6) // Últimos 6 mensajes
    
    // INSTRUCCIONES DE ETAPA AL INICIO - MUY PROMINENTES
    let contextPrompt = `🚨 INSTRUCCIONES CRÍTICAS DE ETAPA - DEBES SEGUIR EXACTAMENTE:\n`
    contextPrompt += `==================================================\n`
    contextPrompt += `ETAPA ACTUAL: ${phaseInfo.stage.toUpperCase()}\n`
    contextPrompt += `COMPORTAMIENTO REQUERIDO: ${phaseInfo.description}\n`
    contextPrompt += `TONO OBLIGATORIO: ${phaseInfo.tone}\n`
    contextPrompt += `ESTILO OBLIGATORIO: ${phaseInfo.style}\n`
    contextPrompt += `==================================================\n\n`
    
    contextPrompt += `TEMA DEL DEBATE: "${debateTopic}"\n\n`
    
    // NUEVO: Incluir índice de respuesta para que el LLM adapte su estilo
    contextPrompt += `CONTEXTO DE CONVERSACIÓN:\n`
    contextPrompt += `- Esta será tu respuesta #${responseIndex} en este debate\n`
    contextPrompt += `- Total de intercambios hasta ahora: ${totalMessages}\n\n`
    
    if (recentHistory.length > 0) {
      contextPrompt += `HISTORIAL RECIENTE:\n`
      contextPrompt += recentHistory.map(msg => `${msg.sender}: ${msg.content}`).join('\n')
      contextPrompt += '\n\n'
    }
    
    contextPrompt += `ÚLTIMO MENSAJE DEL USUARIO:\n"${userLastMessage}"\n\n`
    contextPrompt += `INSTRUCCIONES ESPECÍFICAS:\n`
    contextPrompt += `${guidance}\n\n`
    contextPrompt += `🎯 RECORDATORIO FINAL - CUMPLE EXACTAMENTE:\n`
    contextPrompt += `- ETAPA: ${phaseInfo.stage} = ${phaseInfo.description}\n`
    contextPrompt += `- TONO: ${phaseInfo.tone} | ESTILO: ${phaseInfo.style}\n`
    contextPrompt += `- Si es etapa "initial", DEBES dar bienvenida e invitar al debate\n`
    contextPrompt += `- Si es etapa "development", DEBES formular preguntas fundamentales\n\n`
    contextPrompt += `Responde usando tu personalidad filosófica única COMBINADA con el comportamiento específico de la etapa.`
    
    console.log(`📤 CONTEXT PROMPT CONSTRUIDO:`)
    console.log(`==================================================`)
    console.log(contextPrompt)
    console.log(`==================================================`)
    
    console.log(`🎯 PROMPT COMPLETO QUE SE ENVÍA AL LLM:`)
    console.log(`SYSTEM: ${systemPrompt.substring(0, 200)}...`)
    console.log(`USER: ${contextPrompt.substring(0, 200)}...`)
    console.log(`==================================================`)
    
    // Llamar al LLM usando el servicio centralizado
    const llmResponse = await LLMService.callLLM({
      functionName: 'philosopher_chat_system',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: contextPrompt
        }
      ],
      temperature: 0.8,
      maxTokens: 300
    })
    
    console.log(`✅ Respuesta generada para ${philosopher.name}`)
    
    return llmResponse
    
  } catch (error) {
    console.error(`❌ Error generando respuesta para ${philosopher.name}:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    throw new Error(`La IA no está respondiendo correctamente: ${errorMessage}`)
  }
} 