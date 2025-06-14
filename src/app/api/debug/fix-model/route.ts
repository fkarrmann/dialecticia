import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'

// PUT: Fix model identifier
export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    console.log('🔧 Fixing model identifier...')

    // Find the problematic model
    const problematicModel = await prisma.lLMModel.findFirst({
      where: {
        modelIdentifier: 'claude-3-5-sonnet-20241022'
      },
      include: {
        provider: true,
        _count: {
          select: {
            configurations: true,
            interactions: true
          }
        }
      }
    })

    if (!problematicModel) {
      return NextResponse.json({
        success: false,
        message: 'Problematic model not found',
        currentModels: await prisma.lLMModel.findMany({
          select: {
            id: true,
            name: true,
            modelIdentifier: true,
            provider: { select: { name: true } }
          }
        })
      })
    }

    console.log('Found problematic model:', {
      id: problematicModel.id,
      name: problematicModel.name,
      modelIdentifier: problematicModel.modelIdentifier,
      provider: problematicModel.provider.name,
      configurations: problematicModel._count.configurations,
      interactions: problematicModel._count.interactions
    })

    // Update the model identifier to a working one
    const updatedModel = await prisma.lLMModel.update({
      where: { id: problematicModel.id },
      data: {
        modelIdentifier: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku'
      },
      include: {
        provider: true,
        _count: {
          select: {
            configurations: true,
            interactions: true
          }
        }
      }
    })

    console.log('✅ Model updated successfully:', {
      id: updatedModel.id,
      name: updatedModel.name,
      modelIdentifier: updatedModel.modelIdentifier,
      provider: updatedModel.provider.name
    })

    return NextResponse.json({
      success: true,
      message: 'Model identifier updated successfully',
      before: {
        modelIdentifier: problematicModel.modelIdentifier,
        name: problematicModel.name
      },
      after: {
        modelIdentifier: updatedModel.modelIdentifier,
        name: updatedModel.name
      },
      model: updatedModel
    })

  } catch (error) {
    console.error('Error fixing model:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fix model',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Buscar el modelo de Anthropic activo
    const anthropicModel = await prisma.lLMModel.findFirst({
      where: { 
        providerId: {
          in: await prisma.lLMProvider.findMany({
            where: { name: 'anthropic' },
            select: { id: true }
          }).then(providers => providers.map(p => p.id))
        }
      }
    })
    
    if (!anthropicModel) {
      return NextResponse.json({ error: 'No Anthropic model found' })
    }
    
    // Actualizar el modelIdentifier a un modelo válido de Claude
    const updatedModel = await prisma.lLMModel.update({
      where: { id: anthropicModel.id },
      data: {
        modelIdentifier: 'claude-3-5-sonnet-20241022' // Modelo válido de Claude 3.5 Sonnet
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Model identifier updated successfully',
      model: {
        id: updatedModel.id,
        name: updatedModel.name,
        oldIdentifier: anthropicModel.modelIdentifier,
        newIdentifier: updatedModel.modelIdentifier
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
}