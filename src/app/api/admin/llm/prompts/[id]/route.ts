import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'
import { z } from 'zod'

const UpdatePromptSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.string().min(1).max(50).optional(),
  displayName: z.string().min(1).max(200).optional(),
  systemPrompt: z.string().min(1).optional(),
  userPrompt: z.string().optional(),
  description: z.string().optional(),
  usage: z.string().optional(),
  parameters: z.record(z.any()).optional(),
  testData: z.record(z.any()).optional(),
  modelId: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET: Get specific prompt by ID
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

    const prompt = await prisma.promptTemplate.findUnique({
      where: { id },
      include: {
        model: {
          include: {
            provider: true
          }
        },
        _count: {
          select: {
            interactions: true
          }
        }
      }
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields
    const parsedPrompt = {
      ...prompt,
      parameters: prompt.parameters ? JSON.parse(prompt.parameters) : null,
      testData: prompt.testData ? JSON.parse(prompt.testData) : null,
    }

    return NextResponse.json(parsedPrompt)
  } catch (error) {
    console.error('Error fetching prompt:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompt' },
      { status: 500 }
    )
  }
}

// PUT: Update prompt (creates new version)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 15 compatibility
    const { id } = await params
    
    const body = await request.json()
    console.log('PUT /api/admin/llm/prompts/[id] - Body received:', JSON.stringify(body, null, 2))

    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const validatedData = UpdatePromptSchema.parse(body)

    // Get current prompt
    const currentPrompt = await prisma.promptTemplate.findUnique({
      where: { id }
    })

    if (!currentPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    // Special case: if only isActive is being changed, update directly without versioning
    const isOnlyStatusChange = validatedData.isActive !== undefined && 
      Object.keys(validatedData).length === 1

    if (isOnlyStatusChange) {
      const updatedPrompt = await prisma.promptTemplate.update({
        where: { id },
        data: {
          isActive: validatedData.isActive
        },
        include: {
          model: {
            include: {
              provider: true
            }
          },
          _count: {
            select: {
              interactions: true
            }
          }
        }
      })

      return NextResponse.json(updatedPrompt)
    }

    // Check if content has actually changed
    const hasContentChanged = 
      (validatedData.systemPrompt !== undefined && validatedData.systemPrompt !== currentPrompt.systemPrompt) ||
      (validatedData.userPrompt !== undefined && validatedData.userPrompt !== currentPrompt.userPrompt) ||
      (validatedData.name !== undefined && validatedData.name !== currentPrompt.name)

    if (hasContentChanged) {
      // Create new version if content changed
      const existingPrompts = await prisma.promptTemplate.findMany({
        where: { name: validatedData.name || currentPrompt.name },
        orderBy: { version: 'desc' },
        take: 1
      })

      const lastVersion = existingPrompts[0].version
      const [major, minor] = lastVersion.split('.').map(Number)
      const newVersion = `${major}.${minor + 1}.0`
      
      // Deactivate previous versions
      await prisma.promptTemplate.updateMany({
        where: { name: validatedData.name || currentPrompt.name },
        data: { isActive: false }
      })

      // Create new version
      const newPrompt = await prisma.promptTemplate.create({
        data: {
          name: validatedData.name || currentPrompt.name,
          category: validatedData.category || currentPrompt.category,
          displayName: validatedData.displayName || currentPrompt.displayName,
          version: newVersion,
          systemPrompt: validatedData.systemPrompt || currentPrompt.systemPrompt,
          userPrompt: validatedData.userPrompt !== undefined ? validatedData.userPrompt : currentPrompt.userPrompt,
          description: validatedData.description !== undefined ? validatedData.description : currentPrompt.description,
          usage: validatedData.usage !== undefined ? validatedData.usage : currentPrompt.usage,
          parameters: validatedData.parameters ? JSON.stringify(validatedData.parameters) : currentPrompt.parameters,
          testData: validatedData.testData ? JSON.stringify(validatedData.testData) : currentPrompt.testData,
          modelId: validatedData.modelId && validatedData.modelId.trim() !== '' ? validatedData.modelId : 
                   (currentPrompt.modelId && currentPrompt.modelId.trim() !== '' ? currentPrompt.modelId : null),
          createdBy: session.user.id,
          isActive: true,
        },
        include: {
          model: {
            include: {
              provider: true
            }
          },
          _count: {
            select: {
              interactions: true
            }
          }
        }
      })

      return NextResponse.json(newPrompt)
    } else {
      // Just update metadata if only metadata changed
      const updatedPrompt = await prisma.promptTemplate.update({
        where: { id },
        data: {
          displayName: validatedData.displayName || currentPrompt.displayName,
          category: validatedData.category || currentPrompt.category,
          description: validatedData.description !== undefined ? validatedData.description : currentPrompt.description,
          usage: validatedData.usage !== undefined ? validatedData.usage : currentPrompt.usage,
          parameters: validatedData.parameters ? JSON.stringify(validatedData.parameters) : currentPrompt.parameters,
          testData: validatedData.testData ? JSON.stringify(validatedData.testData) : currentPrompt.testData,
          modelId: validatedData.modelId && validatedData.modelId.trim() !== '' ? validatedData.modelId : 
                   (currentPrompt.modelId && currentPrompt.modelId.trim() !== '' ? currentPrompt.modelId : null),
          isActive: validatedData.isActive !== undefined ? validatedData.isActive : currentPrompt.isActive,
        },
        include: {
          model: {
            include: {
              provider: true
            }
          },
          _count: {
            select: {
              interactions: true
            }
          }
        }
      })

      return NextResponse.json(updatedPrompt)
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating prompt:', error)
    return NextResponse.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    )
  }
}

// DELETE: Delete prompt
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

    // Check if prompt has interactions
    const prompt = await prisma.promptTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            interactions: true
          }
        }
      }
    })

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    if (prompt._count.interactions > 0) {
      // Don't delete, just deactivate if it has been used
      await prisma.promptTemplate.update({
        where: { id },
        data: { isActive: false }
      })
      
      return NextResponse.json(
        { message: 'Prompt deactivated (had interactions)' }
      )
    } else {
      // Safe to delete if no interactions
      await prisma.promptTemplate.delete({
        where: { id }
      })
      
      return NextResponse.json(
        { message: 'Prompt deleted successfully' }
      )
    }

  } catch (error) {
    console.error('Error deleting prompt:', error)
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    )
  }
} 