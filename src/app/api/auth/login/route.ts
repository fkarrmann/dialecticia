import { NextRequest, NextResponse } from 'next/server'
import { validateInvitationCode, createUserSession, setSessionCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { name, invitationCode, email } = await request.json()

    // Validar datos requeridos
    if (!name || !invitationCode) {
      return NextResponse.json(
        { error: 'Nombre y código de invitación son requeridos' },
        { status: 400 }
      )
    }

    // Validar código de invitación
    const codeValidation = await validateInvitationCode(invitationCode)
    if (!codeValidation.isValid) {
      return NextResponse.json(
        { error: codeValidation.error },
        { status: 400 }
      )
    }

    // Crear sesión de usuario
    const sessionResult = await createUserSession(
      name.trim(),
      codeValidation.invitationCode!.id,
      email?.trim() || undefined
    )

    if (!sessionResult.success) {
      return NextResponse.json(
        { error: sessionResult.error },
        { status: 500 }
      )
    }

    // Configurar cookie de sesión
    const cookieConfig = setSessionCookie(sessionResult.token!)
    
    const response = NextResponse.json({
      success: true,
      user: sessionResult.session!.user,
      invitationCode: sessionResult.session!.invitationCode
    })

    // Establecer cookie de sesión
    response.cookies.set(
      cookieConfig.name,
      sessionResult.token!, // Usar el token de sesión
      cookieConfig.options
    )

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 