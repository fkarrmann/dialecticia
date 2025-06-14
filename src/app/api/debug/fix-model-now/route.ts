import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 FIXING MODEL: Actualizando modelo de Anthropic...')
    
    // Buscar el modelo de Anthropic
    const anthropicModel = await prisma.lLMModel.findFirst({
      where: {
        provider: {
          name: 'anthropic'
        }
      },
      include: {
        provider: true
      }
    })
    
    if (!anthropicModel) {
      return NextResponse.json({
        success: false,
        error: 'Modelo de Anthropic no encontrado'
      }, { status: 404 })
    }
    
    console.log(`🔍 Modelo actual: ${anthropicModel.modelIdentifier}`)
    
    // Actualizar a un modelo que definitivamente funciona
    const workingModelId = 'claude-3-5-sonnet-20241022'
    
    const updatedModel = await prisma.lLMModel.update({
      where: { id: anthropicModel.id },
      data: {
        modelIdentifier: workingModelId,
        name: 'Claude 3.5 Sonnet (Working)',
        isActive: true
      }
    })
    
    console.log(`✅ Modelo actualizado a: ${workingModelId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Modelo actualizado exitosamente',
      oldModel: anthropicModel.modelIdentifier,
      newModel: workingModelId,
      model: {
        id: updatedModel.id,
        name: updatedModel.name,
        modelIdentifier: updatedModel.modelIdentifier,
        isActive: updatedModel.isActive
      }
    })
    
  } catch (error) {
    console.error('❌ Error actualizando modelo:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 