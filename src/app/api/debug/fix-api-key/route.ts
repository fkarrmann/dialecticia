import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Obtener el proveedor Anthropic
    const provider = await prisma.lLMProvider.findFirst({
      where: { name: 'anthropic' }
    })

    if (!provider) {
      return NextResponse.json({ 
        success: false, 
        error: 'Proveedor Anthropic no encontrado' 
      }, { status: 404 })
    }

    const apiKeyEncrypted = (provider as any).apiKeyEncrypted
    
    if (!apiKeyEncrypted) {
      return NextResponse.json({ 
        success: false, 
        error: 'No hay API key encriptada en la base de datos' 
      }, { status: 400 })
    }

    // Diagnóstico de la API key encriptada
    const diagnosis = {
      providerId: provider.id,
      hasApiKey: !!apiKeyEncrypted,
      apiKeyLength: apiKeyEncrypted.length,
      apiKeyPreview: apiKeyEncrypted.substring(0, 20) + '...',
      isPlainText: apiKeyEncrypted.startsWith('sk-'),
      isValidHex: /^[0-9a-fA-F]+$/.test(apiKeyEncrypted),
      encryptionKey: {
        exists: !!process.env.LLM_ENCRYPTION_KEY,
        length: process.env.LLM_ENCRYPTION_KEY?.length || 0,
        isDefault: (process.env.LLM_ENCRYPTION_KEY || 'dev-key-32-chars-long-for-testing') === 'dev-key-32-chars-long-for-testing'
      }
    }

    return NextResponse.json({ 
      success: true, 
      diagnosis,
      recommendation: diagnosis.isPlainText 
        ? 'La API key está en texto plano. Debería funcionar directamente.'
        : diagnosis.isValidHex 
          ? 'La API key está encriptada en formato hex. Problema de clave de encriptación.'
          : 'La API key tiene un formato inválido. Necesita ser re-encriptada.'
    })

  } catch (error) {
    console.error('Error diagnosing API key:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 