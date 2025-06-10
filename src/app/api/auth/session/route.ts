import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      user: session.user,
      invitationCode: session.invitationCode,
      expiresAt: session.expiresAt
    })

  } catch (error) {
    console.error('Session verification error:', error)
    return NextResponse.json(
      { authenticated: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 