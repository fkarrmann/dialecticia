import { NextRequest, NextResponse } from 'next/server'
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

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 COMPARE: Comparando llamadas a Anthropic...')
    
    // 1. Obtener configuración LLM actual
    const configuration = await prisma.lLMConfiguration.findFirst({
      where: { 
        isActive: true,
        promptTemplateId: {
          not: null
        }
      },
      include: {
        provider: true,
        model: true,
        promptTemplate: true
      }
    })
    
    if (!configuration) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró configuración LLM activa con prompt template'
      })
    }
    
    // 2. Obtener API key
    const apiKey = decryptApiKey((configuration.provider as any).apiKeyEncrypted)
    
    // 3. Preparar datos de prueba
    const testMessages = [
      {
        role: 'system' as const,
        content: 'Eres un asistente útil.'
      },
      {
        role: 'user' as const,
        content: 'Hola, ¿puedes responder brevemente?'
      }
    ]
    
    // 4. Construir payload como lo hace callAnthropic
    const systemMessage = testMessages.find(m => m.role === 'system')
    const userMessages = testMessages.filter(m => m.role !== 'system')
    
    const anthropicMessages = userMessages.map(msg => ({
      role: 'user' as const, // Simplificado ya que solo tenemos mensajes de usuario en este test
      content: msg.content
    }))
    
    const callAnthropicPayload = {
      model: configuration.model.modelIdentifier, // ← ESTO ES LO QUE USA callAnthropic
      max_tokens: 100,
      temperature: 0.7,
      system: systemMessage?.content || '',
      messages: anthropicMessages
    }
    
    // 5. Construir payload como lo hace el test directo
    const directTestPayload = {
      model: 'claude-sonnet-4-20250514', // ← ESTO ES LO QUE USA EL TEST DIRECTO
      max_tokens: 100,
      temperature: 0.7,
      system: systemMessage?.content || '',
      messages: anthropicMessages
    }
    
    console.log('📊 COMPARACIÓN DE PAYLOADS:')
    console.log('callAnthropic model:', configuration.model.modelIdentifier)
    console.log('directTest model:', 'claude-sonnet-4-20250514')
    console.log('¿Son iguales?', configuration.model.modelIdentifier === 'claude-sonnet-4-20250514')
    
    // 6. Probar ambos payloads
    const results = []
    
    // Test con payload de callAnthropic
    try {
      console.log('🧪 Probando payload de callAnthropic...')
      const response1 = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(callAnthropicPayload)
      })
      
      const result1Text = await response1.text()
      
      results.push({
        method: 'callAnthropic',
        model: configuration.model.modelIdentifier,
        status: response1.status,
        success: response1.ok,
        response: response1.ok ? JSON.parse(result1Text).content[0].text.substring(0, 100) + '...' : result1Text
      })
      
    } catch (error) {
      results.push({
        method: 'callAnthropic',
        model: configuration.model.modelIdentifier,
        status: 'EXCEPTION',
        success: false,
        response: error instanceof Error ? error.message : 'Error desconocido'
      })
    }
    
    // Test con payload directo
    try {
      console.log('🧪 Probando payload directo...')
      const response2 = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(directTestPayload)
      })
      
      const result2Text = await response2.text()
      
      results.push({
        method: 'directTest',
        model: 'claude-sonnet-4-20250514',
        status: response2.status,
        success: response2.ok,
        response: response2.ok ? JSON.parse(result2Text).content[0].text.substring(0, 100) + '...' : result2Text
      })
      
    } catch (error) {
      results.push({
        method: 'directTest',
        model: 'claude-sonnet-4-20250514',
        status: 'EXCEPTION',
        success: false,
        response: error instanceof Error ? error.message : 'Error desconocido'
      })
    }
    
    return NextResponse.json({
      success: true,
      comparison: {
        configurationModel: configuration.model.modelIdentifier,
        directTestModel: 'claude-sonnet-4-20250514',
        modelsMatch: configuration.model.modelIdentifier === 'claude-sonnet-4-20250514'
      },
      payloads: {
        callAnthropic: callAnthropicPayload,
        directTest: directTestPayload
      },
      results,
      configuration: {
        id: configuration.id,
        name: configuration.name,
        model: configuration.model.name,
        modelIdentifier: configuration.model.modelIdentifier,
        provider: configuration.provider.name,
        promptTemplate: configuration.promptTemplate?.name
      }
    })
    
  } catch (error) {
    console.error('🔍 COMPARE ERROR:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
} 