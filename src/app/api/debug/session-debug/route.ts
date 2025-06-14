import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'
import { SESSION_COOKIE_NAME } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 SESSION DEBUG: Analizando sesión...')
    
    // Obtener todas las cookies
    const cookies = request.cookies
    const allCookies: Record<string, string> = {}
    cookies.getAll().forEach(cookie => {
      allCookies[cookie.name] = cookie.value
    })
    
    // Obtener cookie de sesión específica
    const sessionCookie = cookies.get(SESSION_COOKIE_NAME)
    
    // Intentar obtener sesión actual
    const session = await getCurrentSession()
    
    // Headers de la request
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      sessionCookieName: SESSION_COOKIE_NAME,
      sessionCookie: sessionCookie ? {
        name: sessionCookie.name,
        value: sessionCookie.value.substring(0, 20) + '...',
        hasValue: !!sessionCookie.value
      } : null,
      allCookies: Object.keys(allCookies).map(name => ({
        name,
        value: allCookies[name].substring(0, 20) + '...',
        hasValue: !!allCookies[name]
      })),
      session: session ? {
        authenticated: true,
        userId: session.user.id,
        userName: session.user.name,
        isAdmin: session.user.isAdmin,
        sessionId: session.id,
        expiresAt: session.expiresAt
      } : {
        authenticated: false
      },
      requestInfo: {
        method: request.method,
        url: request.url,
        userAgent: headers['user-agent'] || 'unknown',
        origin: headers['origin'] || 'unknown',
        referer: headers['referer'] || 'unknown'
      }
    }
    
    console.log('📊 Session Debug Info:', JSON.stringify(debugInfo, null, 2))
    
    return NextResponse.json({
      success: true,
      debug: debugInfo,
      recommendation: session ? 
        'Sesión válida - El problema puede estar en otro lado' :
        'No hay sesión válida - Problema de cookies o sesión expirada'
    })
    
  } catch (error) {
    console.error('❌ Error en session debug:', error)
    return NextResponse.json({
      success: false,
      error: 'Error en debug de sesión',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 