'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, X } from 'lucide-react'
import type { Debate, DebateParticipant, Philosopher } from '@prisma/client'

type DebateWithParticipants = Debate & {
  participants: (DebateParticipant & {
    philosopher: Philosopher
  })[]
}

interface EditDebateFormProps {
  debate: DebateWithParticipants
}

export default function EditDebateForm({ debate }: EditDebateFormProps) {
  const [topic, setTopic] = useState(debate.topic)
  const [description, setDescription] = useState(debate.description || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/debates/${debate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          description: description.trim() || null,
        }),
      })

      if (response.ok) {
        router.push(`/debate/${debate.id}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Error al actualizar el debate')
      }
    } catch (error) {
      console.error('Error updating debate:', error)
      setError('Error al conectar con el servidor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 border border-slate-700">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic */}
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-slate-300 mb-2">
            Tema del Debate *
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
            placeholder="¿Cuál es el sentido de la vida?"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
            Descripción (opcional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none resize-none"
            placeholder="Contexto adicional sobre el debate..."
          />
        </div>

        {/* Participants Info */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Filósofos Participantes
          </label>
          <div className="flex space-x-2">
            {debate.participants.map((participant) => (
              <span 
                key={participant.id}
                className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm"
              >
                {participant.philosopher.name}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Los filósofos no se pueden cambiar después de crear el debate
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className="flex-1 flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:opacity-50 text-white py-3 px-6 rounded-lg transition-colors"
          >
            <Save className="w-5 h-5 mr-2" />
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          
          <Link
            href={`/debate/${debate.id}`}
            className="flex items-center justify-center bg-slate-600 hover:bg-slate-700 text-white py-3 px-6 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 mr-2" />
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
} 