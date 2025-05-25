import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const createDebateSchema = z.object({
  topic: z.string().min(3, 'El tema debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  selectedPhilosopherId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createDebateSchema.parse(body)

    // Crear el debate
    const debate = await prisma.debate.create({
      data: {
        topic: validatedData.topic,
        description: validatedData.description,
        status: 'TOPIC_CLARIFICATION',
      },
    })

    // Seleccionar filósofos para el debate
    const philosophers = await selectPhilosophersForDebate(validatedData.selectedPhilosopherId)
    
    // Crear participantes
    await prisma.debateParticipant.createMany({
      data: philosophers.map((phil, index) => ({
        debateId: debate.id,
        philosopherId: phil.id,
        role: index === 0 ? 'CHALLENGER_A' : 'CHALLENGER_B',
      })),
    })

    // Incrementar contador de uso de filósofos
    await prisma.philosopher.updateMany({
      where: {
        id: { in: philosophers.map(p => p.id) }
      },
      data: {
        usageCount: { increment: 1 }
      }
    })

    // Crear mensaje inicial del sistema
    await prisma.message.create({
      data: {
        content: `¡Bienvenido al debate sobre "${validatedData.topic}"! 

Los filósofos ${philosophers[0].name} y ${philosophers[1].name} están listos para desafiar tus ideas.

**Ronda de Clarificación**: Primero, explica tu posición sobre el tema para que podamos entender exactamente qué defiendes.`,
        senderType: 'SYSTEM',
        debateId: debate.id,
        turnNumber: 0,
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
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const debates = await prisma.debate.findMany({
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

async function selectPhilosophersForDebate(selectedPhilosopherId?: string) {
  // Obtener todos los filósofos activos
  const allPhilosophers = await prisma.philosopher.findMany({
    where: { isActive: true },
  })

  if (allPhilosophers.length < 2) {
    throw new Error('No hay suficientes filósofos disponibles')
  }

  let selectedPhilosophers: typeof allPhilosophers = []

  // Si el usuario seleccionó un filósofo específico
  if (selectedPhilosopherId) {
    const selectedPhil = allPhilosophers.find(p => p.id === selectedPhilosopherId)
    if (selectedPhil) {
      selectedPhilosophers.push(selectedPhil)
      
      // Seleccionar un segundo filósofo diferente aleatoriamente
      const remainingPhils = allPhilosophers.filter(p => p.id !== selectedPhilosopherId)
      const randomSecond = remainingPhils[Math.floor(Math.random() * remainingPhils.length)]
      selectedPhilosophers.push(randomSecond)
    }
  }

  // Si no hay selección o la selección falló, elegir 2 aleatoriamente
  if (selectedPhilosophers.length === 0) {
    const shuffled = [...allPhilosophers].sort(() => Math.random() - 0.5)
    selectedPhilosophers = shuffled.slice(0, 2)
  }

  return selectedPhilosophers
} 