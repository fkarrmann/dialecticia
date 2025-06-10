import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'
import { z } from 'zod'

const CreateConfigurationSchema = z.object({
  functionName: z.string().min(1).max(100),
  description: z.string().optional(),
  parameters: z.string().nullable().optional(),
  modelId: z.string().nullable().optional(),
  isActive: z.boolean().default(true)
})

// GET: List all configurations
export async function GET() {
  try {
    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const configurations = await prisma.lLMConfiguration.findMany({
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(configurations)

  } catch (error) {
    console.error('Error fetching configurations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configurations' },
      { status: 500 }
    )
  }
}

// POST: Create new configuration
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
    const validatedData = CreateConfigurationSchema.parse(body)

    // Check if configuration already exists
    const existingConfig = await prisma.lLMConfiguration.findUnique({
      where: { functionName: validatedData.functionName }
    })

    if (existingConfig) {
      return NextResponse.json(
        { error: 'Configuration with this function name already exists' },
        { status: 400 }
      )
    }

    // Validate JSON parameters if provided
    if (validatedData.parameters) {
      try {
        JSON.parse(validatedData.parameters)
      } catch {
        return NextResponse.json(
          { error: 'Invalid JSON in parameters field' },
          { status: 400 }
        )
      }
    }

    // Verify model exists if provided
    if (validatedData.modelId) {
      const model = await prisma.lLMModel.findUnique({
        where: { id: validatedData.modelId }
      })

      if (!model) {
        return NextResponse.json(
          { error: 'Model not found' },
          { status: 404 }
        )
      }
    }

    const configuration = await prisma.lLMConfiguration.create({
      data: {
        functionName: validatedData.functionName,
        description: validatedData.description || null,
        parameters: validatedData.parameters || null,
        modelId: validatedData.modelId || null,
        isActive: validatedData.isActive
      }
    })

    return NextResponse.json(configuration, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating configuration:', error)
    return NextResponse.json(
      { error: 'Failed to create configuration' },
      { status: 500 }
    )
  }
} 