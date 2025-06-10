import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { getCurrentSession } from '@/lib/auth'

const updateDebateSchema = z.object({
  topic: z.string().min(1, 'El tema es requerido').max(500, 'El tema es muy largo'),
  description: z.string().nullable().optional(),
})

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

    const debate = await prisma.debate.findUnique({
      where: { 
        id: id,
        userId: session.user.id  // Solo mostrar debates del usuario actual
      },
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

    if (!debate) {
      return NextResponse.json({
        success: false,
        error: 'Debate no encontrado o no tienes permisos para verlo',
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: debate,
    })

  } catch (error) {
    console.error('Error fetching debate:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
}

export async function PUT(
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

    const body = await request.json()
    const validatedData = updateDebateSchema.parse(body)

    // Verificar que el debate existe y pertenece al usuario
    const existingDebate = await prisma.debate.findUnique({
      where: { 
        id: id,
        userId: session.user.id  // Solo permitir editar debates propios
      },
    })

    if (!existingDebate) {
      return NextResponse.json({
        success: false,
        error: 'Debate no encontrado o no tienes permisos para editarlo',
      }, { status: 404 })
    }

    // Actualizar el debate
    const updatedDebate = await prisma.debate.update({
      where: { id: id },
      data: {
        topic: validatedData.topic,
        description: validatedData.description || undefined,  // Convert null to undefined for Prisma
        updatedAt: new Date(),
      },
      include: {
        participants: {
          include: {
            philosopher: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      debate: updatedDebate,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: error.errors[0].message,
      }, { status: 400 })
    }

    console.error('Error updating debate:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
}

export async function DELETE(
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
    const existingDebate = await prisma.debate.findUnique({
      where: { 
        id: id,
        userId: session.user.id  // Solo permitir eliminar debates propios
      },
    })

    if (!existingDebate) {
      return NextResponse.json({
        success: false,
        error: 'Debate no encontrado o no tienes permisos para eliminarlo',
      }, { status: 404 })
    }

    // Eliminar en cascada: votos, mensajes, participantes, y finalmente el debate
    await prisma.$transaction([
      // Eliminar votos de mensajes del debate
      prisma.vote.deleteMany({
        where: {
          message: {
            debateId: id
          }
        }
      }),
      // Eliminar mensajes del debate
      prisma.message.deleteMany({
        where: { debateId: id }
      }),
      // Eliminar participantes del debate
      prisma.debateParticipant.deleteMany({
        where: { debateId: id }
      }),
      // Eliminar el debate
      prisma.debate.delete({
        where: { id: id }
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Debate eliminado correctamente',
    })

  } catch (error) {
    console.error('Error deleting debate:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
} 