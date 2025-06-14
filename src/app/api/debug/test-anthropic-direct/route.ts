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
    // Verificar si la API key ya está en texto plano
    if (encryptedApiKey.startsWith('sk-')) {
      return encryptedApiKey
    }
    
    // Verificar si es el nuevo formato con IV
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
    
    // Fallback al método legacy
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
    console.log('🧪 DIRECT TEST: Probando API de Anthropic directamente...')
    
    // 1. Obtener el provider de Anthropic
    const anthropicProvider = await prisma.lLMProvider.findFirst({
      where: { name: 'anthropic' }
    })
    
    if (!anthropicProvider) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró el proveedor Anthropic'
      })
    }
    
    if (!(anthropicProvider as any).apiKeyEncrypted) {
      return NextResponse.json({
        success: false,
        error: 'No hay API key configurada para Anthropic'
      })
    }
    
    // 2. Desencriptar la API key
    const apiKey = decryptApiKey((anthropicProvider as any).apiKeyEncrypted)
    console.log(`🔑 API key obtenida (${apiKey.length} caracteres)`)
    
    // 3. Probar diferentes identificadores de modelo
    const modelsToTest = [
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-latest',
      'claude-3-opus-20240229'
    ]
    
    const results = []
    
    for (const modelId of modelsToTest) {
      console.log(`🧪 Probando modelo: ${modelId}`)
      
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: modelId,
            max_tokens: 100,
            temperature: 0.7,
            system: 'Eres un asistente útil.',
            messages: [
              {
                role: 'user',
                content: 'Hola, ¿puedes responder brevemente?'
              }
            ]
          })
        })
        
        const responseText = await response.text()
        
        if (response.ok) {
          const result = JSON.parse(responseText)
          results.push({
            model: modelId,
            status: 'SUCCESS',
            response: result.content[0].text.substring(0, 100) + '...',
            usage: result.usage
          })
          console.log(`✅ ${modelId}: SUCCESS`)
        } else {
          results.push({
            model: modelId,
            status: 'ERROR',
            error: `${response.status} - ${responseText}`,
            statusCode: response.status
          })
          console.log(`❌ ${modelId}: ${response.status} - ${responseText.substring(0, 100)}`)
        }
        
      } catch (error) {
        results.push({
          model: modelId,
          status: 'EXCEPTION',
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
        console.log(`💥 ${modelId}: EXCEPTION - ${error}`)
      }
      
      // Pequeña pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // 4. Resumen de resultados
    const successfulModels = results.filter(r => r.status === 'SUCCESS')
    const failedModels = results.filter(r => r.status !== 'SUCCESS')
    
    console.log(`📊 Resultados: ${successfulModels.length} exitosos, ${failedModels.length} fallidos`)
    
    return NextResponse.json({
      success: true,
      summary: {
        totalTested: results.length,
        successful: successfulModels.length,
        failed: failedModels.length,
        apiKeyLength: apiKey.length,
        providerBaseUrl: anthropicProvider.baseUrl || 'https://api.anthropic.com/v1'
      },
      results,
      recommendations: successfulModels.length > 0 ? 
        `Usar modelo: ${successfulModels[0].model}` : 
        'Ningún modelo funcionó - verificar API key o configuración'
    })
    
  } catch (error) {
    console.error('🧪 DIRECT TEST ERROR:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
} 