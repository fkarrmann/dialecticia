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

    // Agregar campos dummy para compatibilidad frontend
    const safePrompt = {
      ...prompt,
      displayName: prompt.name,
      systemPrompt: prompt.template,
      userPrompt: '',
      usage: prompt.description || '',
      parameters: null,
      testData: null,
      version: '1.0.0',
      modelId: null,
      model: null
    }

    return NextResponse.json(safePrompt)
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
    const { id } = await params
    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('🔧 Updating prompt with data:', body)

    // Map frontend fields to database schema
    const updateData: any = {}
    
    if (body.name) updateData.name = body.name
    if (body.displayName) updateData.name = body.displayName // displayName maps to name
    if (body.systemPrompt) updateData.template = body.systemPrompt // systemPrompt maps to template
    if (body.description) updateData.description = body.description
    if (body.category) updateData.category = body.category
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    console.log('🔧 Mapped update data:', updateData)

    // Check if prompt exists
    const existingPrompt = await prisma.promptTemplate.findUnique({
      where: { id }
    })

    if (!existingPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    // Check if name is unique (if being changed)
    if (updateData.name && updateData.name !== existingPrompt.name) {
      const nameExists = await prisma.promptTemplate.findUnique({
        where: { name: updateData.name }
      })
      
      if (nameExists) {
        return NextResponse.json(
          { error: 'Prompt name already exists' },
          { status: 400 }
        )
      }
    }

    const updatedPrompt = await prisma.promptTemplate.update({
      where: { id },
      data: updateData
    })

    console.log('✅ Prompt updated successfully:', updatedPrompt.name)

    // Return with frontend-compatible format
    const responsePrompt = {
      ...updatedPrompt,
      displayName: updatedPrompt.name,
      systemPrompt: updatedPrompt.template,
      userPrompt: '',
      usage: updatedPrompt.description || '',
      parameters: null,
      testData: null,
      version: '1.0.0',
      modelId: null,
      model: null
    }

    return NextResponse.json(responsePrompt)

  } catch (error) {
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

    // Check if prompt exists
    const existingPrompt = await prisma.promptTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            configurations: true,
            interactions: true
          }
        }
      }
    })

    if (!existingPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    // Check if prompt is being used
    if (existingPrompt._count.configurations > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete prompt that is being used in configurations',
          details: `This prompt is used in ${existingPrompt._count.configurations} configuration(s)`
        },
        { status: 400 }
      )
    }

    if (existingPrompt._count.interactions > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete prompt with interaction history',
          details: `This prompt has ${existingPrompt._count.interactions} interaction(s) in history`
        },
        { status: 400 }
      )
    }

    await prisma.promptTemplate.delete({
      where: { id }
    })

    console.log('✅ Prompt deleted successfully:', existingPrompt.name)

    return NextResponse.json({ 
      success: true,
      message: 'Prompt deleted successfully' 
    })

  } catch (error) {
    console.error('Error deleting prompt:', error)
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    )
  }
} 