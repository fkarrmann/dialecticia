'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store' // Evitar cache para tener datos frescos
        })

        if (response.ok) {
          const data = await response.json()
          console.log('🔍 AuthGuard - Respuesta de sesión:', data)
          setIsAuthenticated(data.authenticated)
        } else {
          console.log('🔍 AuthGuard - Respuesta no OK:', response.status)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated === false) {
      // Forzar redirección a login si no está autenticado
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  // Mostrar loading mientras verifica
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // No mostrar contenido si no está autenticado
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">Redirigiendo al login...</p>
        </div>
      </div>
    )
  }

  // Mostrar contenido solo si está autenticado
  return isAuthenticated ? <>{children}</> : null
} 