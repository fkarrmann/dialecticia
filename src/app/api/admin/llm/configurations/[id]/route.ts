import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'
import { z } from 'zod'

const UpdateConfigurationSchema = z.object({
  functionName: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  parameters: z.string().nullable().optional(),
  modelId: z.string().nullable().optional(),
  isActive: z.boolean().optional()
})

// GET: Get specific configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const configuration = await prisma.lLMConfiguration.findUnique({
      where: { id }
    })

    if (!configuration) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(configuration)

  } catch (error) {
    console.error('Error fetching configuration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

// PUT: Update configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = UpdateConfigurationSchema.parse(body)

    // Check if configuration exists
    const currentConfig = await prisma.lLMConfiguration.findUnique({
      where: { id }
    })

    if (!currentConfig) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      )
    }

    // Check for function name conflicts if being changed
    if (validatedData.functionName && validatedData.functionName !== currentConfig.functionName) {
      const existingConfig = await prisma.lLMConfiguration.findUnique({
        where: { functionName: validatedData.functionName }
      })

      if (existingConfig) {
        return NextResponse.json(
          { error: 'Configuration with this function name already exists' },
          { status: 400 }
        )
      }
    }

    // Validate JSON parameters if provided
    if (validatedData.parameters !== undefined && validatedData.parameters !== null) {
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

    const updatedConfiguration = await prisma.lLMConfiguration.update({
      where: { id },
      data: {
        functionName: validatedData.functionName || currentConfig.functionName,
        description: validatedData.description !== undefined ? validatedData.description : currentConfig.description,
        parameters: validatedData.parameters !== undefined ? validatedData.parameters : currentConfig.parameters,
        modelId: validatedData.modelId !== undefined ? validatedData.modelId : currentConfig.modelId,
        isActive: validatedData.isActive !== undefined ? validatedData.isActive : currentConfig.isActive
      }
    })

    return NextResponse.json(updatedConfiguration)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating configuration:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}

// DELETE: Delete configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Check if configuration exists
    const configuration = await prisma.lLMConfiguration.findUnique({
      where: { id }
    })

    if (!configuration) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      )
    }

    // Note: LLMConfiguration doesn't have interactions, so we can safely delete
    // But we might want to check if it's being used by specific functions in the future

    await prisma.lLMConfiguration.delete({
      where: { id }
    })
    
    return NextResponse.json(
      { message: 'Configuration deleted successfully' }
    )

  } catch (error) {
    console.error('Error deleting configuration:', error)
    return NextResponse.json(
      { error: 'Failed to delete configuration' },
      { status: 500 }
    )
  }
} 