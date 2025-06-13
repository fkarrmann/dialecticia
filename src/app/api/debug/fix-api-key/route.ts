import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Obtener la API key de las variables de entorno
    const envApiKey = process.env.ANTHROPIC_API_KEY
    
    if (!envApiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'ANTHROPIC_API_KEY no encontrada en variables de entorno' 
      }, { status: 400 })
    }

    // Actualizar el proveedor Anthropic con la API key de las variables de entorno
    const provider = await prisma.lLMProvider.findFirst({
      where: { name: 'anthropic' }
    })

    if (!provider) {
      return NextResponse.json({ 
        success: false, 
        error: 'Proveedor Anthropic no encontrado' 
      }, { status: 404 })
    }

    await prisma.lLMProvider.update({
      where: { id: provider.id },
      data: {
        apiKeyEncrypted: envApiKey // Almacenar como texto plano temporalmente
      } as any
    })

    return NextResponse.json({ 
      success: true, 
      message: 'API key actualizada desde variables de entorno',
      providerId: provider.id,
      keyLength: envApiKey.length
    })

  } catch (error) {
    console.error('Error fixing API key:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 