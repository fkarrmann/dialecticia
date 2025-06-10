'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, User, Key, Mail } from 'lucide-react'

interface LoginFormProps {
  onSuccess?: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    invitationCode: '',
    email: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const sessionCheck = await fetch('/api/auth/session', {
          credentials: 'include'
        })
        
        if (sessionCheck.ok) {
          const sessionData = await sessionCheck.json()
          if (sessionData.authenticated) {
            console.log('✅ Login exitoso y sesión verificada')
            if (onSuccess) {
              onSuccess()
            } else {
              window.location.href = '/'
            }
          } else {
            setError('Error: La sesión no se estableció correctamente')
          }
        } else {
          setError('Error: No se pudo verificar la sesión')
        }
      } else {
        setError(data.error || 'Error al iniciar sesión')
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Dialecticia
          </h1>
          <p className="text-slate-300">
            Debates filosóficos con IA
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <LogIn className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-white">
              Acceso con Invitación
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Ingresa tu nombre y código de invitación
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Nombre completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                  placeholder="Tu nombre completo"
                />
              </div>
            </div>

            {/* Email Field (Optional) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email <span className="text-slate-500">(opcional)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {/* Invitation Code Field */}
            <div>
              <label htmlFor="invitationCode" className="block text-sm font-medium text-slate-300 mb-2">
                Código de invitación
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  id="invitationCode"
                  name="invitationCode"
                  value={formData.invitationCode}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none uppercase"
                  placeholder="CODIGO-INVITACION"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Solicita tu código al administrador
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !formData.name || !formData.invitationCode}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validando...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Acceder</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              ¿No tienes código? Contacta al administrador para obtener acceso.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 