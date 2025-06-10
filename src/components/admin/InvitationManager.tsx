'use client'

import { useState } from 'react'
import { Plus, Key, Users, Calendar, Check, X, Eye, EyeOff } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface User {
  id: string
  name: string | null
  email: string | null
}

interface Session {
  id: string
  userId: string
  createdAt: Date
  user: User
}

interface InvitationCode {
  id: string
  code: string
  description: string | null
  isActive: boolean
  maxUses: number
  currentUses: number
  createdAt: Date
  expiresAt: Date | null
  sessions: Session[]
}

interface InvitationManagerProps {
  initialCodes: InvitationCode[]
  currentUser: User
}

export default function InvitationManager({ initialCodes, currentUser }: InvitationManagerProps) {
  const [codes, setCodes] = useState<InvitationCode[]>(initialCodes)
  const [isCreating, setIsCreating] = useState(false)
  const [newCode, setNewCode] = useState({
    code: '',
    description: '',
    maxUses: 1,
    expiresAt: ''
  })

  const createInvitationCode = async () => {
    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: newCode.code,
          description: newCode.description || undefined,
          maxUses: newCode.maxUses,
          expiresAt: newCode.expiresAt || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Agregar el nuevo código a la lista
        setCodes(prev => [data.data, ...prev])
        
        // Resetear el formulario
        setNewCode({
          code: '',
          description: '',
          maxUses: 1,
          expiresAt: '',
        })
        setIsCreating(false)
        
        alert('Código de invitación creado exitosamente')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error creating invitation code:', error)
      alert('Error al crear el código de invitación')
    }
  }

  const toggleCodeStatus = async (codeId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/invitations/${codeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      const data = await response.json()

      if (data.success) {
        // Actualizar el código en la lista
        setCodes(prev => prev.map(code => 
          code.id === codeId ? data.data : code
        ))
        
        alert(`Código ${isActive ? 'activado' : 'desactivado'} exitosamente`)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error toggling code status:', error)
      alert('Error al cambiar el estado del código')
    }
  }

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 12; i++) {
      if (i === 4 || i === 8) result += '-'
      else result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewCode(prev => ({ ...prev, code: result }))
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Códigos</p>
              <p className="text-2xl font-bold text-white">{codes.length}</p>
            </div>
            <Key className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Códigos Activos</p>
              <p className="text-2xl font-bold text-green-400">
                {codes.filter(c => c.isActive).length}
              </p>
            </div>
            <Check className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Usuarios Registrados</p>
              <p className="text-2xl font-bold text-blue-400">
                {codes.reduce((total, code) => total + code.sessions.length, 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Usos Totales</p>
              <p className="text-2xl font-bold text-yellow-400">
                {codes.reduce((total, code) => total + code.currentUses, 0)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Crear nuevo código */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Crear Código de Invitación</h2>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Código</span>
          </button>
        </div>

        {isCreating && (
          <div className="border-t border-slate-700 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Código
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCode.code}
                    onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                    placeholder="CODIGO-INVITACION"
                  />
                  <button
                    onClick={generateRandomCode}
                    className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded"
                  >
                    Generar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descripción
                </label>
                <input
                  type="text"
                  value={newCode.description}
                  onChange={(e) => setNewCode(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  placeholder="Descripción del código"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Usos Máximos
                </label>
                <input
                  type="number"
                  value={newCode.maxUses}
                  onChange={(e) => setNewCode(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Fecha de Expiración (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={newCode.expiresAt}
                  onChange={(e) => setNewCode(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={createInvitationCode}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
              >
                Crear Código
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de códigos */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Códigos de Invitación</h2>
        </div>

        <div className="divide-y divide-slate-700">
          {codes.map((code) => (
            <div key={code.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <code className="px-3 py-1 bg-slate-700 rounded font-mono text-sm">
                    {code.code}
                  </code>
                  <div className="flex items-center space-x-2">
                    {code.isActive ? (
                      <span className="flex items-center text-green-400 text-sm">
                        <Check className="w-4 h-4 mr-1" />
                        Activo
                      </span>
                    ) : (
                      <span className="flex items-center text-red-400 text-sm">
                        <X className="w-4 h-4 mr-1" />
                        Inactivo
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => toggleCodeStatus(code.id, !code.isActive)}
                  className={`px-3 py-1 rounded text-sm ${
                    code.isActive 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {code.isActive ? 'Desactivar' : 'Activar'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Descripción</p>
                  <p className="text-white">{code.description || 'Sin descripción'}</p>
                </div>

                <div>
                  <p className="text-slate-400">Usos</p>
                  <p className="text-white">{code.currentUses} / {code.maxUses}</p>
                </div>

                <div>
                  <p className="text-slate-400">Creado</p>
                  <p className="text-white">{formatDate(code.createdAt)}</p>
                </div>
              </div>

              {code.sessions.length > 0 && (
                <div className="mt-4">
                  <p className="text-slate-400 text-sm mb-2">Usuarios registrados:</p>
                  <div className="space-y-1">
                    {code.sessions.map((session) => (
                      <div key={session.id} className="text-sm text-slate-300">
                        {session.user.name} {session.user.email && `(${session.user.email})`}
                        <span className="text-slate-500 ml-2">
                          - {formatDate(session.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 