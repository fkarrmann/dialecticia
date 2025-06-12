import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'

// DELETE: Force delete provider (removes models and configurations first)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Check if provider exists and get all dependencies
    const provider = await prisma.lLMProvider.findUnique({
      where: { id },
      include: {
        models: {
          include: {
            _count: {
              select: {
                interactions: true,
                configurations: true
              }
            },
            configurations: {
              select: {
                id: true,
                name: true,
                isActive: true
              }
            }
          }
        },
        configurations: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    })

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Check if any model has interactions (historical data that can't be deleted)
    const modelsWithInteractions = provider.models.filter(m => m._count.interactions > 0)
    if (modelsWithInteractions.length > 0) {
      const modelNames = modelsWithInteractions.map(m => `• ${m.name} (${m._count.interactions} interactions)`).join('\n')
      return NextResponse.json(
        { 
          error: 'Cannot delete provider with models that have interactions',
          details: `The following models have historical interaction data that cannot be automatically deleted:\n${modelNames}`,
          modelsWithInteractions: modelsWithInteractions.map(m => ({
            id: m.id,
            name: m.name,
            interactions: m._count.interactions
          }))
        },
        { status: 400 }
      )
    }

    const deletedConfigurations = []
    const deletedModels = []

    // Delete all configurations for each model
    for (const model of provider.models) {
      for (const config of model.configurations) {
        await prisma.lLMConfiguration.delete({
          where: { id: config.id }
        })
        deletedConfigurations.push(config)
      }
    }

    // Delete all provider-level configurations
    for (const config of provider.configurations) {
      await prisma.lLMConfiguration.delete({
        where: { id: config.id }
      })
      deletedConfigurations.push(config)
    }

    // Delete all models
    for (const model of provider.models) {
      await prisma.lLMModel.delete({
        where: { id: model.id }
      })
      deletedModels.push({
        id: model.id,
        name: model.name,
        modelIdentifier: model.modelIdentifier
      })
    }

    // Finally delete the provider
    await prisma.lLMProvider.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Provider and all dependencies deleted successfully',
      deletedProvider: {
        id: provider.id,
        name: provider.name
      },
      deletedModels: deletedModels,
      deletedConfigurations: deletedConfigurations,
      summary: {
        modelsDeleted: deletedModels.length,
        configurationsDeleted: deletedConfigurations.length,
        providerDeleted: true
      }
    })

  } catch (error) {
    console.error('Error force deleting provider:', error)
    return NextResponse.json(
      { error: 'Failed to force delete provider' },
      { status: 500 }
    )
  }
} 