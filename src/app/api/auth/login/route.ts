import { NextRequest, NextResponse } from 'next/server'
import { validateInvitationCode, createUserSession, setSessionCookie } from '@/lib/auth'
import { ensureDatabaseSetup } from '@/lib/database-setup'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting login process...')
    
    // Ensure database is set up before proceeding
    console.log('🔧 Ensuring database setup...')
    await ensureDatabaseSetup()
    console.log('✅ Database setup completed')
    
    const { name, invitationCode, email } = await request.json()
    console.log('📝 Received login request for:', { name, invitationCode: invitationCode?.substring(0, 5) + '...' })

    // Validar datos requeridos
    if (!name || !invitationCode) {
      return NextResponse.json(
        { error: 'Nombre y código de invitación son requeridos' },
        { status: 400 }
      )
    }

    console.log('🔍 Validating invitation code...')
    // Validar código de invitación
    const codeValidation = await validateInvitationCode(invitationCode)
    if (!codeValidation.isValid) {
      console.log('❌ Invalid invitation code:', codeValidation.error)
      return NextResponse.json(
        { error: codeValidation.error },
        { status: 400 }
      )
    }
    
    console.log('✅ Valid invitation code, creating user session...')

    // Crear sesión de usuario
    const sessionResult = await createUserSession(
      name.trim(),
      codeValidation.invitationCode!.id,
      email?.trim() || undefined
    )

    if (!sessionResult.success) {
      console.log('❌ Failed to create user session:', sessionResult.error)
      return NextResponse.json(
        { error: sessionResult.error },
        { status: 500 }
      )
    }

    console.log('✅ User session created successfully')

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

    console.log('🎉 Login completed successfully')
    return response

  } catch (error) {
    console.error('💥 Error in login process:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 