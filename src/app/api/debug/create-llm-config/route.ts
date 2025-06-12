import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Creating LLM configuration...')

    // Find Anthropic provider and models
    const anthropicProvider = await prisma.lLMProvider.findFirst({
      where: { name: 'anthropic' },
      include: { 
        models: {
          where: { isActive: true }
        }
      }
    })

    if (!anthropicProvider) {
      return NextResponse.json({
        success: false,
        error: 'No Anthropic provider found'
      })
    }

    if (anthropicProvider.models.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active Anthropic models found',
        provider: anthropicProvider
      })
    }

    const model = anthropicProvider.models[0]
    console.log('Found model:', model.name, model.modelIdentifier)

    // Check if there's already an active configuration
    const existingConfig = await prisma.lLMConfiguration.findFirst({
      where: { isActive: true }
    })

    if (existingConfig) {
      return NextResponse.json({
        success: true,
        message: 'Configuration already exists',
        existingConfig: existingConfig
      })
    }

    // Create new configuration
    const newConfig = await prisma.lLMConfiguration.create({
      data: {
        name: 'Default Anthropic Configuration',
        providerId: anthropicProvider.id,
        modelId: model.id,
        promptTemplateId: null,
        maxTokens: 1000,
        temperature: 0.7,
        isActive: true
      },
      include: {
        provider: true,
        model: true
      }
    })

    console.log('✅ Created configuration:', newConfig.name)

    return NextResponse.json({
      success: true,
      message: 'LLM configuration created successfully',
      configuration: newConfig,
      provider: anthropicProvider,
      model: model
    })

  } catch (error) {
    console.error('Error creating LLM configuration:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create LLM configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 