import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'

const createInvitationCodeSchema = z.object({
  code: z.string().min(3, 'El código debe tener al menos 3 caracteres').max(50, 'El código es muy largo'),
  description: z.string().optional(),
  maxUses: z.number().min(1, 'Debe permitir al menos 1 uso').max(1000, 'Máximo 1000 usos'),
  expiresAt: z.string().optional(), // ISO date string
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
    const validatedData = createInvitationCodeSchema.parse(body)

    // Verificar que el código no existe
    const existingCode = await prisma.invitationCode.findUnique({
      where: { code: validatedData.code.toUpperCase() }
    })

    if (existingCode) {
      return NextResponse.json({
        success: false,
        error: 'Este código ya existe',
      }, { status: 400 })
    }

    // Crear el código de invitación
    const newCode = await prisma.invitationCode.create({
      data: {
        code: validatedData.code.toUpperCase(),
        description: validatedData.description || null,
        maxUses: validatedData.maxUses,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        createdBy: session.user.id,
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
      data: newCode,
    })

  } catch (error) {
    console.error('Error creating invitation code:', error)
    
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

    // Obtener todos los códigos de invitación
    const invitationCodes = await prisma.invitationCode.findMany({
      orderBy: { createdAt: 'desc' },
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
      data: invitationCodes,
    })

  } catch (error) {
    console.error('Error fetching invitation codes:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
} 