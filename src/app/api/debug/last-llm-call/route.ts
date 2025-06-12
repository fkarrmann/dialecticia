import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Buscando última llamada al LLM...')
    
    // Obtener la última interacción del LLM
    const lastInteraction = await prisma.lLMInteraction.findFirst({
      include: {
        model: {
          include: {
            provider: true
          }
        },
        promptTemplate: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Obtener el último mensaje de debate
    const lastMessage = await prisma.message.findFirst({
      where: {
        senderType: 'AI'
      },
      include: {
        debate: {
          select: {
            topic: true,
            id: true
          }
        },
        philosopher: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })
    
    // Obtener configuraciones activas
    const activeConfigurations = await prisma.lLMConfiguration.findMany({
      where: {
        isActive: true
      },
      include: {
        provider: true,
        model: true,
        promptTemplate: true
      }
    })
    
    return NextResponse.json({
      success: true,
      debug: {
        lastInteraction: lastInteraction ? {
          id: lastInteraction.id,
          success: lastInteraction.success,
          errorMessage: lastInteraction.errorMessage,
          createdAt: lastInteraction.createdAt,
          provider: lastInteraction.model?.provider?.name,
          model: lastInteraction.model?.name,
          promptTemplate: lastInteraction.promptTemplate?.name,
          inputTokens: lastInteraction.inputTokens,
          outputTokens: lastInteraction.outputTokens,
          cost: lastInteraction.totalCost,
          responseTime: lastInteraction.responseTime
        } : null,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content.substring(0, 200) + '...',
          timestamp: lastMessage.timestamp,
          philosopher: lastMessage.philosopher?.name,
          debateTopic: lastMessage.debate?.topic
        } : null,
        activeConfigurations: activeConfigurations.map(config => ({
          id: config.id,
          name: config.name,
          provider: config.provider.name,
          model: config.model.name,
          promptTemplate: config.promptTemplate?.name || 'DEFAULT',
          isActive: config.isActive
        })),
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ Error en debug de última llamada LLM:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 