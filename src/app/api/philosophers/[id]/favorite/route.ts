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

    const philosopherId = params.id

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

    // Verificar si ya existe como favorito
    const existingFavorite = await prisma.philosopherFavorite.findUnique({
      where: {
        userId_philosopherId: {
          userId: session.user.id,
          philosopherId: philosopherId
        }
      }
    })

    if (existingFavorite) {
      // Si ya es favorito, lo removemos
      await prisma.philosopherFavorite.delete({
        where: { id: existingFavorite.id }
      })

      return NextResponse.json({
        success: true,
        message: 'Filósofo removido de favoritos',
        isFavorite: false
      })
    } else {
      // Si no es favorito, lo agregamos
      await prisma.philosopherFavorite.create({
        data: {
          userId: session.user.id,
          philosopherId: philosopherId
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Filósofo agregado a favoritos',
        isFavorite: true
      })
    }

  } catch (error) {
    console.error('Error toggling favorite:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
} 