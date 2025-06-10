import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getCurrentSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { isFavorite } = await request.json()

    if (typeof isFavorite !== 'boolean') {
      return NextResponse.json(
        { error: 'isFavorite must be a boolean' },
        { status: 400 }
      )
    }

    // Check if philosopher exists
    const philosopher = await prisma.philosopher.findUnique({
      where: { id }
    })

    if (!philosopher) {
      return NextResponse.json(
        { error: 'Philosopher not found' },
        { status: 404 }
      )
    }

    // Verificar si ya existe como favorito
    const existingFavorite = await prisma.philosopherFavorite.findUnique({
      where: {
        userId_philosopherId: {
          userId: session.user.id,
          philosopherId: id
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
          philosopherId: id
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