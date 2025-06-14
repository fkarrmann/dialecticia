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

function encryptApiKey(apiKey: string): string {
  if (!apiKey) return ''
  try {
    // Use createCipheriv instead of deprecated createCipher
    const algorithm = 'aes-256-cbc'
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const iv = crypto.randomBytes(16)
    
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    let encrypted = cipher.update(apiKey, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Prepend IV to encrypted data
    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.log('⚠️ Encryption failed, storing as plain text for now')
    return apiKey
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 EMERGENCY FIX: Actualizando API key de Anthropic...')
    
    const body = await request.json()
    const { apiKey } = body
    
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      return NextResponse.json({
        success: false,
        error: 'API key inválida. Debe empezar con sk-ant-'
      }, { status: 400 })
    }
    
    // Buscar el proveedor Anthropic
    const anthropicProvider = await prisma.lLMProvider.findFirst({
      where: {
        name: 'anthropic'
      }
    })
    
    if (!anthropicProvider) {
      return NextResponse.json({
        success: false,
        error: 'Proveedor Anthropic no encontrado'
      }, { status: 404 })
    }
    
    // Encriptar y actualizar la API key
    const encryptedApiKey = encryptApiKey(apiKey)
    
    const updatedProvider = await prisma.lLMProvider.update({
      where: { id: anthropicProvider.id },
      data: {
        apiKeyEncrypted: encryptedApiKey,
        isActive: true
      }
    })
    
    console.log('✅ API key actualizada exitosamente')
    
    return NextResponse.json({
      success: true,
      message: 'API key de Anthropic actualizada exitosamente',
      provider: {
        id: updatedProvider.id,
        name: updatedProvider.name,
        isActive: updatedProvider.isActive,
        hasApiKey: true,
        apiKeyPreview: `${encryptedApiKey.substring(0, 20)}...`
      }
    })
    
  } catch (error) {
    console.error('❌ Error actualizando API key:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 