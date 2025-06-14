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
    console.log('🔍 DIAGNÓSTICO ANTHROPIC: Iniciando diagnóstico completo...')
    
    // 1. Obtener configuración
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
      return NextResponse.json({
        success: false,
        error: 'No se encontró configuración LLM activa'
      })
    }
    
    // 2. Obtener API key
    const apiKey = decryptApiKey((configuration.provider as any).apiKeyEncrypted)
    
    console.log('📊 CONFIGURACIÓN:')
    console.log(`   Provider: ${configuration.provider.name}`)
    console.log(`   Model: ${configuration.model.name}`)
    console.log(`   Model ID: ${configuration.model.modelIdentifier}`)
    console.log(`   API Key length: ${apiKey.length}`)
    console.log(`   API Key prefix: ${apiKey.substring(0, 10)}...`)
    
    // 3. Preparar payload mínimo
    const payload = {
      model: configuration.model.modelIdentifier,
      max_tokens: 50,
      temperature: 0.7,
      system: "Eres un asistente útil.",
      messages: [
        {
          role: "user",
          content: "Di solo 'Hola'"
        }
      ]
    }
    
    console.log('📤 PAYLOAD:')
    console.log(JSON.stringify(payload, null, 2))
    
    // 4. Probar diferentes versiones de API
    const versions = ['2023-06-01', '2023-01-01', '2024-01-01']
    const results = []
    
    for (const version of versions) {
      try {
        console.log(`🧪 Probando versión: ${version}`)
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': version
          },
          body: JSON.stringify(payload)
        })
        
        const responseText = await response.text()
        
        results.push({
          version,
          status: response.status,
          success: response.ok,
          response: response.ok ? JSON.parse(responseText) : responseText,
          headers: Object.fromEntries(response.headers.entries())
        })
        
        console.log(`   Status: ${response.status}`)
        
        if (response.ok) {
          console.log(`   ✅ ÉXITO con versión ${version}`)
          break
        } else {
          console.log(`   ❌ Error con versión ${version}: ${responseText}`)
        }
        
      } catch (error) {
        results.push({
          version,
          status: 'EXCEPTION',
          success: false,
          response: error instanceof Error ? error.message : 'Error desconocido'
        })
        console.log(`   💥 Excepción con versión ${version}: ${error}`)
      }
    }
    
    // 5. Probar con diferentes modelos
    const testModels = [
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-latest',
      'claude-3-opus-20240229'
    ]
    
    const modelResults = []
    
    for (const testModel of testModels) {
      try {
        console.log(`🤖 Probando modelo: ${testModel}`)
        
        const testPayload = { ...payload, model: testModel }
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(testPayload)
        })
        
        const responseText = await response.text()
        
        modelResults.push({
          model: testModel,
          status: response.status,
          success: response.ok,
          response: response.ok ? 'SUCCESS' : responseText.substring(0, 200)
        })
        
        console.log(`   ${testModel}: ${response.status}`)
        
      } catch (error) {
        modelResults.push({
          model: testModel,
          status: 'EXCEPTION',
          success: false,
          response: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      diagnosis: {
        configuration: {
          provider: configuration.provider.name,
          model: configuration.model.name,
          modelIdentifier: configuration.model.modelIdentifier,
          apiKeyLength: apiKey.length,
          apiKeyPrefix: apiKey.substring(0, 10) + '...'
        },
        payload,
        versionTests: results,
        modelTests: modelResults,
        summary: {
          workingVersions: results.filter(r => r.success).map(r => r.version),
          workingModels: modelResults.filter(r => r.success).map(r => r.model),
          totalVersionsTested: versions.length,
          totalModelsTested: testModels.length
        }
      }
    })
    
  } catch (error) {
    console.error('🔍 DIAGNÓSTICO ERROR:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
} 