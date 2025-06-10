import { NextRequest, NextResponse } from 'next/server'
import { analyzePhilosopherPersonality } from '@/lib/personality-analyzer'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { philosopherId } = await request.json()

    if (!philosopherId) {
      return NextResponse.json({ error: 'philosopherId es requerido' }, { status: 400 })
    }

    // Obtener el filósofo
    const philosopher = await prisma.philosopher.findUnique({
      where: { id: philosopherId }
    })

    if (!philosopher) {
      return NextResponse.json({ error: 'Filósofo no encontrado' }, { status: 404 })
    }

    console.log(`🎭 Generando aspectos de personalidad para ${philosopher.name}...`)

    // Analizar personalidad usando el sistema LLM
    const analysis = await analyzePhilosopherPersonality(
      philosopher.name,
      philosopher.description,
      philosopher.philosophicalSchool,
      philosopher.coreBeliefs,
      philosopher.argumentStyle
    )

    console.log(`✅ Análisis completado:`, analysis)

    // Limpiar aspectos existentes
    await prisma.philosopherPersonalityAspect.deleteMany({
      where: { philosopherId: philosopher.id }
    })

    // Guardar nuevos aspectos
    const savedAspects = []
    for (const aspect of analysis.aspects) {
      const savedAspect = await prisma.philosopherPersonalityAspect.create({
        data: {
          philosopherId: philosopher.id,
          aspectName: aspect.aspectName,
          value: aspect.value,
          generatedBy: 'AI_LLM'
        }
      })
      savedAspects.push(savedAspect)
    }

    return NextResponse.json({
      success: true,
      philosopher: philosopher.name,
      analysis,
      savedAspects,
      message: `Aspectos de personalidad generados exitosamente para ${philosopher.name}`
    })

  } catch (error) {
    console.error('❌ Error generating personality aspects:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 