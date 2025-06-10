import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'
import { selectAntagonisticPhilosopher } from '@/lib/llm'

const suggestPhilosopherSchema = z.object({
  topic: z.string().min(1, 'El tema es requerido'),
  userPosition: z.string().min(1, 'La postura del usuario es requerida'),
})

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado',
      }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = suggestPhilosopherSchema.parse(body)

    // Obtener filósofos activos
    const philosophers = await prisma.philosopher.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        philosophicalSchool: true,
        argumentStyle: true,
        questioningApproach: true,
      },
      orderBy: [
        { usageCount: 'desc' },
        { name: 'asc' }
      ]
    })

    if (philosophers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No hay filósofos disponibles',
      }, { status: 404 })
    }

    // Usar LLM para seleccionar el filósofo más antagónico
    console.log('🧠 Solicitando sugerencia de filósofo para:', {
      topic: validatedData.topic,
      userPosition: validatedData.userPosition.substring(0, 100) + '...'
    })

    const suggestion = await selectAntagonisticPhilosopher(
      validatedData.topic,
      validatedData.userPosition,
      philosophers
    )

    return NextResponse.json({
      success: true,
      data: {
        suggestedPhilosopherId: suggestion.suggestedPhilosopherId,
        reasoning: suggestion.reasoning,
        availablePhilosophers: philosophers
      }
    })

  } catch (error) {
    console.error('Error suggesting philosopher:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Datos inválidos',
        details: error.errors,
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
} 