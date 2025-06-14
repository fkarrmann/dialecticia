import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Buscar el modelo de Anthropic activo
    const anthropicModel = await prisma.lLMModel.findFirst({
      where: { 
        providerId: {
          in: await prisma.lLMProvider.findMany({
            where: { name: 'anthropic' },
            select: { id: true }
          }).then(providers => providers.map(p => p.id))
        }
      }
    })
    
    if (!anthropicModel) {
      return NextResponse.json({ error: 'No Anthropic model found' })
    }
    
    // Actualizar el modelIdentifier a un modelo válido de Claude
    const updatedModel = await prisma.lLMModel.update({
      where: { id: anthropicModel.id },
      data: {
        modelIdentifier: 'claude-3-5-sonnet-20241022' // Modelo válido de Claude 3.5 Sonnet v2
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Model identifier updated successfully',
      model: {
        id: updatedModel.id,
        name: updatedModel.name,
        oldIdentifier: anthropicModel.modelIdentifier,
        newIdentifier: updatedModel.modelIdentifier
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
} 