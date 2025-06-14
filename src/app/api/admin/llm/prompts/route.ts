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
            interactions: true,
            configurations: true
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
      model: null, // Campo dummy
      // Preserve _count from database
      _count: {
        interactions: prompt._count.interactions || 0,
        configurations: prompt._count.configurations || 0
      }
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
    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('🔧 Creating prompt with data:', body)

    // Map frontend fields to database schema
    const createData: any = {
      category: body.category || 'general',
      isActive: body.isActive !== undefined ? body.isActive : true
    }
    
    // Map required fields
    if (body.name) {
      createData.name = body.name
    } else if (body.displayName) {
      createData.name = body.displayName // displayName maps to name
    } else {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (body.systemPrompt) {
      createData.template = body.systemPrompt // systemPrompt maps to template
    } else {
      return NextResponse.json(
        { error: 'System prompt is required' },
        { status: 400 }
      )
    }

    if (body.description) createData.description = body.description

    console.log('🔧 Mapped create data:', createData)

    // Check if prompt name already exists
    const existingPrompt = await prisma.promptTemplate.findUnique({
      where: { name: createData.name }
    })

    if (existingPrompt) {
      return NextResponse.json(
        { error: 'Prompt with this name already exists' },
        { status: 400 }
      )
    }

    const newPrompt = await prisma.promptTemplate.create({
      data: createData
    })

    console.log('✅ Prompt created successfully:', newPrompt.name)

    // Return with frontend-compatible format
    const responsePrompt = {
      ...newPrompt,
      displayName: newPrompt.name,
      systemPrompt: newPrompt.template,
      userPrompt: '',
      usage: newPrompt.description || '',
      parameters: null,
      testData: null,
      version: '1.0.0',
      modelId: null,
      model: null
    }

    return NextResponse.json(responsePrompt, { status: 201 })

  } catch (error) {
    console.error('Error creating prompt:', error)
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    )
  }
} 