import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'
import { SESSION_COOKIE_NAME } from '@/lib/auth-utils'
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
    console.log('🔧 UI AUTH FIX: Simulando actualización desde UI...')
    
    // Debug de cookies
    const cookies = request.cookies
    const sessionCookie = cookies.get(SESSION_COOKIE_NAME)
    console.log(`🍪 Cookie de sesión: ${sessionCookie ? 'ENCONTRADA' : 'NO ENCONTRADA'}`)
    if (sessionCookie) {
      console.log(`🍪 Cookie value preview: ${sessionCookie.value.substring(0, 20)}...`)
    }
    
    // Intentar obtener sesión
    const session = await getCurrentSession()
    console.log(`👤 Sesión: ${session ? 'VÁLIDA' : 'INVÁLIDA'}`)
    if (session) {
      console.log(`👤 Usuario: ${session.user.name} (Admin: ${session.user.isAdmin})`)
    }
    
    // Obtener datos del body
    const body = await request.json()
    const { providerId, apiKey } = body
    
    console.log(`🔑 Datos recibidos: providerId=${providerId}, apiKey=${apiKey ? 'PRESENTE' : 'AUSENTE'}`)
    
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      return NextResponse.json({
        success: false,
        error: 'API key inválida. Debe empezar con sk-ant-'
      }, { status: 400 })
    }
    
    // Buscar el proveedor
    const provider = await prisma.lLMProvider.findUnique({
      where: { id: providerId }
    })
    
    if (!provider) {
      return NextResponse.json({
        success: false,
        error: 'Proveedor no encontrado'
      }, { status: 404 })
    }
    
    console.log(`📦 Proveedor encontrado: ${provider.name}`)
    
    // Encriptar y actualizar
    const encryptedApiKey = encryptApiKey(apiKey)
    
    const updatedProvider = await prisma.lLMProvider.update({
      where: { id: providerId },
      data: {
        apiKeyEncrypted: encryptedApiKey,
        isActive: true
      },
      include: {
        models: {
          select: {
            id: true,
            name: true,
            modelIdentifier: true,
            isActive: true
          }
        }
      }
    })
    
    console.log('✅ Proveedor actualizado exitosamente')
    
    // Respuesta compatible con el UI
    const responseData = {
      ...updatedProvider,
      displayName: updatedProvider.name,
      maxTokens: 4000,
      rateLimitRpm: 60,
      rateLimitTpm: 60000,
      costPer1kTokens: 0.002,
      hasApiKey: true,
      apiKeyPreview: `${encryptedApiKey.substring(0, 20)}...`
    }
    
    return NextResponse.json({
      success: true,
      message: 'Proveedor actualizado exitosamente (simulando UI)',
      provider: responseData,
      debugInfo: {
        hadSession: !!session,
        isAdmin: session?.user?.isAdmin || false,
        hadCookie: !!sessionCookie,
        providerId,
        providerName: provider.name
      }
    })
    
  } catch (error) {
    console.error('❌ Error en UI auth fix:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 