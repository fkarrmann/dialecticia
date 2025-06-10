import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { generatePhilosopherResponse } from '@/lib/llm'
import { getCurrentSession } from '@/lib/auth'

const createMessageSchema = z.object({
  content: z.string().min(1, 'El mensaje no puede estar vacío'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Verificar autenticación
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado',
      }, { status: 401 })
    }

    // Verificar que el debate existe y pertenece al usuario
    const debate = await prisma.debate.findFirst({
      where: {
        id: id,
        userId: session.user.id
      },
      include: {
        messages: {
          include: {
            philosopher: true,
          },
          orderBy: { timestamp: 'asc' },
        },
        participants: {
          include: {
            philosopher: {
              include: {
                personalityAspects: true
              }
            }
          },
        },
      },
    })

    if (!debate) {
      return NextResponse.json({
        success: false,
        error: 'Debate no encontrado',
      }, { status: 404 })
    }

    // Obtener el filósofo del debate (solo debería haber uno)
    const philosopher = debate.participants[0]?.philosopher
    
    if (!philosopher) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró filósofo en el debate',
      }, { status: 500 })
    }

    // Obtener el último número de turno
    const lastTurn = debate.messages.length > 0 
      ? Math.max(...debate.messages.map(m => m.turnNumber))
      : 0

    const body = await request.json()
    const validatedData = createMessageSchema.parse(body)

    // Crear el mensaje del usuario
    await prisma.message.create({
      data: {
        content: validatedData.content,
        senderType: 'USER',
        debateId: id,
        turnNumber: lastTurn + 1,
        userId: session.user.id,
      },
    })

    // Preparar historial de conversación
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

    // Generar respuesta del filósofo
    console.log(`🤖 ${philosopher.name}: responde al usuario`)
    const philosopherResponse = await generatePhilosopherResponse(
      philosopher,
      debate.topic,
      conversationHistory,
      validatedData.content,
      'SOCRATIC_TO_USER'
    )

    await prisma.message.create({
      data: {
        content: philosopherResponse.content,
        senderType: 'PHILOSOPHER',
        debateId: id,
        philosopherId: philosopher.id,
        turnNumber: lastTurn + 2,
        userId: session.user.id,
      },
    })

    // Obtener debate actualizado
    const updatedDebate = await prisma.debate.findUnique({
      where: { id: id },
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
            philosopher: {
              include: {
                personalityAspects: true
              }
            }
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedDebate,
    })

  } catch (error) {
    console.error('Error creating message:', error)
    
    // Detectar errores de debugging de prompts
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    if (errorMessage.includes('PROMPT_DEBUGGING_ERROR:')) {
      console.error('🔥 DEBUGGING ERROR CAUGHT IN API ROUTE:', errorMessage)
      
      // Extraer solo la parte útil del mensaje
      const cleanMessage = errorMessage.replace('PROMPT_DEBUGGING_ERROR: ', '')
      
      return NextResponse.json({
        success: false,
        error: 'Error de debugging: Prompt desactivado',
        message: cleanMessage,
        type: 'PROMPT_DEBUGGING_ERROR',
        details: 'Este error es esperado durante debugging. Activa el prompt desde el panel de administración.'
      }, { status: 422 })
    }
    
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Verificar autenticación
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado',
      }, { status: 401 })
    }

    // Obtener mensajes del debate solo si pertenece al usuario
    const messages = await prisma.message.findMany({
      where: {
        debateId: id,
        debate: {
          userId: session.user.id
        }
      },
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