import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 FINAL UPDATE: Updating Claude Sonnet 4 to correct model identifier...')

    // 1. Buscar el modelo de Claude Sonnet 4
    const claude4Model = await prisma.lLMModel.findFirst({
      where: { 
        name: 'Claude Sonnet 4'
      },
      include: {
        provider: true,
        configurations: true
      }
    })
    
    if (!claude4Model) {
      return NextResponse.json({ 
        success: false,
        error: 'Claude Sonnet 4 model not found. Please add the model first.' 
      })
    }

    console.log('Found Claude 4 model:', {
      id: claude4Model.id,
      name: claude4Model.name,
      currentIdentifier: claude4Model.modelIdentifier
    })

    // 2. Actualizar el modelo con el identificador correcto
    const updatedModel = await prisma.lLMModel.update({
      where: { id: claude4Model.id },
      data: { 
        modelIdentifier: 'claude-sonnet-4-20250514', // Identificador oficial correcto
        displayName: 'Claude Sonnet 4 (May 2025)',
        name: 'Claude Sonnet 4'
      },
      include: {
        provider: true,
        configurations: true
      }
    })

    console.log('Updated model identifier to:', updatedModel.modelIdentifier)

    return NextResponse.json({
      success: true,
      message: 'Claude Sonnet 4 model identifier updated successfully',
      model: {
        id: updatedModel.id,
        name: updatedModel.name,
        modelIdentifier: updatedModel.modelIdentifier,
        displayName: updatedModel.displayName,
        previousIdentifier: claude4Model.modelIdentifier
      },
      instructions: 'Model identifier updated to official Anthropic format. Ready for testing.'
    })

  } catch (error) {
    console.error('Error updating Claude 4 model identifier:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update Claude 4 model identifier',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 