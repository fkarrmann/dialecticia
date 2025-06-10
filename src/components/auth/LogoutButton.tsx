'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  className?: string
  variant?: 'button' | 'link'
}

export default function LogoutButton({ className = '', variant = 'button' }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        // Redirigir inmediatamente al login
        router.replace('/login')
        router.refresh()
      } else {
        console.error('Error al cerrar sesión')
      }
    } catch (error) {
      console.error('Error de conexión al cerrar sesión:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (variant === 'link') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className={`flex items-center space-x-1 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50 ${className}`}
      >
        <LogOut className="w-4 h-4" />
        <span>{isLoading ? 'Cerrando...' : 'Cerrar sesión'}</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition-colors ${className}`}
    >
      <LogOut className="w-4 h-4" />
      <span>{isLoading ? 'Cerrando...' : 'Cerrar sesión'}</span>
    </button>
  )
} 