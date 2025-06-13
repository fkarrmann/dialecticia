import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.LLM_ENCRYPTION_KEY || 'dev-key-32-chars-long-for-testing'

function encryptApiKey(apiKey: string): string {
  if (!apiKey) return ''
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY)
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Provider Update Test iniciado')
    
    const session = await getCurrentSession()
    console.log('🔍 Session:', session ? 'OK' : 'FAILED')
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required', session: !!session, isAdmin: session?.user?.isAdmin },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('🔍 Body received:', Object.keys(body))
    
    const { providerId, apiKey } = body
    
    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID required' },
        { status: 400 }
      )
    }

    // Check if provider exists
    console.log('🔍 Buscando provider:', providerId)
    const existingProvider = await prisma.lLMProvider.findUnique({
      where: { id: providerId }
    })

    if (!existingProvider) {
      return NextResponse.json(
        { error: 'Provider not found', providerId },
        { status: 404 }
      )
    }

    console.log('🔍 Provider encontrado:', existingProvider.name)

    if (apiKey) {
      console.log('🔍 Encriptando API key...')
      const encryptedKey = encryptApiKey(apiKey)
      console.log('🔍 API key encriptada:', encryptedKey.length, 'caracteres')
      
      console.log('🔍 Actualizando provider en base de datos...')
      const updatedProvider = await prisma.lLMProvider.update({
        where: { id: providerId },
        data: {
          apiKeyEncrypted: encryptedKey,
          updatedAt: new Date()
        }
      })
      
      console.log('🔍 Provider actualizado exitosamente')
      
      return NextResponse.json({
        success: true,
        message: 'Provider updated successfully',
        providerId,
        encryptedKeyLength: encryptedKey.length,
        updatedAt: updatedProvider.updatedAt
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'No API key provided'
      })
    }

  } catch (error) {
    console.error('❌ DEBUG: Error en provider update test:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update provider', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 