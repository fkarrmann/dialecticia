import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Obtener la configuración activa
    const configuration = await prisma.lLMConfiguration.findFirst({
      where: { isActive: true },
      include: {
        provider: true,
        model: true
      }
    })
    
    if (!configuration) {
      return NextResponse.json({ error: 'No active configuration found' })
    }
    
    return NextResponse.json({
      success: true,
      configuration: {
        id: configuration.id,
        name: configuration.name,
        isActive: configuration.isActive,
        provider: {
          id: configuration.provider.id,
          name: configuration.provider.name,
          baseUrl: configuration.provider.baseUrl
        },
        model: {
          id: configuration.model.id,
          name: configuration.model.name,
          providerId: configuration.model.providerId,
          costPer1kTokens: configuration.model.costPer1kTokens,
          maxTokens: configuration.model.maxTokens,
          displayName: configuration.model.displayName,
          modelIdentifier: configuration.model.modelIdentifier
        }
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
} 