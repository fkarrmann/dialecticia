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
    console.log('📚 PRUEBA OFICIAL ANTHROPIC: Usando exactamente la documentación oficial...')
    
    // 1. Obtener API key de la configuración
    const configuration = await prisma.lLMConfiguration.findFirst({
      where: { isActive: true },
      include: {
        provider: true,
        model: true
      },
      orderBy: { updatedAt: 'desc' }
    })
    
    if (!configuration) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró configuración LLM activa'
      })
    }
    
    const apiKey = decryptApiKey((configuration.provider as any).apiKeyEncrypted)
    
    console.log('🔑 API Key obtenida:', apiKey.substring(0, 10) + '...')
    
    // 2. Probar con diferentes modelos según la documentación oficial
    const officialModels = [
      'claude-opus-4-20250514',      // Modelo de la documentación oficial
      'claude-sonnet-4-20250514',    // Nuestro modelo actual
      'claude-3-5-sonnet-20241022',  // Modelo alternativo conocido
      'claude-3-opus-20240229'       // Modelo Opus anterior
    ]
    
    const results = []
    
    for (const model of officialModels) {
      try {
        console.log(`🧪 Probando modelo: ${model}`)
        
        // Payload EXACTO de la documentación oficial
        const payload = {
          model: model,
          max_tokens: 1024,
          messages: [
            { role: "user", content: "Hello, world" }
          ]
        }
        
        console.log('📤 Payload oficial:', JSON.stringify(payload, null, 2))
        
        // Headers EXACTOS de la documentación oficial
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
        
        const responseText = await response.text()
        
        console.log(`📥 Respuesta ${model}: ${response.status}`)
        
        results.push({
          model,
          status: response.status,
          success: response.ok,
          response: response.ok ? JSON.parse(responseText) : responseText,
          headers: Object.fromEntries(response.headers.entries())
        })
        
        if (response.ok) {
          console.log(`✅ ÉXITO con modelo: ${model}`)
          const parsed = JSON.parse(responseText)
          console.log(`📝 Respuesta: ${parsed.content[0]?.text?.substring(0, 100)}...`)
        } else {
          console.log(`❌ Error con modelo ${model}: ${responseText}`)
        }
        
      } catch (error) {
        console.log(`💥 Excepción con modelo ${model}:`, error)
        results.push({
          model,
          status: 'EXCEPTION',
          success: false,
          response: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }
    
    // 3. Probar diferentes versiones de API
    const apiVersions = ['2023-06-01', '2023-01-01', '2024-01-01']
    const versionResults = []
    
    for (const version of apiVersions) {
      try {
        console.log(`🔄 Probando versión API: ${version}`)
        
        const payload = {
          model: 'claude-sonnet-4-20250514', // Nuestro modelo actual
          max_tokens: 50,
          messages: [
            { role: "user", content: "Di solo 'Hola'" }
          ]
        }
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': version,
            'content-type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
        
        const responseText = await response.text()
        
        versionResults.push({
          version,
          status: response.status,
          success: response.ok,
          response: response.ok ? 'SUCCESS' : responseText.substring(0, 200)
        })
        
        console.log(`📊 Versión ${version}: ${response.status}`)
        
      } catch (error) {
        versionResults.push({
          version,
          status: 'EXCEPTION',
          success: false,
          response: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      test: 'official-anthropic-documentation',
      configuration: {
        currentModel: configuration.model.modelIdentifier,
        provider: configuration.provider.name,
        apiKeyLength: apiKey.length
      },
      modelTests: results,
      versionTests: versionResults,
      summary: {
        workingModels: results.filter(r => r.success).map(r => r.model),
        workingVersions: versionResults.filter(r => r.success).map(r => r.version),
        totalModelsTested: officialModels.length,
        totalVersionsTested: apiVersions.length
      },
      documentation: {
        officialExample: {
          url: 'https://docs.anthropic.com/en/api/overview',
          model: 'claude-opus-4-20250514',
          headers: ['x-api-key', 'anthropic-version: 2023-06-01', 'content-type: application/json']
        }
      }
    })
    
  } catch (error) {
    console.error('📚 ERROR PRUEBA OFICIAL:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
} 