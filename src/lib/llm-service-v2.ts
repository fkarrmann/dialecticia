import { prisma } from '@/lib/db'
import crypto from 'crypto'

const ENCRYPTION_KEY = (() => {
  const key = process.env.LLM_ENCRYPTION_KEY
  if (!key) {
    throw new Error('LLM_ENCRYPTION_KEY environment variable is required')
  }
  return key
})()

function decryptApiKey(encryptedApiKey: string): string {
  if (!encryptedApiKey) return ''
  
  try {
    if (encryptedApiKey.startsWith('sk-')) {
      return encryptedApiKey
    }
    
    if (encryptedApiKey.includes(':')) {
      const [ivHex, encryptedHex] = encryptedApiKey.split(':')
      const iv = Buffer.from(ivHex, 'hex')
      const encrypted = Buffer.from(encryptedHex, 'hex')
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
      let decrypted = decipher.update(encrypted, undefined, 'utf8')
      decrypted += decipher.final('utf8')
      return decrypted
    }
    
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
    let decrypted = decipher.update(encryptedApiKey, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
    
  } catch (error) {
    console.error('Error decrypting API key:', error)
    throw new Error('Failed to decrypt API key')
  }
}

interface LLMRequestV2 {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  maxTokens?: number
}

interface LLMResponseV2 {
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

/**
 * Sistema LLM V2 - Simplificado y Robusto
 * 
 * Principios:
 * 1. Una sola configuración activa por vez
 * 2. Búsqueda simple y directa
 * 3. Logging detallado para debugging
 * 4. Fallbacks claros y predecibles
 */
export class LLMServiceV2 {
  
  /**
   * Llamada principal al LLM - Simplificada
   */
  static async callLLM(request: LLMRequestV2): Promise<LLMResponseV2> {
    const startTime = Date.now()
    
    try {
      console.log('🚀 LLMServiceV2: Iniciando llamada simplificada...')
      
      // PASO 1: Obtener LA configuración activa (debe haber solo una)
      const configuration = await this.getActiveConfiguration()
      
      console.log(`✅ Configuración encontrada: ${configuration.name}`)
      console.log(`📊 Modelo: ${configuration.model.name} (${configuration.model.modelIdentifier})`)
      console.log(`📊 Provider: ${configuration.provider.name}`)
      
      // PASO 2: Obtener API key
      const apiKey = this.getApiKey(configuration.provider)
      console.log(`🔑 API key obtenida: ${apiKey.length} caracteres`)
      
      // PASO 3: Llamar al proveedor
      let response: any
      let usage: any
      
      if (configuration.provider.name === 'anthropic') {
        const result = await this.callAnthropicV2(configuration, apiKey, request)
        response = result.response
        usage = result.usage
      } else if (configuration.provider.name === 'openai') {
        const result = await this.callOpenAIV2(configuration, apiKey, request)
        response = result.response
        usage = result.usage
      } else {
        throw new Error(`Proveedor no soportado: ${configuration.provider.name}`)
      }
      
      const endTime = Date.now()
      const latencyMs = endTime - startTime
      const cost = this.calculateCost(configuration.model, usage.inputTokens, usage.outputTokens)
      
      console.log(`✅ LLMServiceV2: Completado en ${latencyMs}ms`)
      console.log(`💰 Costo: $${cost.toFixed(6)} | Tokens: ${usage.totalTokens}`)
      
      // PASO 4: Registrar interacción
      await this.logInteraction({
        modelId: configuration.model.id,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalCost: cost,
        responseTime: latencyMs,
        success: true,
        errorMessage: null
      })
      
      return {
        content: response,
        usage,
        provider: configuration.provider.name,
        model: configuration.model.name,
        cost,
        latencyMs
      }
      
    } catch (error) {
      const endTime = Date.now()
      const latencyMs = endTime - startTime
      
      console.error('❌ LLMServiceV2: Error:', error)
      
      // Registrar error
      await this.logInteraction({
        modelId: null,
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0,
        responseTime: latencyMs,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido'
      })
      
      throw error
    }
  }
  
  /**
   * Obtener LA configuración activa (simplificado)
   */
  private static async getActiveConfiguration() {
    console.log('🔍 Buscando configuración LLM activa...')
    
    // Buscar la configuración activa más reciente
    const configuration = await prisma.lLMConfiguration.findFirst({
      where: { isActive: true },
      include: {
        provider: true,
        model: true,
        promptTemplate: true
      },
      orderBy: { updatedAt: 'desc' }
    })
    
    if (!configuration) {
      throw new Error('No se encontró ninguna configuración LLM activa')
    }
    
    // Validar que el provider esté activo
    if (!configuration.provider.isActive) {
      throw new Error(`El proveedor ${configuration.provider.name} está desactivado`)
    }
    
    // Validar que el modelo esté activo
    if (!configuration.model.isActive) {
      throw new Error(`El modelo ${configuration.model.name} está desactivado`)
    }
    
    // Validar que tenga API key
    if (!(configuration.provider as any).apiKeyEncrypted) {
      throw new Error(`No hay API key configurada para ${configuration.provider.name}`)
    }
    
    return configuration
  }
  
  /**
   * Obtener API key del proveedor
   */
  private static getApiKey(provider: any): string {
    const apiKey = decryptApiKey(provider.apiKeyEncrypted)
    
    if (!apiKey) {
      throw new Error(`API key vacía para proveedor ${provider.name}`)
    }
    
    return apiKey
  }
  
  /**
   * Llamar a Anthropic V2 - Simplificado
   */
  private static async callAnthropicV2(configuration: any, apiKey: string, request: LLMRequestV2) {
    console.log('🤖 Llamando a Anthropic V2...')
    
    const baseUrl = configuration.provider.baseUrl || 'https://api.anthropic.com/v1'
    const model = configuration.model
    
    // Preparar mensajes
    const systemMessage = request.messages.find(m => m.role === 'system')
    const userMessages = request.messages.filter(m => m.role !== 'system')
    
    const anthropicMessages = userMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: msg.content
    }))
    
    const payload = {
      model: model.modelIdentifier,
      max_tokens: request.maxTokens || configuration.maxTokens || 4000,
      temperature: request.temperature || configuration.temperature || 0.7,
      system: systemMessage?.content || '',
      messages: anthropicMessages
    }
    
    console.log('📤 Payload Anthropic:')
    console.log(`   Modelo: ${payload.model}`)
    console.log(`   Max tokens: ${payload.max_tokens}`)
    console.log(`   Mensajes: ${payload.messages.length}`)
    
    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    })
    
    console.log(`📥 Respuesta Anthropic: ${response.status}`)
    
    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Error Anthropic:', error)
      console.error('❌ Payload que falló:', JSON.stringify(payload, null, 2))
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
   * Llamar a OpenAI V2 - Simplificado
   */
  private static async callOpenAIV2(configuration: any, apiKey: string, request: LLMRequestV2) {
    console.log('🤖 Llamando a OpenAI V2...')
    
    const baseUrl = configuration.provider.baseUrl || 'https://api.openai.com/v1'
    const model = configuration.model
    
    const payload = {
      model: model.modelIdentifier,
      messages: request.messages,
      temperature: request.temperature || configuration.temperature || 0.7,
      max_tokens: request.maxTokens || configuration.maxTokens || 4000
    }
    
    console.log('📤 Payload OpenAI:')
    console.log(`   Modelo: ${payload.model}`)
    console.log(`   Max tokens: ${payload.max_tokens}`)
    console.log(`   Mensajes: ${payload.messages.length}`)
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    
    console.log(`📥 Respuesta OpenAI: ${response.status}`)
    
    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Error OpenAI:', error)
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
   * Calcular costo
   */
  private static calculateCost(model: any, inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000) * (model.costPer1kTokens || 0)
    const outputCost = (outputTokens / 1000) * (model.costPer1kTokens || 0)
    return inputCost + outputCost
  }
  
  /**
   * Registrar interacción
   */
  private static async logInteraction(data: {
    modelId: string | null
    inputTokens: number
    outputTokens: number
    totalCost: number
    responseTime: number
    success: boolean
    errorMessage: string | null
  }) {
    try {
      if (!data.modelId) {
        console.log('⚠️ No se puede registrar interacción sin modelId')
        return
      }
      
      await prisma.lLMInteraction.create({
        data: {
          modelId: data.modelId,
          promptTemplateId: null, // Simplificado por ahora
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          totalCost: data.totalCost,
          responseTime: data.responseTime,
          success: data.success,
          errorMessage: data.errorMessage
        }
      })
      
      console.log('📊 Interacción registrada')
    } catch (error) {
      console.error('Error registrando interacción:', error)
    }
  }
} 