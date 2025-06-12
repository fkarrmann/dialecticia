import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'

// DELETE: Force delete model (removes configurations first)
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

    // Check if model exists
    const model = await prisma.lLMModel.findUnique({
      where: { id },
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
    })

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    // Still can't delete if there are interactions (these are historical data)
    if (model._count.interactions > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete model with existing interactions',
          details: `This model has ${model._count.interactions} interaction(s). Interactions are historical data and cannot be automatically deleted.`
        },
        { status: 400 }
      )
    }

    const deletedConfigurations = []

    // Delete all configurations using this model
    if (model._count.configurations > 0) {
      for (const config of model.configurations) {
        await prisma.lLMConfiguration.delete({
          where: { id: config.id }
        })
        deletedConfigurations.push(config)
      }
    }

    // Now delete the model
    await prisma.lLMModel.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Model and dependencies deleted successfully',
      deletedModel: {
        id: model.id,
        name: model.name,
        modelIdentifier: model.modelIdentifier
      },
      deletedConfigurations: deletedConfigurations,
      summary: {
        configurationsDeleted: deletedConfigurations.length,
        modelDeleted: true
      }
    })

  } catch (error) {
    console.error('Error force deleting model:', error)
    return NextResponse.json(
      { error: 'Failed to force delete model' },
      { status: 500 }
    )
  }
} 