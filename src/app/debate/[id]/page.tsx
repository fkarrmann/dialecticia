'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Users, ThumbsUp, ThumbsDown } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { DebateWithDetails, MessageWithDetails } from '@/types'

export default function DebatePage() {
  const params = useParams()
  const debateId = params.id as string
  
  const [debate, setDebate] = useState<DebateWithDetails | null>(null)
  const [messages, setMessages] = useState<MessageWithDetails[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    fetchDebate()
  }, [debateId])

  const fetchDebate = async () => {
    try {
      const response = await fetch(`/api/debates/${debateId}`)
      const result = await response.json()

      if (result.success) {
        setDebate(result.data)
        setMessages(result.data.messages)
      } else {
        setError(result.error || 'Error al cargar el debate')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      const response = await fetch(`/api/debates/${debateId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setMessages(result.data.allMessages)
      } else {
        setError(result.error || 'Error al enviar el mensaje')
        setNewMessage(messageContent) // Restaurar mensaje en caso de error
      }
    } catch (err) {
      setError('Error de conexión al enviar mensaje')
      setNewMessage(messageContent) // Restaurar mensaje en caso de error
    } finally {
      setIsSending(false)
    }
  }

  const getSenderDisplay = (message: MessageWithDetails) => {
    switch (message.senderType) {
      case 'USER':
        return { name: 'Tú', color: 'text-blue-400', bgColor: 'bg-blue-500/20' }
      case 'PHILOSOPHER':
        return { 
          name: message.philosopher?.name || 'Filósofo', 
          color: 'text-purple-400', 
          bgColor: 'bg-purple-500/20' 
        }
      case 'SYSTEM':
        return { name: 'Sistema', color: 'text-green-400', bgColor: 'bg-green-500/20' }
      default:
        return { name: 'Desconocido', color: 'text-gray-400', bgColor: 'bg-gray-500/20' }
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
                {debate?.topic}
              </h1>
              <div className="flex items-center text-sm text-slate-300">
                <Users className="w-4 h-4 mr-1" />
                Debatiendo con {debate?.participants.map(p => p.philosopher.name).join(' y ')}
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            {messages.length} mensajes
          </div>
        </div>

        {/* Participants Bar */}
        <div className="flex gap-4 mb-4">
          {debate?.participants.map((participant) => (
            <div 
              key={participant.id}
              className="bg-slate-800/50 rounded-lg p-3 flex-1"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                  {participant.philosopher.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    {participant.philosopher.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {participant.philosopher.philosophicalSchool}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Messages Area */}
        <div className="flex-1 bg-slate-800/30 rounded-lg border border-slate-700 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => {
              const sender = getSenderDisplay(message)
              return (
                <div 
                  key={message.id}
                  className={`p-4 rounded-lg ${sender.bgColor} border border-slate-600`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className={`font-semibold ${sender.color}`}>
                        {sender.name}
                      </span>
                      {message.philosopher && (
                        <span className="ml-2 text-xs text-slate-400">
                          {message.philosopher.philosophicalSchool}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatDate(message.timestamp)}
                    </span>
                  </div>
                  <div className="text-slate-200 whitespace-pre-wrap">
                    {message.content}
                  </div>
                  {/* Voting buttons (placeholder for future implementation) */}
                  {message.senderType === 'PHILOSOPHER' && (
                    <div className="flex items-center mt-3 space-x-2">
                      <button className="flex items-center text-xs text-slate-400 hover:text-green-400 transition-colors">
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        {message.votes.filter(v => v.value > 0).length}
                      </button>
                      <button className="flex items-center text-xs text-slate-400 hover:text-red-400 transition-colors">
                        <ThumbsDown className="w-3 h-3 mr-1" />
                        {message.votes.filter(v => v.value < 0).length}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm">
              {error}
              <button 
                onClick={() => setError('')}
                className="ml-2 text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          )}

          {/* Message Input */}
          <div className="p-6 border-t border-slate-700">
            <form onSubmit={sendMessage} className="flex gap-3">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Defiende tu posición o responde a los filósofos..."
                className="flex-1 p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={2}
                disabled={isSending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(e)
                  }
                }}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
            <p className="text-xs text-slate-400 mt-2">
              Presiona Enter para enviar, Shift+Enter para nueva línea
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 