import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug LLM Config - Checking database state...')
    
    // 1. Check LLM Providers
    const providers = await prisma.lLMProvider.findMany({
      include: {
        models: true,
        configurations: true
      }
    })
    
    console.log('📊 Providers found:', providers.length)
    providers.forEach(p => {
      console.log(`  - ${p.name}: ${p.isActive ? 'ACTIVE' : 'INACTIVE'}, hasApiKey: ${!!p.apiKeyEncrypted}`)
    })
    
    // 2. Check LLM Configurations
    const configurations = await prisma.lLMConfiguration.findMany({
      include: {
        provider: true,
        model: true,
        promptTemplate: true
      }
    })
    
    console.log('⚙️ Configurations found:', configurations.length)
    configurations.forEach(c => {
      console.log(`  - ${c.name}: ${c.isActive ? 'ACTIVE' : 'INACTIVE'}, Provider: ${c.provider.name}, Model: ${c.model.name}`)
    })
    
    // 3. Check Prompt Templates
    const prompts = await prisma.promptTemplate.findMany({
      where: {
        name: {
          in: ['final_personality_generation', 'argument_style_generation', 'core_beliefs_generation']
        }
      }
    })
    
    console.log('📝 Wizard Prompts found:', prompts.length)
    prompts.forEach(p => {
      console.log(`  - ${p.name}: ${p.isActive ? 'ACTIVE' : 'INACTIVE'}`)
    })
    
    // 4. Test specific configuration lookup
    const finalGenConfig = await prisma.lLMConfiguration.findFirst({
      where: { 
        promptTemplateId: prompts.find(p => p.name === 'final_personality_generation')?.id,
        isActive: true 
      },
      include: {
        provider: true,
        model: true,
        promptTemplate: true
      }
    })
    
    console.log('🎯 final_personality_generation config:', finalGenConfig ? 'FOUND' : 'NOT FOUND')
    if (finalGenConfig) {
      console.log(`  - Provider: ${finalGenConfig.provider.name}`)
      console.log(`  - Model: ${finalGenConfig.model.name}`)
      console.log(`  - Has API Key: ${!!finalGenConfig.provider.apiKeyEncrypted}`)
    }
    
    // 5. Check for default configuration
    const defaultConfig = await prisma.lLMConfiguration.findFirst({
      where: { 
        promptTemplateId: null,
        isActive: true 
      },
      include: {
        provider: true,
        model: true
      }
    })
    
    console.log('🔄 Default config:', defaultConfig ? 'FOUND' : 'NOT FOUND')
    if (defaultConfig) {
      console.log(`  - Provider: ${defaultConfig.provider.name}`)
      console.log(`  - Model: ${defaultConfig.model.name}`)
      console.log(`  - Has API Key: ${!!defaultConfig.provider.apiKeyEncrypted}`)
    }
    
    const summary = {
      providers: providers.map(p => ({
        id: p.id,
        name: p.name,
        isActive: p.isActive,
        hasApiKey: !!p.apiKeyEncrypted,
        apiKeyPreview: p.apiKeyEncrypted ? `${p.apiKeyEncrypted.substring(0, 10)}...` : null,
        modelsCount: p.models.length,
        configurationsCount: p.configurations.length
      })),
      configurations: configurations.map(c => ({
        id: c.id,
        name: c.name,
        isActive: c.isActive,
        provider: c.provider.name,
        model: c.model.name,
        promptTemplate: c.promptTemplate?.name || 'DEFAULT',
        hasProviderApiKey: !!c.provider.apiKeyEncrypted
      })),
      wizardPrompts: prompts.map(p => ({
        name: p.name,
        isActive: p.isActive,
        hasTemplate: !!p.template
      })),
      finalGenConfig: finalGenConfig ? {
        found: true,
        provider: finalGenConfig.provider.name,
        model: finalGenConfig.model.name,
        hasApiKey: !!finalGenConfig.provider.apiKeyEncrypted
      } : { found: false },
      defaultConfig: defaultConfig ? {
        found: true,
        provider: defaultConfig.provider.name,
        model: defaultConfig.model.name,
        hasApiKey: !!defaultConfig.provider.apiKeyEncrypted
      } : { found: false },
      environment: {
        OPENAI_API_KEY_EXISTS: !!process.env.OPENAI_API_KEY,
        ANTHROPIC_API_KEY_EXISTS: !!process.env.ANTHROPIC_API_KEY,
        DATABASE_URL: process.env.DATABASE_POSTGRES_PRISMA_URL ? 'POSTGRES' : 'OTHER'
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary
    })
    
  } catch (error) {
    console.error('❌ Debug LLM Config error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

// POST method to fix configuration - switch to Anthropic
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 POST Debug - Creating/Switching to Anthropic configuration...')
    
    // Find Anthropic provider
    const anthropicProvider = await prisma.lLMProvider.findFirst({
      where: { name: 'anthropic' },
      include: { 
        models: {
          where: { isActive: true }
        },
        configurations: true
      }
    })
    
    if (!anthropicProvider) {
      throw new Error('Anthropic provider not found')
    }
    
    if (anthropicProvider.models.length === 0) {
      // Try to find any Anthropic model, even if inactive
      const allModels = await prisma.lLMModel.findMany({
        where: { providerId: anthropicProvider.id }
      })
      
      if (allModels.length === 0) {
        throw new Error('No Anthropic models found at all')
      }
      
      // Activate the first model we find
      const modelToActivate = allModels[0]
      await prisma.lLMModel.update({
        where: { id: modelToActivate.id },
        data: { isActive: true }
      })
      
      anthropicProvider.models = [modelToActivate]
    }
    
    const anthropicModel = anthropicProvider.models[0]
    console.log('Found/activated model:', anthropicModel.name, anthropicModel.modelIdentifier)
    
    // Check for existing configuration
    const existingConfig = await prisma.lLMConfiguration.findFirst({
      where: { isActive: true }
    })
    
    let updatedConfig
    if (existingConfig) {
      console.log('Updating existing configuration...')
      updatedConfig = await prisma.lLMConfiguration.update({
        where: { id: existingConfig.id },
        data: {
          name: 'Anthropic Claude Configuration',
          providerId: anthropicProvider.id,
          modelId: anthropicModel.id
        },
        include: {
          provider: true,
          model: true
        }
      })
    } else {
      console.log('Creating new configuration...')
      updatedConfig = await prisma.lLMConfiguration.create({
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
    }
    
    return NextResponse.json({
      success: true,
      message: 'Switched to Anthropic successfully',
      configuration: {
        id: updatedConfig.id,
        name: updatedConfig.name,
        provider: updatedConfig.provider.name,
        model: updatedConfig.model.name,
        hasApiKey: !!updatedConfig.provider.apiKeyEncrypted,
        apiKeyPreview: updatedConfig.provider.apiKeyEncrypted ? 
          `${updatedConfig.provider.apiKeyEncrypted.substring(0, 20)}...` : null
      }
    })
    
  } catch (error) {
    console.error('❌ POST Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 