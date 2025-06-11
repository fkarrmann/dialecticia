import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const TEMP_KEY = 'TEMP-ADMIN-GEN-2024'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.key !== TEMP_KEY) {
      return NextResponse.json(
        { error: 'Invalid temp key' },
        { status: 401 }
      )
    }

    // Generar nuevo código de invitación admin
    const newCode = `TEMP-ADMIN-${Date.now()}`
    
    await prisma.invitationCode.create({
      data: {
        code: newCode,
        description: 'Código temporal para acceso admin',
        maxUses: 3,
        currentUses: 0,
        isActive: true
      }
    })

    return NextResponse.json({
      message: 'Código temporal generado',
      code: newCode,
      instructions: 'Usa este código en /login para acceder como admin'
    })

  } catch (error) {
    console.error('Error generating temp access:', error)
    return NextResponse.json(
      { error: 'Failed to generate temp access' },
      { status: 500 }
    )
  }
} 