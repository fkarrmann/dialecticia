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

    // Agregar campos dummy para compatibilidad frontend
    const safeModels = models.map(model => ({
      ...model,
      // Campos que espera el frontend
      displayName: model.name, // Usar name como displayName
      modelName: model.modelIdentifier, // Usar modelIdentifier como modelName
      costPer1kInput: model.costPer1kTokens || 0.002, // Valor dummy
      costPer1kOutput: model.costPer1kTokens || 0.002, // Valor dummy
      capabilities: null, // Campo dummy
      parameters: null, // Campo dummy
      usageFunction: null, // Campo dummy
      provider: {
        ...model.provider,
        displayName: model.provider.name // Agregar displayName al provider
      }
    }))

    return NextResponse.json(safeModels)

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
    console.log('🔧 Creating model with data:', body)

    // Map frontend fields to database schema
    const createData: any = {
      isActive: body.isActive !== undefined ? body.isActive : true
    }
    
    // Map required fields
    if (!body.providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      )
    }
    createData.providerId = body.providerId

    if (body.modelName) {
      createData.modelIdentifier = body.modelName // modelName maps to modelIdentifier
      createData.name = body.modelName // Also use as name
    } else {
      return NextResponse.json(
        { error: 'Model name is required' },
        { status: 400 }
      )
    }

    if (body.displayName) {
      createData.name = body.displayName // displayName maps to name
    }

    // Optional fields
    if (body.maxTokens) createData.maxTokens = body.maxTokens
    if (body.costPer1kInput) createData.costPer1kInput = body.costPer1kInput
    if (body.costPer1kOutput) createData.costPer1kOutput = body.costPer1kOutput
    if (body.capabilities) createData.capabilities = JSON.stringify(body.capabilities)
    if (body.parameters) createData.parameters = JSON.stringify(body.parameters)
    if (body.usageFunction) createData.usageFunction = body.usageFunction

    console.log('🔧 Mapped create data:', createData)

    // Check if provider exists
    const provider = await prisma.lLMProvider.findUnique({
      where: { id: createData.providerId }
    })

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Check if model identifier is unique within provider
    const existingModel = await prisma.lLMModel.findFirst({
      where: { 
        providerId: createData.providerId,
        modelIdentifier: createData.modelIdentifier
      }
    })

    if (existingModel) {
      return NextResponse.json(
        { error: 'Model with this identifier already exists for this provider' },
        { status: 400 }
      )
    }

    const newModel = await prisma.lLMModel.create({
      data: createData,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    })

    console.log('✅ Model created successfully:', newModel.name)

    // Return with frontend-compatible format
    const responseModel = {
      ...newModel,
      displayName: newModel.name,
      modelName: newModel.modelIdentifier,
      costPer1kInput: newModel.costPer1kInput || 0.002,
      costPer1kOutput: newModel.costPer1kOutput || 0.002,
      capabilities: newModel.capabilities ? JSON.parse(newModel.capabilities) : null,
      parameters: newModel.parameters ? JSON.parse(newModel.parameters) : null,
      provider: {
        ...newModel.provider,
        displayName: newModel.provider.name
      }
    }

    return NextResponse.json(responseModel, { status: 201 })

  } catch (error) {
    console.error('Error creating model:', error)
    return NextResponse.json(
      { error: 'Failed to create model' },
      { status: 500 }
    )
  }
} 