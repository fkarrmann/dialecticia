import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'

const updateInvitationCodeSchema = z.object({
  isActive: z.boolean(),
})

export async function PATCH(
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
    const validatedData = updateInvitationCodeSchema.parse(body)

    // Verificar que el código existe
    const existingCode = await prisma.invitationCode.findUnique({
      where: { id: id }
    })

    if (!existingCode) {
      return NextResponse.json({
        success: false,
        error: 'Código de invitación no encontrado',
      }, { status: 404 })
    }

    // Actualizar el código
    const updatedCode = await prisma.invitationCode.update({
      where: { id: id },
      data: {
        isActive: validatedData.isActive,
      },
      include: {
        sessions: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedCode,
    })

  } catch (error) {
    console.error('Error updating invitation code:', error)
    
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