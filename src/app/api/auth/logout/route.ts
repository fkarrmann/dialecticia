import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { destroySession, clearSessionCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('dialecticia-session')?.value

    if (token) {
      await destroySession(token)
    }

    const response = NextResponse.json({ success: true })
    
    // Limpiar cookie de sesión
    const cookieConfig = clearSessionCookie()
    response.cookies.set(
      cookieConfig.name,
      cookieConfig.value,
      cookieConfig.options
    )

    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 