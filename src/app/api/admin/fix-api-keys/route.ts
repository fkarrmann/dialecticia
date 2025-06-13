import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()
    
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      return NextResponse.json({ 
        success: false, 
        error: 'API key de Anthropic inválida' 
      }, { status: 400 })
    }

    // Actualizar el proveedor Anthropic con la nueva API key (texto plano temporalmente)
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
        apiKeyEncrypted: apiKey // Almacenar temporalmente como texto plano
      } as any
    })

    return NextResponse.json({ 
      success: true, 
      message: 'API key actualizada exitosamente',
      providerId: provider.id
    })

  } catch (error) {
    console.error('Error fixing API key:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
} 