import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado',
      }, { status: 401 })
    }

    const { id: philosopherId } = await params

    // Verificar que el filósofo existe
    const philosopher = await prisma.philosopher.findUnique({
      where: { id: philosopherId, isActive: true }
    })

    if (!philosopher) {
      return NextResponse.json({
        success: false,
        error: 'Filósofo no encontrado',
      }, { status: 404 })
    }

    // Incrementar el contador de uso del filósofo
    await prisma.philosopher.update({
      where: { id: philosopherId },
      data: { usageCount: { increment: 1 } }
    })

    // Verificar si ya existe como favorito
    const existingFavorite = await prisma.philosopherFavorite.findUnique({
      where: {
        userId_philosopherId: {
          userId: session.user.id,
          philosopherId: philosopherId
        }
      }
    })

    // Si no es favorito, agregarlo automáticamente
    if (!existingFavorite) {
      await prisma.philosopherFavorite.create({
        data: {
          userId: session.user.id,
          philosopherId: philosopherId
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Filósofo activado exitosamente',
      data: {
        philosopherId,
        name: philosopher.name,
        usageCount: philosopher.usageCount + 1
      }
    })

  } catch (error) {
    console.error('Error activating philosopher:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
} 