import { prisma } from '@/lib/db'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.LLM_ENCRYPTION_KEY || 'dev-key-32-chars-long-for-testing'

function decryptApiKey(encryptedApiKey: string): string {
  if (!encryptedApiKey) return ''
  
  try {
    // Verificar si la API key ya está en texto plano (para compatibilidad)
    if (encryptedApiKey.startsWith('sk-')) {
      console.log('🔓 API key ya está en texto plano')
      return encryptedApiKey
    }
    
    // Verificar si es un formato válido de hex
    if (!/^[0-9a-fA-F]+$/.test(encryptedApiKey)) {
      console.error('❌ Formato de API key encriptada inválido (no es hex)')
      throw new Error('Formato de API key encriptada inválido')
    }
    
    // Intentar desencriptar usando el método moderno primero
    try {
      // Extraer IV y datos encriptados (método moderno)
      const iv = Buffer.from(encryptedApiKey.slice(0, 32), 'hex')
      const encrypted = Buffer.from(encryptedApiKey.slice(32), 'hex')
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
      let decrypted = decipher.update(encrypted, undefined, 'utf8')
      decrypted += decipher.final('utf8')
      console.log('🔓 API key desencriptada con método moderno')
      return decrypted
    } catch (modernError) {
      console.log('⚠️ Método moderno falló, intentando método legacy...')
      
      // Fallback al método legacy para compatibilidad
      try {
        const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
        let decrypted = decipher.update(encryptedApiKey, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        console.log('🔓 API key desencriptada con método legacy')
        return decrypted
      } catch (legacyError) {
        console.log('❌ Ambos métodos de desencriptación fallaron')
        throw legacyError
      }
    }
  } catch (error) {
    console.error('❌ Error desencriptando API key:', error)
    throw new Error(`No se pudo desencriptar la API key: ${error instanceof Error ? error.message : 'Error desconocido'}`)
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
      
      // 1. Encontrar configuración LLM activa para el prompt template
      let configuration = null
      let promptTemplate = null
      
      try {
        // Primero buscar el prompt template
        promptTemplate = await prisma.promptTemplate.findFirst({
          where: { 
            name: request.functionName,
            isActive: true 
          }
        })
        
        if (!promptTemplate) {
          console.log(`⚠️ No se encontró prompt template para "${request.functionName}"`)
          throw new Error(`Prompt template "${request.functionName}" no encontrado o está desactivado`)
        }
        
        // Buscar configuración específica para este prompt template
        configuration = await prisma.lLMConfiguration.findFirst({
          where: { 
            promptTemplateId: promptTemplate.id,
            isActive: true 
          },
          include: {
            provider: true,
            model: true,
            promptTemplate: true
          }
        })
        
        // Si no hay configuración específica, buscar configuración por defecto
        if (!configuration) {
          console.log(`🔍 No hay configuración específica para "${request.functionName}", buscando configuración por defecto...`)
          
          configuration = await prisma.lLMConfiguration.findFirst({
            where: { 
              promptTemplateId: null, // Configuración por defecto
              isActive: true 
            },
            include: {
              provider: true,
              model: true,
              promptTemplate: true
            }
          })
        }
        
        if (!configuration) {
          console.log(`⚠️ No se encontró configuración LLM activa, buscando cualquier configuración disponible...`)
          
          // Último fallback: cualquier configuración activa
          configuration = await prisma.lLMConfiguration.findFirst({
            where: { 
              isActive: true 
            },
            include: {
              provider: true,
              model: true,
              promptTemplate: true
            }
          })
        }
        
        if (!configuration) {
          throw new Error(`No se encontró ninguna configuración LLM activa`)
        }
        
      } catch (error) {
        console.log(`⚠️ Error buscando configuración LLM: ${error}`)
        throw error
      }
      
      console.log(`🎯 Usando configuración: ${configuration.name}`)
      console.log(`📡 Provider: ${configuration.provider.name} - Model: ${configuration.model.name}`)
      
      // 2. Obtener la API key del provider (SOLO desde la base de datos)
      if (!(configuration.provider as any).apiKeyEncrypted) {
        throw new Error(`No hay API key configurada para el proveedor ${configuration.provider.name}. Debe configurarse desde la interfaz de administración.`)
      }
      
             console.log(`🔑 Obteniendo API key de la base de datos para ${configuration.provider.name}`)
       const apiKey = decryptApiKey((configuration.provider as any).apiKeyEncrypted)
       console.log(`✅ API key obtenida exitosamente para ${configuration.provider.name} (${apiKey.length} caracteres)`)
      
      // 3. Llamar al proveedor específico
      let response: any
      let usage: any
      
      if (configuration.provider.name === 'openai') {
        const result = await this.callOpenAI(configuration.provider, configuration.model, apiKey, request, configuration)
        response = result.response
        usage = result.usage
      } else if (configuration.provider.name === 'anthropic') {
        const result = await this.callAnthropic(configuration.provider, configuration.model, apiKey, request, configuration)
        response = result.response
        usage = result.usage
      } else {
        throw new Error(`Proveedor no soportado: ${configuration.provider.name}`)
      }
      
      const endTime = Date.now()
      const latencyMs = endTime - startTime
      
      // 4. Calcular costo
      const cost = this.calculateCost(configuration.model, usage.inputTokens, usage.outputTokens)
      
      // 5. Registrar la interacción
      await this.logInteraction({
        modelId: configuration.model.id,
        promptTemplateId: promptTemplate?.id || null,
        functionName: request.functionName,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
        latencyMs,
        cost,
        success: true,
        errorMessage: null,
        systemPrompt: request.messages.find(m => m.role === 'system')?.content,
        userPrompt: request.messages.find(m => m.role === 'user')?.content,
        response: response
      })
      
      console.log(`✅ LLMService: Función "${request.functionName}" completada en ${latencyMs}ms`)
      console.log(`💰 Costo: $${cost.toFixed(6)} | Tokens: ${usage.totalTokens} (${usage.inputTokens}+${usage.outputTokens})`)
      console.log(`📤 RESPUESTA FINAL DEL LLM: "${response.substring(0, 200)}..."`)
      console.log(`🎯 PROVIDER/MODEL USADO: ${configuration.provider.name}/${configuration.model.name}`)
      
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
      
      console.error(`❌ LLMService: Error en función "${request.functionName}":`, error)
      
      // Registrar error
      try {
        await this.logInteraction({
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
   * Llama a OpenAI
   */
  private static async callOpenAI(provider: any, model: any, apiKey: string, request: LLMRequest, config: any) {
    const baseUrl = provider.baseUrl || 'https://api.openai.com/v1'
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.modelIdentifier,
        messages: request.messages,
        temperature: request.temperature || config.temperature || 0.7,
        max_tokens: request.maxTokens || config.maxTokens || model.maxTokens || 4000
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
  private static async callAnthropic(provider: any, model: any, apiKey: string, request: LLMRequest, config: any) {
    const baseUrl = provider.baseUrl || 'https://api.anthropic.com/v1'
    
    // Convertir formato de mensajes de OpenAI a Anthropic
    const systemMessage = request.messages.find(m => m.role === 'system')
    const userMessages = request.messages.filter(m => m.role !== 'system')
    
    const anthropicMessages = userMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }))
    
    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model.modelIdentifier,
        max_tokens: request.maxTokens || config.maxTokens || model.maxTokens || 4000,
        temperature: request.temperature || config.temperature || 0.7,
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
    const inputCost = (inputTokens / 1000) * (model.costPer1kTokens || 0)
    const outputCost = (outputTokens / 1000) * (model.costPer1kTokens || 0) // Simplificado por ahora
    return inputCost + outputCost
  }
  
  /**
   * Registra la interacción en la base de datos
   */
  private static async logInteraction(data: {
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
    systemPrompt?: string
    userPrompt?: string
    response?: string
  }) {
    try {
      // Solo registrar si tenemos un modelId válido
      if (!data.modelId) {
        console.log('⚠️ No se puede registrar interacción sin modelId')
        return
      }
      
      await prisma.lLMInteraction.create({
        data: {
          modelId: data.modelId,
          promptTemplateId: data.promptTemplateId,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          totalCost: data.cost,
          responseTime: data.latencyMs,
          success: data.success,
          errorMessage: data.errorMessage
        }
      })
      
      // Store prompts separately for monitoring (temporary solution)
      if (data.systemPrompt || data.userPrompt || data.response) {
        console.log(`📋 PROMPT MONITORING - ${data.functionName}:`)
        console.log(`🔹 System: ${data.systemPrompt?.substring(0, 100)}...`)
        console.log(`🔹 User: ${data.userPrompt?.substring(0, 100)}...`)
        console.log(`🔹 Response: ${data.response?.substring(0, 100)}...`)
        
        // Send to live monitoring endpoint (fire and forget)
        try {
          // Use full URL for server-side fetch
          const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://dialecticia.vercel.app'
          fetch(`${baseUrl}/api/admin/llm/live-prompts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              functionName: data.functionName,
              systemPrompt: data.systemPrompt,
              userPrompt: data.userPrompt,
              response: data.response
            })
          }).catch(err => console.log('Failed to log to monitoring:', err))
        } catch (error) {
          // Ignore monitoring errors
        }
      }
      
      console.log(`📊 Interacción registrada: ${data.functionName}`)
    } catch (error) {
      console.error('Error logging interaction:', error)
    }
  }
} 