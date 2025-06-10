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
      },
      orderBy: [
        { name: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(prompts)

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
    const validatedData = CreatePromptSchema.parse(body)

    // Check if we're creating a new version or a new prompt
    const existingPrompts = await prisma.promptTemplate.findMany({
      where: { name: validatedData.name },
      orderBy: { version: 'desc' },
      take: 1
    })

    let version = '1.0.0'
    if (existingPrompts.length > 0) {
      // Create new version (increment minor version)
      const lastVersion = existingPrompts[0].version
      const [major, minor, patch] = lastVersion.split('.').map(Number)
      version = `${major}.${minor + 1}.${patch}`
      
      // Deactivate previous versions
      await prisma.promptTemplate.updateMany({
        where: { name: validatedData.name },
        data: { isActive: false }
      })
    }

    const prompt = await prisma.promptTemplate.create({
      data: {
        name: validatedData.name,
        category: validatedData.category,
        displayName: validatedData.displayName,
        version,
        systemPrompt: validatedData.systemPrompt,
        userPrompt: validatedData.userPrompt,
        description: validatedData.description,
        usage: validatedData.usage,
        parameters: validatedData.parameters ? JSON.stringify(validatedData.parameters) : null,
        testData: validatedData.testData ? JSON.stringify(validatedData.testData) : null,
        createdBy: session.user.id,
        isActive: true,
      }
    })

    return NextResponse.json(prompt, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating prompt:', error)
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    )
  }
} 