import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context
  try {
    const debate = await prisma.debate.findUnique({
      where: { id: params.id },
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
        error: 'Debate no encontrado',
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