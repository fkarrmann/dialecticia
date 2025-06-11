import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'
import { z } from 'zod'

const CreatePromptSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  displayName: z.string().min(1).max(200),
  systemPrompt: z.string().min(1),
  userPrompt: z.string().optional(),
  description: z.string().optional(),
  usage: z.string().optional(),
  parameters: z.record(z.any()).optional(),
  testData: z.record(z.any()).optional(),
  modelId: z.string().optional(),
})

const UpdatePromptSchema = CreatePromptSchema.partial()

// GET: List all prompt templates
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
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const prompts = await prisma.promptTemplate.findMany({
      where: {
        ...(category && { category }),
        ...(activeOnly && { isActive: true })
      },
      include: {
        _count: {
          select: {
            interactions: true
          }
        }
      },
      orderBy: [
        { name: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Agregar campos dummy para compatibilidad frontend
    const safePrompts = prompts.map(prompt => ({
      ...prompt,
      // Campos que espera el frontend pero no están en schema actual
      displayName: prompt.name, // Usar name como displayName
      systemPrompt: prompt.template, // Usar template como systemPrompt
      userPrompt: '', // Campo dummy
      usage: prompt.description || '', // Usar description como usage
      parameters: null, // Campo dummy
      testData: null, // Campo dummy
      version: '1.0.0', // Versión dummy
      modelId: null, // Campo dummy
      model: null // Campo dummy
    }))

    return NextResponse.json(safePrompts)

  } catch (error) {
    console.error('Error fetching prompts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    )
  }
}

// POST: Create new prompt template
export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(
      { error: 'Endpoint temporarily disabled - schema mismatch' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Error creating prompt:', error)
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    )
  }
} 