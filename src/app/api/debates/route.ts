import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { generatePhilosopherResponse } from '@/lib/llm'
import { getCurrentSession } from '@/lib/auth'

const createDebateSchema = z.object({
  topic: z.string().min(3, 'El tema debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  selectedPhilosopherId: z.string().min(1, 'Debe seleccionar un filósofo'),
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
    const validatedData = createDebateSchema.parse(body)

    // Verificar que el filósofo seleccionado existe y está activo
    const selectedPhilosopher = await prisma.philosopher.findFirst({
      where: {
        id: validatedData.selectedPhilosopherId,
        isActive: true
      },
      include: {
        personalityAspects: true
      }
    })

    if (!selectedPhilosopher) {
      return NextResponse.json({
        success: false,
        error: 'El filósofo seleccionado no está disponible',
      }, { status: 400 })
    }

    // Crear el debate asociado al usuario actual
    const debate = await prisma.debate.create({
      data: {
        topic: validatedData.topic,
        description: validatedData.description,
        status: 'ACTIVE_DEBATE',
        userId: session.user.id,
        isPublic: false,
      },
    })

    // Crear participante único
    await prisma.debateParticipant.create({
      data: {
        debateId: debate.id,
        philosopherId: selectedPhilosopher.id,
        role: 'CHALLENGER_A',
      }
    })

    // Incrementar contador de uso del filósofo
    await prisma.philosopher.update({
      where: { id: selectedPhilosopher.id },
      data: { usageCount: { increment: 1 } }
    })

    // Registrar como filósofo favorito del usuario (para futuras selecciones por defecto)
    await prisma.philosopherFavorite.upsert({
      where: {
        userId_philosopherId: {
          userId: session.user.id,
          philosopherId: selectedPhilosopher.id
        }
      },
      update: {
        createdAt: new Date() // Actualizar fecha para que sea el más reciente
      },
      create: {
        userId: session.user.id,
        philosopherId: selectedPhilosopher.id
      }
    })

    // Generar primera respuesta del filósofo
    console.log(`🤖 ${selectedPhilosopher.name} responde a la postura del usuario`)
    const philosopherResponse = await generatePhilosopherResponse(
      selectedPhilosopher,
      validatedData.topic,
      [{
        sender: 'Usuario',
        content: `Mi punto de vista sobre "${validatedData.topic}": ${validatedData.description}`,
        timestamp: new Date(),
      }],
      validatedData.description,
      'SOCRATIC_TO_USER' // El filósofo responde directamente al usuario
    )

    await prisma.message.create({
      data: {
        content: philosopherResponse.content,
        senderType: 'PHILOSOPHER',
        debateId: debate.id,
        philosopherId: selectedPhilosopher.id,
        turnNumber: 1,
        userId: session.user.id,
      },
    })

    // Obtener el debate completo para respuesta
    const debateWithDetails = await prisma.debate.findUnique({
      where: { id: debate.id },
      include: {
        messages: {
          include: {
            philosopher: true,
            votes: true,
          },
          orderBy: { timestamp: 'asc' },
        },
        participants: {
          include: {
            philosopher: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: debateWithDetails,
    })

  } catch (error) {
    console.error('Error creating debate:', error)
    
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

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado',
      }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Filtrar debates solo del usuario actual
    const debates = await prisma.debate.findMany({
      where: {
        userId: session.user.id
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        participants: {
          include: {
            philosopher: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: debates,
    })

  } catch (error) {
    console.error('Error fetching debates:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
} 