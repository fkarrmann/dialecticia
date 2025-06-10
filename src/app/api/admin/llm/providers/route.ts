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
  displayName: z.string().min(1).max(100),
  baseUrl: z.string().url(),
  apiKey: z.string().optional(),
  maxTokens: z.number().int().min(1).max(1000000).default(4000),
  rateLimitRpm: z.number().int().min(1).max(10000).default(60),
  rateLimitTpm: z.number().int().min(1).max(1000000).default(60000),
  costPer1kTokens: z.number().min(0).max(1000).default(0.002),
  metadata: z.record(z.any()).optional(),
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
            modelName: true,
            displayName: true,
            isActive: true,
            costPer1kInput: true,
            costPer1kOutput: true,
          }
        },
        _count: {
          select: {
            interactions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Hide encrypted API keys, only show last 4 characters
    const safeProviders = providers.map(provider => ({
      ...provider,
      apiKeyEncrypted: undefined,
      apiKeyPreview: provider.apiKeyEncrypted 
        ? `****${provider.apiKeyEncrypted.slice(-4)}` 
        : null,
      hasApiKey: !!provider.apiKeyEncrypted
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

    // Encrypt API key if provided
    const apiKeyEncrypted = validatedData.apiKey 
      ? encryptApiKey(validatedData.apiKey)
      : null

    const provider = await prisma.lLMProvider.create({
      data: {
        name: validatedData.name,
        displayName: validatedData.displayName,
        baseUrl: validatedData.baseUrl,
        apiKeyEncrypted,
        maxTokens: validatedData.maxTokens,
        rateLimitRpm: validatedData.rateLimitRpm,
        rateLimitTpm: validatedData.rateLimitTpm,
        costPer1kTokens: validatedData.costPer1kTokens,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
      }
    })

    // Return safe version without API key
    const safeProvider = {
      ...provider,
      apiKeyEncrypted: undefined,
      apiKeyPreview: apiKeyEncrypted ? `****${apiKeyEncrypted.slice(-4)}` : null,
      hasApiKey: !!apiKeyEncrypted
    }

    return NextResponse.json(safeProvider, { status: 201 })

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