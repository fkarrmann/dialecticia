import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing broken model identifier...')

    // Find the problematic model
    const brokenModel = await prisma.lLMModel.findFirst({
      where: {
        modelIdentifier: 'claude-3-5-sonnet-20241022'
      },
      include: {
        provider: true,
        configurations: true
      }
    })

    if (!brokenModel) {
      console.log('No broken model found, checking all models...')
      
      const allModels = await prisma.lLMModel.findMany({
        include: {
          provider: true
        }
      })
      
      return NextResponse.json({
        success: false,
        message: 'No broken model found',
        allModels: allModels.map(m => ({
          id: m.id,
          name: m.name,
          modelIdentifier: m.modelIdentifier,
          provider: m.provider.name,
          isActive: m.isActive
        }))
      })
    }

    console.log('Found broken model:', brokenModel.name, brokenModel.modelIdentifier)

    // Update to a working model identifier
    const fixedModel = await prisma.lLMModel.update({
      where: { id: brokenModel.id },
      data: {
        modelIdentifier: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku'
      },
      include: {
        provider: true,
        configurations: true
      }
    })

    console.log('✅ Model fixed:', fixedModel.name, fixedModel.modelIdentifier)

    return NextResponse.json({
      success: true,
      message: 'Model identifier fixed successfully',
      before: {
        name: brokenModel.name,
        modelIdentifier: brokenModel.modelIdentifier
      },
      after: {
        name: fixedModel.name,
        modelIdentifier: fixedModel.modelIdentifier
      },
      configurationsAffected: fixedModel.configurations.length
    })

  } catch (error) {
    console.error('Error fixing model:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fix model',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 