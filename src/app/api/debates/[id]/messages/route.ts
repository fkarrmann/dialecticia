import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { generatePhilosopherResponse } from '@/lib/llm'

const createMessageSchema = z.object({
  content: z.string().min(1, 'El mensaje no puede estar vacío'),
})

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context
  try {
    const body = await request.json()
    const validatedData = createMessageSchema.parse(body)
    const debateId = params.id

    // Verificar que el debate existe
    const debate = await prisma.debate.findUnique({
      where: { id: debateId },
      include: {
        participants: {
          include: {
            philosopher: true,
          },
        },
        messages: {
          include: {
            philosopher: true,
          },
          orderBy: { timestamp: 'asc' },
        },
      },
    })

    if (!debate) {
      return NextResponse.json({
        success: false,
        error: 'Debate no encontrado',
      }, { status: 404 })
    }

    // Obtener el último número de turno
    const lastTurn = debate.messages.length > 0 
      ? Math.max(...debate.messages.map(m => m.turnNumber))
      : 0

    // Crear el mensaje del usuario
    const userMessage = await prisma.message.create({
      data: {
        content: validatedData.content,
        senderType: 'USER',
        debateId: debateId,
        turnNumber: lastTurn + 1,
      },
    })

    // Generar respuestas de los filósofos
    const philosophers = debate.participants.map(p => p.philosopher)
    const conversationHistory = debate.messages.map(msg => ({
      sender: msg.senderType === 'USER' ? 'Usuario' : 
              msg.philosopher ? msg.philosopher.name : 'Sistema',
      content: msg.content,
      timestamp: msg.timestamp,
    }))

    // Agregar el mensaje del usuario al historial
    conversationHistory.push({
      sender: 'Usuario',
      content: validatedData.content,
      timestamp: new Date(),
    })

    const philosopherResponses = []

    // Generar respuesta del primer filósofo
    if (philosophers[0]) {
      const response1 = await generatePhilosopherResponse(
        philosophers[0],
        debate.topic,
        conversationHistory,
        validatedData.content
      )

      const philMessage1 = await prisma.message.create({
        data: {
          content: response1.content,
          senderType: 'PHILOSOPHER',
          debateId: debateId,
          philosopherId: philosophers[0].id,
          turnNumber: lastTurn + 2,
        },
      })

      philosopherResponses.push(philMessage1)
      
      // Agregar al historial para el segundo filósofo
      conversationHistory.push({
        sender: philosophers[0].name,
        content: response1.content,
        timestamp: new Date(),
      })
    }

    // Generar respuesta del segundo filósofo
    if (philosophers[1]) {
      const response2 = await generatePhilosopherResponse(
        philosophers[1],
        debate.topic,
        conversationHistory,
        validatedData.content
      )

      const philMessage2 = await prisma.message.create({
        data: {
          content: response2.content,
          senderType: 'PHILOSOPHER',
          debateId: debateId,
          philosopherId: philosophers[1].id,
          turnNumber: lastTurn + 3,
        },
      })

      philosopherResponses.push(philMessage2)
    }

    // Actualizar estado del debate si es necesario
    if (debate.status === 'TOPIC_CLARIFICATION' && debate.messages.length >= 2) {
      await prisma.debate.update({
        where: { id: debateId },
        data: { status: 'ACTIVE_DEBATE' },
      })
    }

    // Obtener todos los mensajes para la respuesta
    const allMessages = await prisma.message.findMany({
      where: { debateId },
      include: {
        philosopher: true,
        votes: true,
      },
      orderBy: { timestamp: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        userMessage,
        philosopherResponses,
        allMessages,
      },
    })

  } catch (error) {
    console.error('Error creating message:', error)
    
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

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context
  try {
    const messages = await prisma.message.findMany({
      where: { debateId: params.id },
      include: {
        philosopher: true,
        votes: true,
      },
      orderBy: { timestamp: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: messages,
    })

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
} 