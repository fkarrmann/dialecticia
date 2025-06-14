import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Activating Claude Sonnet 4 configuration...')

    // 1. Buscar la configuración de Claude Sonnet 4
    const claude4Config = await prisma.lLMConfiguration.findFirst({
      where: { 
        name: 'Claude Sonnet 4 Configuration'
      },
      include: {
        model: true,
        provider: true
      }
    })
    
    if (!claude4Config) {
      return NextResponse.json({ 
        success: false,
        error: 'Claude Sonnet 4 configuration not found. Please add the model first.' 
      })
    }

    console.log('Found Claude 4 configuration:', claude4Config.id)

    // 2. Desactivar todas las configuraciones actuales
    await prisma.lLMConfiguration.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })

    console.log('Deactivated all existing configurations')

    // 3. Activar la configuración de Claude 4
    const activatedConfig = await prisma.lLMConfiguration.update({
      where: { id: claude4Config.id },
      data: { isActive: true },
      include: {
        model: true,
        provider: true
      }
    })

    console.log('Activated Claude 4 configuration')

    return NextResponse.json({
      success: true,
      message: 'Claude Sonnet 4 configuration activated successfully',
      configuration: {
        id: activatedConfig.id,
        name: activatedConfig.name,
        isActive: activatedConfig.isActive,
        model: {
          name: activatedConfig.model.name,
          modelIdentifier: activatedConfig.model.modelIdentifier,
          displayName: activatedConfig.model.displayName
        },
        provider: {
          name: activatedConfig.provider.name,
          displayName: activatedConfig.provider.displayName
        }
      },
      instructions: 'Claude Sonnet 4 is now the active model. You can start debates with the new model.'
    })

  } catch (error) {
    console.error('Error activating Claude 4 configuration:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to activate Claude 4 configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 