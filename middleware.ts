import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME } from './src/lib/auth-utils'

// Solo estas rutas están permitidas SIN autenticación
const publicPaths = [
  '/login',
  '/api/auth/login',
  '/api/auth/session',
  '/_next',
  '/favicon.ico'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas públicas específicas
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Obtener token de sesión
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

  // Si no hay token, SIEMPRE redirigir a login
  if (!token) {
    console.log(`🔒 Acceso denegado a ${pathname} - Sin token`)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si hay token (formato básico válido), permitir acceso
  // La validación detallada se hace en AuthGuard en el cliente
  if (token && token.length > 16) { // Tokens válidos deberían ser largos
    console.log(`✅ Acceso permitido a ${pathname} - Token presente`)
    return NextResponse.next()
  } else {
    // Token demasiado corto o inválido
    console.log(`🔒 Acceso denegado a ${pathname} - Token inválido`)
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: 0 })
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Coincidir con TODAS las rutas EXCEPTO:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - archivos públicos
     * Esto asegura que TODO requiera autenticación
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 