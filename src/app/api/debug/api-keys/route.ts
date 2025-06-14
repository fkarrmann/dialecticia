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
    // Verificar si la API key ya está en texto plano (para compatibilidad)
    if (encryptedApiKey.startsWith('sk-')) {
      console.log('🔓 API key ya está en texto plano')
      return encryptedApiKey
    }
    
    // Verificar si es el nuevo formato con IV (contiene ':')
    if (encryptedApiKey.includes(':')) {
      console.log('🔓 Detectado formato moderno con IV')
      try {
        const [ivHex, encryptedHex] = encryptedApiKey.split(':')
        const iv = Buffer.from(ivHex, 'hex')
        const encrypted = Buffer.from(encryptedHex, 'hex')
        const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
        
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
        let decrypted = decipher.update(encrypted, undefined, 'utf8')
        decrypted += decipher.final('utf8')
        console.log('✅ API key desencriptada con método moderno')
        return decrypted
      } catch (modernError) {
        console.error('❌ Error con método moderno:', modernError)
        throw modernError
      }
    }
    
    // Verificar si es un formato válido de hex (método legacy)
    if (!/^[0-9a-fA-F]+$/.test(encryptedApiKey)) {
      console.error('❌ Formato de API key encriptada inválido')
      throw new Error('Formato de API key encriptada inválido')
    }
    
    // Fallback al método legacy para compatibilidad
    console.log('🔓 Usando método legacy')
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
      let decrypted = decipher.update(encryptedApiKey, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      console.log('✅ API key desencriptada con método legacy')
      return decrypted
    } catch (legacyError) {
      console.error('❌ Error con método legacy:', legacyError)
      throw legacyError
    }
    
  } catch (error) {
    console.error('Error decrypting API key:', error)
    return ''
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Checking API keys...')
    
    // Verificar variables de entorno
    const envKeys = {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      LLM_ENCRYPTION_KEY: !!process.env.LLM_ENCRYPTION_KEY,
      OPENAI_LENGTH: process.env.OPENAI_API_KEY?.length || 0,
      ANTHROPIC_LENGTH: process.env.ANTHROPIC_API_KEY?.length || 0,
      ENCRYPTION_LENGTH: process.env.LLM_ENCRYPTION_KEY?.length || 0
    }
    
    // Obtener providers de la BD
    const providers = await prisma.lLMProvider.findMany({
      where: { isActive: true }
    })
    
    const providerDetails = []
    
    for (const provider of providers) {
      const details: any = {
        id: provider.id,
        name: provider.name,
        hasEncryptedKey: !!(provider as any).apiKeyEncrypted,
        encryptedKeyLength: (provider as any).apiKeyEncrypted?.length || 0
      }
      
      if ((provider as any).apiKeyEncrypted) {
        try {
          const decrypted = decryptApiKey((provider as any).apiKeyEncrypted)
          details.decryptionSuccess = !!decrypted
          details.decryptedLength = decrypted.length
          details.decryptedPreview = decrypted ? `${decrypted.substring(0, 8)}...` : 'FAILED'
        } catch (error) {
          details.decryptionSuccess = false
          details.decryptionError = error instanceof Error ? error.message : 'Unknown error'
        }
      }
      
      providerDetails.push(details)
    }
    
    // Obtener configuración activa
    const activeConfig = await prisma.lLMConfiguration.findFirst({
      where: { isActive: true },
      include: {
        provider: true,
        model: true
      }
    })
    
    return NextResponse.json({
      success: true,
      environment: envKeys,
      providers: providerDetails,
      activeConfiguration: activeConfig ? {
        id: activeConfig.id,
        name: activeConfig.name,
        provider: activeConfig.provider.name,
        model: activeConfig.model.name,
        hasProviderEncryptedKey: !!(activeConfig.provider as any).apiKeyEncrypted
      } : null,
      encryptionKey: {
        exists: !!process.env.LLM_ENCRYPTION_KEY,
        length: process.env.LLM_ENCRYPTION_KEY?.length || 0,
        isDefault: ENCRYPTION_KEY === 'dev-key-32-chars-long-for-testing'
      }
    })
    
  } catch (error) {
    console.error('🔍 DEBUG ERROR:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
} 