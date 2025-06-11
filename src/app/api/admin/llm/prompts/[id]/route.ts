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
    return NextResponse.json(
      { error: 'Endpoint temporarily disabled - schema mismatch' },
      { status: 501 }
    )
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
    return NextResponse.json(
      { error: 'Endpoint temporarily disabled - schema mismatch' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Error deleting prompt:', error)
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    )
  }
} 