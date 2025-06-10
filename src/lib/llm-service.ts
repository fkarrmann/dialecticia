import { prisma } from '@/lib/db'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.LLM_ENCRYPTION_KEY || 'dev-key-32-chars-long-for-testing'

function decryptApiKey(encryptedApiKey: string): string {
  if (!encryptedApiKey) return ''
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
    let decrypted = decipher.update(encryptedApiKey, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Error decrypting API key:', error)
    return ''
  }
}

interface LLMRequest {
  functionName: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  maxTokens?: number
  preferredProvider?: string
}

interface LLMResponse {
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
}

export class LLMService {
  
  /**
   * Hace una llamada al LLM usando la configuración del sistema de gestión
   */
  static async callLLM(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now()
    
    try {
      console.log(`🤖 LLMService: Función "${request.functionName}" iniciada`)
      
      // 1. Encontrar el prompt template
      let promptTemplate = null
      try {
        promptTemplate = await prisma.promptTemplate.findFirst({
          where: { 
            name: request.functionName,
            isActive: true 
          },
          include: {
            model: {
              include: {
                provider: true
              }
            }
          }
        })
        
        if (!promptTemplate) {
          console.log(`⚠️ No se encontró prompt template para "${request.functionName}", usando configuración por defecto`)
          // Para debugging: fallar inmediatamente cuando no se encuentra el prompt
          throw new Error(`Prompt template "${request.functionName}" no encontrado o está desactivado`)
        }
      } catch (error) {
        console.log(`⚠️ Error buscando prompt template: ${error}`)
        // Para debugging: re-lanzar el error para que falle inmediatamente
        throw error
      }
      
      // 2. Seleccionar modelo: primero el específico del prompt, luego fallback
      let model
      if (promptTemplate?.model) {
        console.log(`🎯 Usando modelo específico del prompt: ${promptTemplate.model.displayName}`)
        model = promptTemplate.model
      } else {
        console.log(`🔍 No hay modelo específico, buscando modelo disponible...`)
        model = await this.selectBestModel(request.functionName, request.preferredProvider)
      }
      
      if (!model) {
        throw new Error(`No se encontró modelo disponible para la función "${request.functionName}"`)
      }
      
      // 3. Preparar la llamada
      const provider = model.provider
      const apiKey = decryptApiKey(provider.apiKeyEncrypted || '')
      
      if (!apiKey) {
        throw new Error(`API key no disponible para el proveedor ${provider.name}`)
      }
      
      console.log(`📡 Usando ${provider.displayName} - ${model.displayName}`)
      
      // 4. Llamar al proveedor específico
      let response: any
      let usage: any
      
      if (provider.name === 'openai') {
        const result = await this.callOpenAI(provider, model, apiKey, request)
        response = result.response
        usage = result.usage
      } else if (provider.name === 'anthropic') {
        const result = await this.callAnthropic(provider, model, apiKey, request)
        response = result.response
        usage = result.usage
      } else {
        throw new Error(`Proveedor no soportado: ${provider.name}`)
      }
      
      const endTime = Date.now()
      const latencyMs = endTime - startTime
      
      // 5. Calcular costo
      const cost = this.calculateCost(model, usage.inputTokens, usage.outputTokens)
      
      // 6. Registrar la interacción
      await this.logInteraction({
        providerId: provider.id,
        modelId: model.id,
        promptTemplateId: promptTemplate?.id || null,
        functionName: request.functionName,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
        latencyMs,
        cost,
        success: true,
        errorMessage: null
      })
      
      console.log(`✅ LLMService: Función "${request.functionName}" completada en ${latencyMs}ms`)
      console.log(`💰 Costo: $${cost.toFixed(6)} | Tokens: ${usage.totalTokens} (${usage.inputTokens}+${usage.outputTokens})`)
      
      return {
        content: response,
        usage,
        provider: provider.displayName,
        model: model.displayName,
        cost,
        latencyMs
      }
      
    } catch (error) {
      const endTime = Date.now()
      const latencyMs = endTime - startTime
      
      console.error(`❌ LLMService: Error en función "${request.functionName}":`, error)
      
      // Registrar error (solo si tenemos al menos el functionName)
      try {
        await this.logInteraction({
          providerId: null, // Se manejará en logInteraction
          modelId: null,
          promptTemplateId: null,
          functionName: request.functionName,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          latencyMs,
          cost: 0,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Error desconocido'
        })
      } catch (logError) {
        console.error('Error logging failed interaction:', logError)
      }
      
      throw error
    }
  }
  
  /**
   * Selecciona el mejor modelo para una función específica
   */
  private static async selectBestModel(functionName: string, preferredProvider?: string) {
    try {
      const whereClause: any = {
        isActive: true,
        provider: { isActive: true }
      }
      
      // Si hay función específica, buscar modelos que la soporten
      if (functionName) {
        whereClause.usageFunction = functionName
      }
      
      // Si hay proveedor preferido
      if (preferredProvider) {
        whereClause.provider = {
          ...whereClause.provider,
          name: preferredProvider
        }
      }
      
      const models = await prisma.lLMModel.findMany({
        where: whereClause,
        include: { provider: true },
        orderBy: [
          { costPer1kInput: 'asc' }, // Preferir modelos más baratos
          { createdAt: 'desc' }
        ]
      })
      
      if (models.length === 0) {
        // Fallback: buscar cualquier modelo activo
        const fallbackModels = await prisma.lLMModel.findMany({
          where: {
            isActive: true,
            provider: { isActive: true }
          },
          include: { provider: true },
          orderBy: { costPer1kInput: 'asc' }
        })
        
        if (fallbackModels.length > 0) {
          console.log(`⚠️ Usando modelo fallback: ${fallbackModels[0].displayName}`)
          return fallbackModels[0]
        }
      }
      
      return models[0] || null
    } catch (error) {
      console.error('Error selecting model:', error)
      return null
    }
  }
  
  /**
   * Llama a OpenAI
   */
  private static async callOpenAI(provider: any, model: any, apiKey: string, request: LLMRequest) {
    const response = await fetch(provider.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.modelName,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || model.maxTokens || 4000
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${error}`)
    }

    const result = await response.json()
    
    return {
      response: result.choices[0].message.content.trim(),
      usage: {
        inputTokens: result.usage?.prompt_tokens || 0,
        outputTokens: result.usage?.completion_tokens || 0,
        totalTokens: result.usage?.total_tokens || 0
      }
    }
  }
  
  /**
   * Llama a Anthropic (Claude)
   */
  private static async callAnthropic(provider: any, model: any, apiKey: string, request: LLMRequest) {
    // Convertir formato de mensajes de OpenAI a Anthropic
    const systemMessage = request.messages.find(m => m.role === 'system')
    const userMessages = request.messages.filter(m => m.role !== 'system')
    
    const anthropicMessages = userMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }))
    
    const response = await fetch(provider.baseUrl + '/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model.modelName,
        max_tokens: request.maxTokens || model.maxTokens || 4000,
        temperature: request.temperature || 0.7,
        system: systemMessage?.content || '',
        messages: anthropicMessages
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${error}`)
    }

    const result = await response.json()
    
    return {
      response: result.content[0].text,
      usage: {
        inputTokens: result.usage?.input_tokens || 0,
        outputTokens: result.usage?.output_tokens || 0,
        totalTokens: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0)
      }
    }
  }
  
  /**
   * Calcula el costo de una llamada
   */
  private static calculateCost(model: any, inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000) * (model.inputCostPer1k || 0)
    const outputCost = (outputTokens / 1000) * (model.outputCostPer1k || model.inputCostPer1k || 0)
    return inputCost + outputCost
  }
  
  /**
   * Registra la interacción en la base de datos
   */
  private static async logInteraction(data: {
    providerId: string | null
    modelId: string | null
    promptTemplateId: string | null
    functionName: string
    inputTokens: number
    outputTokens: number
    totalTokens: number
    latencyMs: number
    cost: number
    success: boolean
    errorMessage: string | null
  }) {
    try {
      // Si no hay providerId (error case), no podemos registrar la interacción
      if (!data.providerId) {
        console.log('⚠️ No se puede registrar interacción sin providerId')
        return
      }
      
      await prisma.lLMInteraction.create({
        data: {
          providerId: data.providerId,
          modelId: data.modelId || undefined,
          promptTemplateId: data.promptTemplateId || undefined,
          functionName: data.functionName,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          totalTokens: data.totalTokens,
          latencyMs: data.latencyMs,
          cost: data.cost,
          success: data.success,
          errorMessage: data.errorMessage || undefined
        }
      })
    } catch (error) {
      console.error('Error logging LLM interaction:', error)
    }
  }
} 