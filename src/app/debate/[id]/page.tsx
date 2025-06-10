'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import DebateChat from '@/components/debate/DebateChat'
import type { Debate, Message, Philosopher } from '@prisma/client'

type MessageWithDetails = Message & {
  philosopher: Philosopher | null
}

type DebateWithDetails = Debate & {
  participants: Array<{
    philosopher: Philosopher
  }>
  messages: MessageWithDetails[]
}

export default function DebatePage() {
  const params = useParams()
  const debateId = params.id as string
  
  const [debate, setDebate] = useState<DebateWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [apiMode, setApiMode] = useState<string>('UNKNOWN')

  useEffect(() => {
    fetchDebate()
    fetchApiStatus()
  }, [debateId])

  const fetchDebate = async () => {
    try {
      const response = await fetch(`/api/debates/${debateId}`)
      const result = await response.json()

      if (result.success) {
        setDebate(result.data)
      } else {
        setError(result.error || 'Error al cargar el debate')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchApiStatus = async () => {
    try {
      const response = await fetch('/api/status')
      const result = await response.json()
      if (result.success) {
        setApiMode(result.data.mode)
      }
    } catch (err) {
      console.log('No se pudo obtener el estado de la API')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Cargando debate...</p>
        </div>
      </div>
    )
  }

  if (error && !debate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/" className="text-purple-400 hover:text-purple-300">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  if (!debate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Debate no encontrado</p>
          <Link href="/" className="text-purple-400 hover:text-purple-300">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-6 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link 
              href="/"
              className="mr-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {debate.topic}
              </h1>
              <div className="flex items-center text-sm text-slate-300">
                <Users className="w-4 h-4 mr-1" />
                Debate con {debate.participants.map(p => p.philosopher.name).join(' y ')}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400 mb-1">
              {debate.messages.length} mensajes
            </div>
            {/* Indicador de modo API */}
            <div className="text-xs px-2 py-1 rounded-full bg-slate-700/50 text-slate-300">
              {apiMode === 'OPENAI' ? '🤖 OpenAI API' : 
               apiMode === 'MOCK' ? '🎭 Modo Mock' : 
               '⏳ Cargando...'}
            </div>
          </div>
        </div>

        {/* Chat Component */}
        <div className="flex-1 min-h-0">
          <DebateChat debate={debate} />
        </div>
      </div>
    </div>
  )
} 