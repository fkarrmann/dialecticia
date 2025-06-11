import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'
import crypto from 'crypto'
import { z } from 'zod'

// Encryption key
const ENCRYPTION_KEY = process.env.LLM_ENCRYPTION_KEY || 'dev-key-32-chars-long-for-testing'

function encryptApiKey(apiKey: string): string {
  if (!apiKey) return ''
  
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY)
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

function decryptApiKey(encryptedKey: string): string {
  if (!encryptedKey) return ''
  
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Error decrypting API key:', error)
    return ''
  }
}

const CreateProviderSchema = z.object({
  name: z.string().min(1).max(50),
  baseUrl: z.string().url().optional(),
})

const UpdateProviderSchema = CreateProviderSchema.partial()

// GET: List all providers
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const providers = await prisma.lLMProvider.findMany({
      include: {
        models: {
          select: {
            id: true,
            name: true,
            modelIdentifier: true,
            isActive: true,
            costPer1kTokens: true,
          }
        },
        _count: {
          select: {
            models: true,
            configurations: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Providers con información del schema actual
    const safeProviders = providers.map(provider => ({
      ...provider,
      modelsCount: provider.models.length,
      configurationsCount: provider._count.configurations
    }))

    return NextResponse.json(safeProviders)

  } catch (error) {
    console.error('Error fetching providers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    )
  }
}

// POST: Create new provider
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
    const validatedData = CreateProviderSchema.parse(body)

    // Check if provider name already exists
    const existingProvider = await prisma.lLMProvider.findUnique({
      where: { name: validatedData.name }
    })

    if (existingProvider) {
      return NextResponse.json(
        { error: 'Provider with this name already exists' },
        { status: 400 }
      )
    }

    const provider = await prisma.lLMProvider.create({
      data: {
        name: validatedData.name,
        baseUrl: validatedData.baseUrl,
      }
    })

    return NextResponse.json(provider, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating provider:', error)
    return NextResponse.json(
      { error: 'Failed to create provider' },
      { status: 500 }
    )
  }
} 