import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Adding Claude Sonnet 4 model for June 2025...')

    // 1. Buscar el provider de Anthropic
    const anthropicProvider = await prisma.lLMProvider.findFirst({
      where: { name: 'anthropic' }
    })
    
    if (!anthropicProvider) {
      return NextResponse.json({ 
        success: false,
        error: 'Anthropic provider not found' 
      })
    }

    console.log('Found Anthropic provider:', anthropicProvider.id)

    // 2. Verificar si el modelo ya existe
    const existingModel = await prisma.lLMModel.findFirst({
      where: { 
        providerId: anthropicProvider.id,
        modelIdentifier: 'claude-sonnet-4-20250514'
      }
    })

    if (existingModel) {
      return NextResponse.json({ 
        success: true,
        message: 'Model already exists',
        model: existingModel
      })
    }

    // 3. Crear el nuevo modelo Claude Sonnet 4
    const newModel = await prisma.lLMModel.create({
      data: {
        name: 'Claude Sonnet 4',
        providerId: anthropicProvider.id,
        modelIdentifier: 'claude-sonnet-4-20250514',
        displayName: 'Claude Sonnet 4 (June 2025)',
        isActive: true,
        maxTokens: 200000, // Claude 4 tiene mayor capacidad
        costPer1kInput: 0.003, // Estimado para Claude 4
        costPer1kOutput: 0.015, // Estimado para Claude 4
        capabilities: JSON.stringify({
          reasoning: 'advanced',
          coding: 'expert',
          analysis: 'deep',
          multimodal: true,
          contextWindow: 200000
        }),
        parameters: JSON.stringify({
          temperature: 0.7,
          maxTokens: 4000,
          topP: 1.0
        })
      }
    })

    console.log('Created new model:', newModel.id)

    // 4. Crear una nueva configuración para Claude 4
    const newConfiguration = await prisma.lLMConfiguration.create({
      data: {
        name: 'Claude Sonnet 4 Configuration',
        providerId: anthropicProvider.id,
        modelId: newModel.id,
        maxTokens: 4000,
        temperature: 0.7,
        isActive: false // No activar automáticamente para no interferir
      }
    })

    console.log('Created new configuration:', newConfiguration.id)

    return NextResponse.json({
      success: true,
      message: 'Claude Sonnet 4 model added successfully',
      model: {
        id: newModel.id,
        name: newModel.name,
        modelIdentifier: newModel.modelIdentifier,
        displayName: newModel.displayName,
        maxTokens: newModel.maxTokens
      },
      configuration: {
        id: newConfiguration.id,
        name: newConfiguration.name,
        isActive: newConfiguration.isActive
      },
      instructions: 'Model created but not activated. Use the admin panel to activate it.'
    })

  } catch (error) {
    console.error('Error adding Claude 4 model:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to add Claude 4 model',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 