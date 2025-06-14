import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 FIX COMPLETO DE ANTHROPIC...')
    
    const fixes = []
    
    // 1. Buscar el proveedor actual (puede ser 'anthropic-claude' o 'anthropic')
    let anthropicProvider = await prisma.lLMProvider.findFirst({
      where: { 
        OR: [
          { name: 'anthropic' },
          { name: 'anthropic-claude' }
        ]
      }
    })
    
    if (!anthropicProvider) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró proveedor Anthropic'
      })
    }
    
    console.log(`📊 Proveedor encontrado: ${anthropicProvider.name}`)
    
    // 2. Corregir nombre del proveedor si es necesario
    if (anthropicProvider.name === 'anthropic-claude') {
      console.log('🔧 Corrigiendo nombre del proveedor...')
      
      anthropicProvider = await prisma.lLMProvider.update({
        where: { id: anthropicProvider.id },
        data: { name: 'anthropic' }
      })
      
      fixes.push('Nombre del proveedor corregido: anthropic-claude → anthropic')
    }
    
    // 3. Corregir URL si es necesario
    const correctUrl = 'https://api.anthropic.com/v1'
    if (anthropicProvider.baseUrl !== correctUrl) {
      console.log('🔧 Corrigiendo URL del proveedor...')
      
      await prisma.lLMProvider.update({
        where: { id: anthropicProvider.id },
        data: { baseUrl: correctUrl }
      })
      
      fixes.push(`URL corregida: ${anthropicProvider.baseUrl} → ${correctUrl}`)
    }
    
    // 4. Buscar y corregir modelos
    const models = await prisma.lLMModel.findMany({
      where: { providerId: anthropicProvider.id }
    })
    
    for (const model of models) {
      // Corregir identificador del modelo si es necesario
      if (model.modelIdentifier === 'claude-sonnet-4-real') {
        console.log('🔧 Corrigiendo identificador del modelo...')
        
        await prisma.lLMModel.update({
          where: { id: model.id },
          data: { 
            modelIdentifier: 'claude-sonnet-4-20250514',
            name: 'claude-sonnet-4-20250514'
          }
        })
        
        fixes.push(`Modelo corregido: ${model.modelIdentifier} → claude-sonnet-4-20250514`)
      }
    }
    
    // 5. Verificar configuraciones LLM
    const configurations = await prisma.lLMConfiguration.findMany({
      where: { 
        isActive: true,
        provider: { name: 'anthropic' }
      },
      include: {
        provider: true,
        model: true,
        promptTemplate: true
      }
    })
    
    console.log(`📊 Configuraciones activas encontradas: ${configurations.length}`)
    
    // 6. Crear configuración por defecto si no existe
    const defaultConfig = await prisma.lLMConfiguration.findFirst({
      where: {
        promptTemplate: { name: 'philosopher_chat_system' },
        isActive: true
      },
      include: {
        provider: true,
        model: true,
        promptTemplate: true
      }
    })
    
    if (!defaultConfig) {
      console.log('🔧 Creando configuración por defecto...')
      
      const promptTemplate = await prisma.promptTemplate.findFirst({
        where: { name: 'philosopher_chat_system', isActive: true }
      })
      
      const model = await prisma.lLMModel.findFirst({
        where: { 
          providerId: anthropicProvider.id,
          isActive: true
        }
      })
      
      if (promptTemplate && model) {
        await prisma.lLMConfiguration.create({
          data: {
            name: 'Default Anthropic Configuration',
            providerId: anthropicProvider.id,
            modelId: model.id,
            promptTemplateId: promptTemplate.id,
            isActive: true,
            temperature: 0.7,
            maxTokens: 4000
          }
        })
        
        fixes.push('Configuración por defecto creada')
      }
    }
    
    // 7. Estado final
    const finalProvider = await prisma.lLMProvider.findFirst({
      where: { name: 'anthropic' }
    })
    
    const finalModels = await prisma.lLMModel.findMany({
      where: { providerId: finalProvider?.id }
    })
    
    const finalConfigurations = await prisma.lLMConfiguration.findMany({
      where: { 
        providerId: finalProvider?.id,
        isActive: true
      },
      include: {
        model: true,
        promptTemplate: true
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Fix completo de Anthropic ejecutado',
      fixes,
      finalState: {
        provider: {
          name: finalProvider?.name,
          baseUrl: finalProvider?.baseUrl,
          isActive: finalProvider?.isActive
        },
        models: finalModels.map(m => ({
          name: m.name,
          modelIdentifier: m.modelIdentifier,
          isActive: m.isActive
        })),
        configurations: finalConfigurations.map(c => ({
          name: c.name,
          model: c.model.modelIdentifier,
          promptTemplate: c.promptTemplate?.name,
          isActive: c.isActive
        }))
      }
    })
    
  } catch (error) {
    console.error('🔧 ERROR en fix completo:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
} 