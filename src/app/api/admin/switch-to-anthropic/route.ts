import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Switching system to use Anthropic...')
    
    // 1. Find Anthropic provider and model
    const anthropicProvider = await prisma.lLMProvider.findFirst({
      where: { name: 'anthropic' },
      include: { models: true }
    })
    
    if (!anthropicProvider) {
      throw new Error('Anthropic provider not found')
    }
    
    console.log(`📊 Anthropic provider found: ${anthropicProvider.id}`)
    console.log(`🔑 Anthropic has API key: ${!!anthropicProvider.apiKeyEncrypted}`)
    console.log(`🤖 Anthropic models: ${anthropicProvider.models.length}`)
    
    // 2. Find a good Anthropic model
    const anthropicModel = anthropicProvider.models.find(m => m.isActive) || anthropicProvider.models[0]
    
    if (!anthropicModel) {
      throw new Error('No Anthropic model found')
    }
    
    console.log(`🎯 Using Anthropic model: ${anthropicModel.name} (${anthropicModel.id})`)
    
    // 3. Update or create configuration to use Anthropic
    const existingConfig = await prisma.lLMConfiguration.findFirst({
      where: { isActive: true }
    })
    
    if (existingConfig) {
      // Update existing configuration
      const updatedConfig = await prisma.lLMConfiguration.update({
        where: { id: existingConfig.id },
        data: {
          name: 'Anthropic Claude Configuration',
          providerId: anthropicProvider.id,
          modelId: anthropicModel.id,
          promptTemplateId: null, // Default for all prompts
          maxTokens: 1000,
          temperature: 0.7,
          isActive: true
        },
        include: {
          provider: true,
          model: true
        }
      })
      console.log(`✅ Updated configuration: ${updatedConfig.name}`)
    } else {
      // Create new configuration
      const newConfig = await prisma.lLMConfiguration.create({
        data: {
          name: 'Anthropic Claude Configuration',
          providerId: anthropicProvider.id,
          modelId: anthropicModel.id,
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
      console.log(`✅ Created new configuration: ${newConfig.name}`)
    }
    
    // 4. Deactivate other configurations to avoid conflicts
    await prisma.lLMConfiguration.updateMany({
      where: {
        providerId: { not: anthropicProvider.id },
        isActive: true
      },
      data: { isActive: false }
    })
    
    // 5. Verify the setup
    const finalConfig = await prisma.lLMConfiguration.findFirst({
      where: { 
        providerId: anthropicProvider.id,
        isActive: true 
      },
      include: {
        provider: true,
        model: true
      }
    })
    
    if (!finalConfig) {
      throw new Error('Failed to create/update Anthropic configuration')
    }
    
    // 6. Test API key availability
    const hasApiKey = !!finalConfig.provider.apiKeyEncrypted
    console.log(`🔑 Final check - API key available: ${hasApiKey}`)
    
    return NextResponse.json({
      success: true,
      message: 'Successfully switched to Anthropic',
      details: {
        provider: finalConfig.provider.name,
        model: finalConfig.model.name,
        hasApiKey: hasApiKey,
        apiKeyPreview: finalConfig.provider.apiKeyEncrypted ? 
          `${finalConfig.provider.apiKeyEncrypted.substring(0, 20)}...` : null,
        configurationId: finalConfig.id,
        configurationName: finalConfig.name
      }
    })
    
  } catch (error) {
    console.error('❌ Error switching to Anthropic:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 