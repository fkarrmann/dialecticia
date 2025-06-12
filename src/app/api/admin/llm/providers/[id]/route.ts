// RECREATED: Fixed for Next.js 15 params typing
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'
import { z } from 'zod'
import crypto from 'crypto'

// RECREATED: Fixed for Next.js 15 params typing
const ENCRYPTION_KEY = process.env.LLM_ENCRYPTION_KEY || 'dev-key-32-chars-long-for-testing'

function encryptApiKey(apiKey: string): string {
  if (!apiKey) return ''
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY)
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

const UpdateProviderSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  displayName: z.string().min(1).max(100).optional(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  maxTokens: z.number().min(1).max(1000000).optional(),
  rateLimitRpm: z.number().min(1).max(100000).optional(),
  rateLimitTpm: z.number().min(1).max(10000000).optional(),
  costPer1kTokens: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
})

// GET: Get specific provider
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const provider = await prisma.lLMProvider.findUnique({
      where: { id },
      include: {
        models: {
          select: {
            id: true,
            name: true,
            modelIdentifier: true,
            isActive: true
          }
        }
      }
    })

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Compatibilidad con frontend - agregar campos faltantes
    const responseData = {
      ...provider,
      displayName: provider.name,
      maxTokens: 4000,
      rateLimitRpm: 60,
      rateLimitTpm: 60000,
      costPer1kTokens: 0.002,
      hasApiKey: false,
      apiKeyPreview: null
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error fetching provider:', error)
    return NextResponse.json(
      { error: 'Failed to fetch provider' },
      { status: 500 }
    )
  }
}

// PUT: Update provider
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = UpdateProviderSchema.parse(body)

    // Check if provider exists
    const existingProvider = await prisma.lLMProvider.findUnique({
      where: { id }
    })

    if (!existingProvider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Check if name is unique (if being changed)
    if (validatedData.name && validatedData.name !== existingProvider.name) {
      const nameExists = await prisma.lLMProvider.findUnique({
        where: { name: validatedData.name }
      })
      
      if (nameExists) {
        return NextResponse.json(
          { error: 'Provider name already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare update data - solo campos que existen en el schema actual
    const updateData: any = {}
    
    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.baseUrl) updateData.baseUrl = validatedData.baseUrl
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive
    // Ignorar campos que no existen en schema: displayName, maxTokens, rateLimitRpm, etc.

    const updatedProvider = await prisma.lLMProvider.update({
      where: { id },
      data: updateData,
      include: {
        models: {
          select: {
            id: true,
            name: true,
            modelIdentifier: true,
            isActive: true
          }
        },
        _count: {
          select: {
            models: true,
            configurations: true
          }
        }
      }
    })

    // Prepare response data - compatibilidad con frontend
    const responseData = {
      ...updatedProvider,
      displayName: updatedProvider.name,
      maxTokens: 4000,
      rateLimitRpm: 60,
      rateLimitTpm: 60000,
      costPer1kTokens: 0.002,
      hasApiKey: false,
      apiKeyPreview: null,
      _count: {
        interactions: 0
      }
    }

    return NextResponse.json(responseData)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating provider:', error)
    return NextResponse.json(
      { error: 'Failed to update provider' },
      { status: 500 }
    )
  }
}

// DELETE: Delete provider
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Check if provider exists
    const provider = await prisma.lLMProvider.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            models: true,
            configurations: true
          }
        }
      }
    })

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Check if provider has models or configurations
    if (provider._count.models > 0) {
      // Get the actual models using this provider
      const models = await prisma.lLMModel.findMany({
        where: { providerId: id },
        select: {
          id: true,
          name: true,
          modelIdentifier: true,
          isActive: true
        }
      })

      return NextResponse.json(
        { 
          error: 'Cannot delete provider with existing models',
          details: `This provider has ${provider._count.models} model(s). Please delete these models first.`,
          models: models
        },
        { status: 400 }
      )
    }

    if (provider._count.configurations > 0) {
      // Get the actual configurations using this provider
      const configurations = await prisma.lLMConfiguration.findMany({
        where: { providerId: id },
        select: {
          id: true,
          name: true,
          isActive: true
        }
      })

      return NextResponse.json(
        { 
          error: 'Cannot delete provider with existing configurations',
          details: `This provider has ${provider._count.configurations} configuration(s). Please delete or reassign these configurations first.`,
          configurations: configurations
        },
        { status: 400 }
      )
    }

    await prisma.lLMProvider.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Provider deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting provider:', error)
    return NextResponse.json(
      { error: 'Failed to delete provider' },
      { status: 500 }
    )
  }
} 