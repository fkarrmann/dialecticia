import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'
import { z } from 'zod'

const CreateModelSchema = z.object({
  providerId: z.string().min(1),
  modelName: z.string().min(1).max(100),
  displayName: z.string().min(1).max(200),
  maxTokens: z.number().int().min(1).max(1000000).default(4000),
  costPer1kInput: z.number().min(0).max(1000).default(0.0025),
  costPer1kOutput: z.number().min(0).max(1000).default(0.01),
  capabilities: z.array(z.string()).optional(),
  parameters: z.record(z.any()).optional(),
  usageFunction: z.string().optional(),
})

// GET: List all models
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')

    const models = await prisma.lLMModel.findMany({
      where: providerId ? { providerId } : undefined,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            displayName: true,
            isActive: true
          }
        },
        _count: {
          select: {
            interactions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(models)

  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}

// POST: Create new model
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = CreateModelSchema.parse(body)

    // Verify provider exists
    const provider = await prisma.lLMProvider.findUnique({
      where: { id: validatedData.providerId }
    })

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Check if model already exists for this provider
    const existingModel = await prisma.lLMModel.findUnique({
      where: {
        providerId_modelName: {
          providerId: validatedData.providerId,
          modelName: validatedData.modelName
        }
      }
    })

    if (existingModel) {
      return NextResponse.json(
        { error: 'Model already exists for this provider' },
        { status: 400 }
      )
    }

    const model = await prisma.lLMModel.create({
      data: {
        providerId: validatedData.providerId,
        modelName: validatedData.modelName,
        displayName: validatedData.displayName,
        maxTokens: validatedData.maxTokens,
        costPer1kInput: validatedData.costPer1kInput,
        costPer1kOutput: validatedData.costPer1kOutput,
        capabilities: validatedData.capabilities ? JSON.stringify(validatedData.capabilities) : null,
        parameters: validatedData.parameters ? JSON.stringify(validatedData.parameters) : null,
        usageFunction: validatedData.usageFunction,
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      }
    })

    return NextResponse.json(model, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating model:', error)
    return NextResponse.json(
      { error: 'Failed to create model' },
      { status: 500 }
    )
  }
} 