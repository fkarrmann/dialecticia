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
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY)
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 EMERGENCY API FIX: Iniciando actualización de emergencia...')
    
    const body = await request.json()
    const { apiKey } = body
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key is required'
      }, { status: 400 })
    }
    
    if (!apiKey.startsWith('sk-ant-')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Anthropic API key format (must start with sk-ant-)'
      }, { status: 400 })
    }
    
    console.log('🔍 Buscando provider Anthropic...')
    const provider = await prisma.lLMProvider.findFirst({
      where: { name: 'anthropic' }
    })
    
    if (!provider) {
      return NextResponse.json({
        success: false,
        error: 'Anthropic provider not found'
      }, { status: 404 })
    }
    
    console.log(`🔑 Encriptando API key: ${apiKey.substring(0, 15)}...`)
    const encryptedKey = encryptApiKey(apiKey)
    console.log(`✅ API key encriptada: ${encryptedKey.length} caracteres`)
    
    console.log('💾 Actualizando en base de datos...')
    const updatedProvider = await prisma.lLMProvider.update({
      where: { id: provider.id },
      data: {
        apiKeyEncrypted: encryptedKey,
        isActive: true,
        updatedAt: new Date()
      }
    })
    
    console.log('✅ Provider actualizado exitosamente')
    
    // Verificar que se puede desencriptar
    console.log('🧪 Verificando desencriptación...')
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    const isValid = decrypted === apiKey
    
    console.log(`🔍 Verificación: ${isValid ? 'VÁLIDA' : 'INVÁLIDA'}`)
    
    return NextResponse.json({
      success: true,
      message: 'API key actualizada exitosamente',
      details: {
        providerId: provider.id,
        providerName: provider.name,
        encryptedKeyLength: encryptedKey.length,
        verificationPassed: isValid,
        apiKeyPreview: `${apiKey.substring(0, 15)}...`,
        updatedAt: updatedProvider.updatedAt
      }
    })
    
  } catch (error) {
    console.error('❌ EMERGENCY ERROR:', error)
    return NextResponse.json({
      success: false,
      error: 'Emergency fix failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 