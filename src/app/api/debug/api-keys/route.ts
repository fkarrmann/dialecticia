import { NextRequest, NextResponse } from 'next/server'
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