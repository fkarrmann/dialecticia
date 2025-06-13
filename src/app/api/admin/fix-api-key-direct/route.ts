import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.LLM_ENCRYPTION_KEY || 'dev-key-32-chars-long-for-testing'

function encryptApiKey(apiKey: string): string {
  if (!apiKey) return ''
  
  // Usar método moderno de encriptación
  const iv = crypto.randomBytes(16)
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // Combinar IV + datos encriptados
  return iv.toString('hex') + encrypted
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 EMERGENCY: Actualizando API key directamente...')
    
    const body = await request.json()
    const { apiKey, confirmKey } = body
    
    // Verificación de seguridad simple
    if (confirmKey !== 'EMERGENCY_FIX_2024') {
      return NextResponse.json(
        { error: 'Invalid confirmation key' },
        { status: 403 }
      )
    }
    
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      return NextResponse.json(
        { error: 'Invalid Anthropic API key format' },
        { status: 400 }
      )
    }
    
    console.log('🔍 Buscando provider Anthropic...')
    const provider = await prisma.lLMProvider.findFirst({
      where: { name: 'anthropic' }
    })
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Anthropic provider not found' },
        { status: 404 }
      )
    }
    
    console.log('🔑 Encriptando nueva API key...')
    const encryptedKey = encryptApiKey(apiKey)
    console.log(`✅ API key encriptada: ${encryptedKey.length} caracteres`)
    
    console.log('💾 Actualizando en base de datos...')
    const updatedProvider = await prisma.lLMProvider.update({
      where: { id: provider.id },
      data: {
        apiKeyEncrypted: encryptedKey,
        updatedAt: new Date()
      }
    })
    
    console.log('✅ Provider actualizado exitosamente')
    
    // Verificar que la desencriptación funciona
    try {
      // Extraer IV y datos encriptados
      const iv = Buffer.from(encryptedKey.slice(0, 32), 'hex')
      const encrypted = Buffer.from(encryptedKey.slice(32), 'hex')
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
      let decrypted = decipher.update(encrypted, undefined, 'utf8')
      decrypted += decipher.final('utf8')
      
      const decryptionWorks = decrypted === apiKey
      console.log(`🔓 Verificación de desencriptación: ${decryptionWorks ? 'EXITOSA' : 'FALLIDA'}`)
      
      return NextResponse.json({
        success: true,
        message: 'API key updated successfully',
        providerId: provider.id,
        encryptedKeyLength: encryptedKey.length,
        decryptionTest: decryptionWorks,
        updatedAt: updatedProvider.updatedAt
      })
      
    } catch (decryptError) {
      console.error('❌ Error en verificación de desencriptación:', decryptError)
      return NextResponse.json({
        success: true,
        message: 'API key updated but decryption test failed',
        providerId: provider.id,
        encryptedKeyLength: encryptedKey.length,
        decryptionTest: false,
        decryptionError: decryptError instanceof Error ? decryptError.message : 'Unknown error'
      })
    }

  } catch (error) {
    console.error('❌ EMERGENCY: Error actualizando API key:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update API key', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 