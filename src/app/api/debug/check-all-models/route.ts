import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 CHECKING: Verificando todos los modelos y configuraciones LLM...')
    
    // 1. Obtener todos los modelos
    const allModels = await prisma.lLMModel.findMany({
      include: {
        provider: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`📊 Total de modelos encontrados: ${allModels.length}`)
    
    // 2. Obtener todas las configuraciones activas
    const activeConfigurations = await prisma.lLMConfiguration.findMany({
      where: { isActive: true },
      include: {
        provider: true,
        model: true,
        promptTemplate: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`⚡ Configuraciones activas: ${activeConfigurations.length}`)
    
    // 3. Obtener todos los providers
    const allProviders = await prisma.lLMProvider.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`🏢 Providers encontrados: ${allProviders.length}`)
    
    // 4. Buscar específicamente modelos de Claude
    const claudeModels = allModels.filter(model => 
      model.name.toLowerCase().includes('claude') || 
      model.modelIdentifier.includes('claude')
    )
    
    console.log(`🤖 Modelos de Claude encontrados: ${claudeModels.length}`)
    
    // 5. Verificar configuraciones que usan Claude
    const claudeConfigurations = activeConfigurations.filter(config =>
      config.model.name.toLowerCase().includes('claude') ||
      config.model.modelIdentifier.includes('claude')
    )
    
    console.log(`⚙️ Configuraciones activas de Claude: ${claudeConfigurations.length}`)
    
    return NextResponse.json({
      success: true,
      summary: {
        totalModels: allModels.length,
        activeConfigurations: activeConfigurations.length,
        totalProviders: allProviders.length,
        claudeModels: claudeModels.length,
        claudeConfigurations: claudeConfigurations.length
      },
      models: allModels.map(model => ({
        id: model.id,
        name: model.name,
        identifier: model.modelIdentifier,
        provider: model.provider.name,
        isActive: model.isActive,
        createdAt: model.createdAt
      })),
      activeConfigurations: activeConfigurations.map(config => ({
        id: config.id,
        name: config.name,
        provider: config.provider.name,
        model: config.model.name,
        modelIdentifier: config.model.modelIdentifier,
        promptTemplate: config.promptTemplate?.name || 'DEFAULT',
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        createdAt: config.createdAt
      })),
      providers: allProviders.map(provider => ({
        id: provider.id,
        name: provider.name,
        baseUrl: provider.baseUrl,
        isActive: provider.isActive,
        hasApiKey: !!(provider as any).apiKeyEncrypted,
        createdAt: provider.createdAt
      })),
      claudeSpecific: {
        models: claudeModels.map(model => ({
          id: model.id,
          name: model.name,
          identifier: model.modelIdentifier,
          provider: model.provider.name,
          isActive: model.isActive
        })),
        configurations: claudeConfigurations.map(config => ({
          id: config.id,
          name: config.name,
          modelName: config.model.name,
          modelIdentifier: config.model.modelIdentifier,
          promptTemplate: config.promptTemplate?.name || 'DEFAULT',
          isActive: config.isActive
        }))
      }
    })
    
  } catch (error) {
    console.error('🔍 CHECK ERROR:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
} 