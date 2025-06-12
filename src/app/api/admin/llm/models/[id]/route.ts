import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'
import { z } from 'zod'

const UpdateModelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  modelIdentifier: z.string().min(1).max(100).optional(),
  displayName: z.string().min(1).max(200).optional(),
  isActive: z.boolean().optional(),
  maxTokens: z.number().int().min(1).max(1000000).optional(),
  costPer1kInput: z.number().min(0).max(1000).optional(),
  costPer1kOutput: z.number().min(0).max(1000).optional(),
  costPer1kTokens: z.number().min(0).max(1000).optional(),
  capabilities: z.string().optional(),
  parameters: z.string().optional(),
  usageFunction: z.string().optional(),
})

// GET: Get specific model
export async function GET(
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

    const model = await prisma.lLMModel.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        },
        _count: {
          select: {
            interactions: true,
            configurations: true
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

    return NextResponse.json(model)

  } catch (error) {
    console.error('Error fetching model:', error)
    return NextResponse.json(
      { error: 'Failed to fetch model' },
      { status: 500 }
    )
  }
}

// PUT: Update model
export async function PUT(
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

    const body = await request.json()
    const validatedData = UpdateModelSchema.parse(body)

    // Check if model exists
    const existingModel = await prisma.lLMModel.findUnique({
      where: { id }
    })

    if (!existingModel) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    // Check if modelIdentifier is unique within provider (if being changed)
    if (validatedData.modelIdentifier && validatedData.modelIdentifier !== existingModel.modelIdentifier) {
      const identifierExists = await prisma.lLMModel.findFirst({
        where: { 
          providerId: existingModel.providerId,
          modelIdentifier: validatedData.modelIdentifier,
          id: { not: id }
        }
      })
      
      if (identifierExists) {
        return NextResponse.json(
          { error: 'Model identifier already exists for this provider' },
          { status: 400 }
        )
      }
    }

    const updatedModel = await prisma.lLMModel.update({
      where: { id },
      data: validatedData,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        },
        _count: {
          select: {
            interactions: true,
            configurations: true
          }
        }
      }
    })

    return NextResponse.json(updatedModel)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating model:', error)
    return NextResponse.json(
      { error: 'Failed to update model' },
      { status: 500 }
    )
  }
}

// DELETE: Delete model
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
        }
      }
    })

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      )
    }

    // Check if model has interactions or configurations
    if (model._count.interactions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete model with existing interactions' },
        { status: 400 }
      )
    }

    if (model._count.configurations > 0) {
      return NextResponse.json(
        { error: 'Cannot delete model with existing configurations' },
        { status: 400 }
      )
    }

    await prisma.lLMModel.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Model deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting model:', error)
    return NextResponse.json(
      { error: 'Failed to delete model' },
      { status: 500 }
    )
  }
} 