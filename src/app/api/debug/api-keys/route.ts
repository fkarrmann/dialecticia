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
  
  // Intentar método moderno primero
  try {
    const iv = Buffer.from(encryptedApiKey.slice(0, 32), 'hex')
    const encrypted = Buffer.from(encryptedApiKey.slice(32), 'hex')
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (modernError) {
    // Fallback al método legacy
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
      let decrypted = decipher.update(encryptedApiKey, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return decrypted
    } catch (legacyError) {
      console.error('Error decrypting API key:', legacyError)
      return ''
    }
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