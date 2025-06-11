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
    return NextResponse.json(
      { error: 'Endpoint temporarily disabled - schema mismatch' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Error creating model:', error)
    return NextResponse.json(
      { error: 'Failed to create model' },
      { status: 500 }
    )
  }
} 