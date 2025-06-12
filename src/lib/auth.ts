import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { generateSessionToken, SESSION_COOKIE_NAME, SESSION_DURATION } from './auth-utils'

// Tipos
export interface AuthUser {
  id: string
  name: string | null
  email: string | null
  isAdmin: boolean
}

export interface AuthSession {
  id: string
  user: AuthUser
  invitationCode: {
    id: string
    code: string
    description: string | null
  }
  expiresAt: Date
}

// Validar código de invitación
export async function validateInvitationCode(code: string): Promise<{
  isValid: boolean
  invitationCode?: any
  error?: string
}> {
  try {
    const invitationCode = await prisma.invitationCode.findUnique({
      where: { code: code.trim().toUpperCase() }
    })

    if (!invitationCode) {
      return { isValid: false, error: 'Código de invitación no válido' }
    }

    if (!invitationCode.isActive) {
      return { isValid: false, error: 'Código de invitación desactivado' }
    }

    if (invitationCode.expiresAt && invitationCode.expiresAt < new Date()) {
      return { isValid: false, error: 'Código de invitación expirado' }
    }

    if (invitationCode.currentUses >= invitationCode.maxUses) {
      return { isValid: false, error: 'Código de invitación ya utilizado' }
    }

    return { isValid: true, invitationCode }
  } catch (error) {
    console.error('Error validating invitation code:', error)
    return { isValid: false, error: 'Error interno del servidor' }
  }
}

// Crear sesión de usuario
export async function createUserSession(
  name: string,
  invitationCodeId: string,
  email?: string
): Promise<{ success: boolean; session?: AuthSession; token?: string; error?: string }> {
  try {
    // Crear o encontrar usuario
    let user = email ? await prisma.user.findUnique({ where: { email } }) : null
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email: email || null
        }
      })
    }

    // Incrementar uso del código de invitación
    await prisma.invitationCode.update({
      where: { id: invitationCodeId },
      data: { currentUses: { increment: 1 } }
    })

    // Crear sesión
    const token = generateSessionToken()
    const expiresAt = new Date(Date.now() + SESSION_DURATION)

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        invitationCodeId,
        token,
        expiresAt
      },
      include: {
        user: true,
        invitationCode: true
      }
    })

    const authSession: AuthSession = {
      id: session.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      },
      invitationCode: {
        id: session.invitationCode.id,
        code: session.invitationCode.code,
        description: session.invitationCode.description
      },
      expiresAt: session.expiresAt
    }

    return { success: true, session: authSession, token }
  } catch (error) {
    console.error('Error creating user session:', error)
    return { success: false, error: 'Error al crear la sesión' }
  }
}

// Validar sesión por token
export async function validateSession(token: string): Promise<AuthSession | null> {
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: true,
        invitationCode: true
      }
    })

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return null
    }

    // Actualizar último acceso
    await prisma.session.update({
      where: { id: session.id },
      data: { lastAccessAt: new Date() }
    })

    return {
      id: session.id,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        isAdmin: session.user.isAdmin
      },
      invitationCode: {
        id: session.invitationCode.id,
        code: session.invitationCode.code,
        description: session.invitationCode.description
      },
      expiresAt: session.expiresAt
    }
  } catch (error) {
    console.error('Error validating session:', error)
    return null
  }
}

// Obtener sesión actual desde cookies
export async function getCurrentSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    return await validateSession(token)
  } catch (error) {
    console.error('Error getting current session:', error)
    return null
  }
}

// Cerrar sesión
export async function destroySession(token: string): Promise<boolean> {
  try {
    await prisma.session.update({
      where: { token },
      data: { isActive: false }
    })
    return true
  } catch (error) {
    console.error('Error destroying session:', error)
    return false
  }
}

// Limpiar sesiones expiradas
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.session.updateMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isActive: false }
        ]
      },
      data: { isActive: false }
    })
    return result.count
  } catch (error) {
    console.error('Error cleaning up sessions:', error)
    return 0
  }
}

// Configurar cookie de sesión
export function setSessionCookie(token: string): {
  name: string
  value: string
  options: {
    httpOnly: boolean
    secure: boolean
    sameSite: 'strict'
    maxAge: number
    path: string
  }
} {
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_DURATION / 1000, // En segundos
      path: '/'
    }
  }
}

// Limpiar cookie de sesión
export function clearSessionCookie(): {
  name: string
  value: string
  options: {
    httpOnly: boolean
    secure: boolean
    sameSite: 'strict'
    maxAge: number
    path: string
  }
} {
  return {
    name: SESSION_COOKIE_NAME,
    value: '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    }
  }
}

export const getUserId = async (): Promise<string | null> => {
  try {
    const session = await getCurrentSession()
    return session?.user?.id || null
  } catch (error) {
    console.error('Error getting user ID:', error)
    return null
  }
} 