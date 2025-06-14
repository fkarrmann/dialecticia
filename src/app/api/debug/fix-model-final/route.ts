import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 FINAL FIX: Updating model identifier to valid Anthropic model...')

    // 1. Buscar el modelo de Anthropic activo
    const anthropicModel = await prisma.lLMModel.findFirst({
      where: { 
        provider: {
          name: 'anthropic'
        }
      },
      include: {
        provider: true,
        configurations: true
      }
    })
    
    if (!anthropicModel) {
      return NextResponse.json({ 
        success: false,
        error: 'No Anthropic model found' 
      })
    }

    console.log('Found model:', {
      id: anthropicModel.id,
      name: anthropicModel.name,
      currentIdentifier: anthropicModel.modelIdentifier,
      provider: anthropicModel.provider.name
    })

    // 2. Actualizar con un modelo válido de Anthropic
    const validModelIdentifier = 'claude-3-5-sonnet-20241022' // Modelo válido según la documentación
    
    const updatedModel = await prisma.lLMModel.update({
      where: { id: anthropicModel.id },
      data: {
        modelIdentifier: validModelIdentifier,
        name: 'Claude 3.5 Sonnet v2',
        displayName: 'Claude 3.5 Sonnet v2 (Working)',
        maxTokens: 200000,
        costPer1kInput: 3.0,
        costPer1kOutput: 15.0,
        isActive: true
      }
    })

    console.log('✅ Model updated successfully:', {
      id: updatedModel.id,
      name: updatedModel.name,
      newIdentifier: updatedModel.modelIdentifier
    })

    // 3. Verificar que la configuración sigue activa
    const activeConfig = await prisma.lLMConfiguration.findFirst({
      where: { 
        modelId: updatedModel.id,
        isActive: true 
      },
      include: {
        provider: true,
        model: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Model identifier updated to valid Anthropic model',
      model: {
        id: updatedModel.id,
        name: updatedModel.name,
        oldIdentifier: anthropicModel.modelIdentifier,
        newIdentifier: updatedModel.modelIdentifier,
        provider: anthropicModel.provider.name
      },
      configuration: activeConfig ? {
        id: activeConfig.id,
        name: activeConfig.name,
        isActive: activeConfig.isActive
      } : null
    })
    
  } catch (error) {
    console.error('❌ Error fixing model:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
} 