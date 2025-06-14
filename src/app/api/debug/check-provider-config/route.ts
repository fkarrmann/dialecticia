import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando configuración del proveedor Anthropic...')
    
    // Buscar el proveedor Anthropic
    const anthropicProvider = await prisma.lLMProvider.findFirst({
      where: { name: 'anthropic' }
    })
    
    if (!anthropicProvider) {
      return NextResponse.json({
        success: false,
        error: 'Proveedor Anthropic no encontrado'
      })
    }
    
    // Buscar configuraciones LLM activas
    const configurations = await prisma.lLMConfiguration.findMany({
      where: { 
        providerId: anthropicProvider.id,
        isActive: true 
      },
      include: {
        provider: true,
        model: true,
        promptTemplate: true
      }
    })
    
    // Buscar modelos de Anthropic
    const models = await prisma.lLMModel.findMany({
      where: { providerId: anthropicProvider.id }
    })
    
    return NextResponse.json({
      success: true,
      provider: {
        id: anthropicProvider.id,
        name: anthropicProvider.name,
        baseUrl: anthropicProvider.baseUrl,
        isActive: anthropicProvider.isActive,
        hasApiKey: !!(anthropicProvider as any).apiKeyEncrypted
      },
      configurations: configurations.map(config => ({
        id: config.id,
        name: config.name,
        isActive: config.isActive,
        model: config.model.name,
        modelIdentifier: config.model.modelIdentifier,
        promptTemplate: config.promptTemplate?.name || 'Sin template específico',
        temperature: config.temperature,
        maxTokens: config.maxTokens
      })),
      models: models.map(model => ({
        id: model.id,
        name: model.name,
        modelIdentifier: model.modelIdentifier,
        isActive: model.isActive,
        maxTokens: model.maxTokens,
        costPer1kTokens: model.costPer1kTokens
      })),
      summary: {
        providerBaseUrl: anthropicProvider.baseUrl,
        expectedBaseUrl: 'https://api.anthropic.com/v1',
        urlIsCorrect: anthropicProvider.baseUrl === 'https://api.anthropic.com/v1',
        activeConfigurations: configurations.length,
        totalModels: models.length,
        activeModels: models.filter(m => m.isActive).length
      }
    })
    
  } catch (error) {
    console.error('🔍 ERROR verificando configuración:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
} 