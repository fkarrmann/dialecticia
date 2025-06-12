import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing model identifier...')
    
    // Buscar el modelo de Claude 3.5 Sonnet que está causando problemas
    const brokenModel = await prisma.lLMModel.findFirst({
      where: {
        name: 'Claude 3.5 Sonnet (Latest)',
        modelIdentifier: 'claude-3-5-sonnet-20241022'
      }
    })
    
    if (brokenModel) {
      console.log(`🔍 Found broken model: ${brokenModel.id}`)
      
      // Actualizar a Claude 3.5 Haiku que es más estable
      const updatedModel = await prisma.lLMModel.update({
        where: { id: brokenModel.id },
        data: {
          name: 'Claude 3.5 Haiku',
          modelIdentifier: 'claude-3-5-haiku-20241022'
        }
      })
      
      console.log(`✅ Updated model to: ${updatedModel.modelIdentifier}`)
      
      return NextResponse.json({
        success: true,
        message: 'Model identifier fixed successfully',
        details: {
          oldIdentifier: 'claude-3-5-sonnet-20241022',
          newIdentifier: updatedModel.modelIdentifier,
          modelName: updatedModel.name
        }
      })
    }
    
    // Si no encontramos el modelo problemático, buscar cualquier modelo de Anthropic
    const anthropicModels = await prisma.lLMModel.findMany({
      include: { provider: true },
      where: {
        provider: {
          name: 'anthropic'
        }
      }
    })
    
    console.log(`📊 Found ${anthropicModels.length} Anthropic models`)
    
    // Actualizar todos los modelos de Anthropic a identificadores válidos
    const updates = []
    for (const model of anthropicModels) {
      if (model.modelIdentifier === 'claude-3-5-sonnet-20241022') {
        const updated = await prisma.lLMModel.update({
          where: { id: model.id },
          data: {
            modelIdentifier: 'claude-3-5-haiku-20241022',
            name: 'Claude 3.5 Haiku'
          }
        })
        updates.push(updated)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${updates.length} model identifiers`,
      updates: updates.map(u => ({
        id: u.id,
        name: u.name,
        modelIdentifier: u.modelIdentifier
      }))
    })
    
  } catch (error) {
    console.error('🔧 Fix model error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}