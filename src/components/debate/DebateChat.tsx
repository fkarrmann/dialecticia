'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Clock, MessageCircle, Target, User, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import ExportProgressModal from '@/components/ui/ExportProgressModal'
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

interface DebateChatProps {
  debate: DebateWithDetails
}

export default function DebateChat({ debate: initialDebate }: DebateChatProps) {
  const [debate, setDebate] = useState<DebateWithDetails>(initialDebate)
  const [messages, setMessages] = useState<MessageWithDetails[]>(initialDebate.messages)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [philosophersTyping, setPhilosophersTyping] = useState<string[]>([])
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ✅ MEJORADO: Contraer automáticamente el header cuando se envía el primer mensaje del usuario
  const initialMessageCount = initialDebate.messages.length
  const hasUserSentMessages = messages.some(m => m.senderType === 'USER') && messages.length > initialMessageCount

  useEffect(() => {
    if (hasUserSentMessages && isHeaderExpanded) {
      setIsHeaderExpanded(false)
    }
  }, [hasUserSentMessages, isHeaderExpanded])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [newMessage])

  // Verificar si es turno del usuario basándose en el último mensaje
  const lastMessage = messages[messages.length - 1]
  const isUserTurn = !lastMessage || lastMessage.senderType === 'PHILOSOPHER'
  const canUserWrite = isUserTurn && !isSending

  const getTurnDescription = () => {
    if (isSending) return '⏳ Los filósofos están respondiendo...'
    if (!isUserTurn) return '⏳ Espera tu turno para responder'
    return '💬 Es tu turno - Sócrates espera tu respuesta'
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    const messageContent = newMessage.trim()
    const tempMessageId = `temp-${Date.now()}`
    
    // Crear mensaje temporal del usuario que aparece inmediatamente
    const userMessage: MessageWithDetails = {
      id: tempMessageId,
      content: messageContent,
      senderType: 'USER',
      debateId: debate.id,
      philosopherId: null,
      userId: null,
      turnNumber: (lastMessage?.turnNumber || 0) + 1,
      timestamp: new Date(),
      philosopher: null
    }

    // Agregar mensaje del usuario inmediatamente
    setMessages(prev => [...prev, userMessage])
    setNewMessage('')
    
    // Mostrar que los filósofos están escribiendo
    const philosophers = debate.participants.map(p => p.philosopher.name)
    setPhilosophersTyping(philosophers)

    try {
      const response = await fetch(`/api/debates/${debate.id}/messages`, {
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
        // Reemplazar todos los mensajes con los datos actualizados del servidor
        setMessages(result.data.messages)
      } else {
        // En caso de error, eliminar el mensaje temporal y restaurar el input
        setMessages(prev => prev.filter(m => m.id !== tempMessageId))
        
        // Manejo especial para errores de debugging de prompts
        if (result.type === 'PROMPT_DEBUGGING_ERROR') {
          setError(`🚨 DEBUG: ${result.message} | ${result.details}`)
        } else {
          setError(result.error || 'Error al enviar el mensaje')
        }
        setNewMessage(messageContent)
      }
    } catch (err) {
      // En caso de error, eliminar el mensaje temporal y restaurar el input
      setMessages(prev => prev.filter(m => m.id !== tempMessageId))
      setError('Error de conexión al enviar mensaje')
      setNewMessage(messageContent)
    } finally {
      setIsSending(false)
      setPhilosophersTyping([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e as any)
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



  return (
    <div className="flex flex-col h-full">
      {/* ENCABEZADO DINÁMICO: Tema y Postura */}
      <div className="bg-gradient-to-r from-purple-600/15 to-blue-600/15 border border-purple-500/20 rounded-lg mb-4 transition-all duration-300 ease-in-out overflow-hidden">
        {/* Header contraído - solo título con botón para expandir */}
        {!isHeaderExpanded && (
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <Target className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <h1 className="text-sm font-medium text-white truncate">
                  {debate.topic}
                </h1>
              </div>
              <button
                onClick={() => setIsHeaderExpanded(true)}
                className="p-1 hover:bg-purple-500/20 rounded transition-colors flex-shrink-0"
                title="Expandir detalles del debate"
              >
                <ChevronDown className="w-4 h-4 text-purple-400" />
              </button>
            </div>
          </div>
        )}

        {/* Header expandido - completo */}
        {isHeaderExpanded && (
          <div className="p-4">
            {/* Tema Principal con botón de contraer - SIEMPRE visible */}
            <div className="text-center mb-3">
              <div className="flex items-center justify-center mb-1 relative">
                <Target className="w-4 h-4 text-purple-400 mr-1" />
                <span className="text-xs font-medium text-purple-300 uppercase tracking-wide">
                  Tema
                </span>
                {/* ✅ ARREGLADO: Botón de contraer siempre disponible */}
                <button
                  onClick={() => setIsHeaderExpanded(false)}
                  className="absolute right-0 p-1 hover:bg-purple-500/20 rounded transition-colors"
                  title="Contraer encabezado"
                >
                  <ChevronUp className="w-4 h-4 text-purple-400" />
                </button>
              </div>
              <h1 className="text-lg md:text-xl font-bold text-white leading-tight">
                {debate.topic}
              </h1>
            </div>

            {/* ✅ MEJORADO: Postura del Usuario - más grande y entre comillas */}
            <div className="bg-slate-800/30 rounded-md p-4 border border-slate-600/30">
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-blue-300 uppercase tracking-wide block mb-2">
                    Tu Postura
                  </span>
                  <blockquote className="text-slate-100 text-base leading-relaxed italic font-medium border-l-2 border-blue-400 pl-3">
                    "{debate.description}"
                  </blockquote>
                </div>
              </div>
            </div>

            {/* Participantes - Más compacto */}
            <div className="flex items-center justify-center mt-3">
              <div className="text-xs text-slate-400 mr-2">Con:</div>
              <div className="flex items-center space-x-1 text-sm">
                {debate.participants.map((participant, index) => (
                  <span key={participant.philosopher.id} className="text-purple-300 font-medium">
                    {participant.philosopher.name}
                    {index < debate.participants.length - 1 && <span className="text-slate-500 mx-1">•</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estado del debate */}
      <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-slate-300">
              <Clock className="w-4 h-4 mr-2" />
              Debate Activo
            </div>
            <div className="text-sm text-slate-300">
              {getTurnDescription()}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-slate-400">
              <MessageCircle className="w-4 h-4 mr-1" />
              {messages.length} mensajes
            </div>
            {/* Botón de exportar PDF usando el componente reutilizable */}
            <ExportProgressModal
              debateId={debate.id}
              buttonText="PDF"
              onExportCancel={() => {
                console.log('Exportación cancelada desde debate chat')
              }}
            />
          </div>
        </div>
      </div>

      {/* Lista de mensajes con scrollbar personalizado */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-custom">
        {messages.map((message) => {
          const sender = getSenderDisplay(message)
          const isTemporary = message.id.toString().startsWith('temp-')
          
          return (
            <div
              key={message.id}
              className={`flex ${message.senderType === 'USER' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-lg p-4 ${sender.bgColor} ${isTemporary ? 'opacity-75' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium text-sm ${sender.color}`}>
                    {sender.name}
                    {isTemporary && <span className="ml-2 text-xs text-slate-400">(enviando...)</span>}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDate(message.timestamp)}
                  </span>
                </div>
                <div className="text-white whitespace-pre-wrap">
                  {message.content}
                </div>
                {message.senderType === 'PHILOSOPHER' && (
                  <div className="mt-2 text-xs text-slate-400">
                    Turno #{message.turnNumber}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Indicadores de escritura */}
        {philosophersTyping.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-purple-500/20 rounded-lg p-4 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-purple-400 text-sm">
                  {philosophersTyping.join(' y ')} {philosophersTyping.length === 1 ? 'está' : 'están'} escribiendo...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className={`border px-4 py-3 rounded-lg mb-4 ${
          error.includes('🚨 DEBUG:') 
            ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' // Estilo especial para debug
            : 'bg-red-500/20 border-red-500/50 text-red-400'        // Estilo normal para errores
        }`}>
          {error.includes('🚨 DEBUG:') && (
            <div className="font-bold text-yellow-200 mb-1">
              🔧 Error de Debugging Detectado
            </div>
          )}
          {error}
          <button 
            onClick={() => setError('')}
            className={`ml-2 hover:opacity-70 ${
              error.includes('🚨 DEBUG:') ? 'text-yellow-200' : 'text-red-300'
            }`}
          >
            ✕
          </button>
        </div>
      )}

      {/* ✅ MEJORADO: Input de mensaje con alineación perfecta */}
      <form onSubmit={sendMessage} className="flex space-x-3 items-start">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isUserTurn ? "Responde a la pregunta de Sócrates... (Enter para enviar, Shift+Enter para nueva línea)" : "Espera tu turno para responder..."}
            disabled={!canUserWrite}
            rows={1}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-hidden min-h-[52px] max-h-32 scrollbar-custom-small"
            style={{ lineHeight: '1.5' }}
          />
          <div className="text-xs text-slate-400 mt-1 px-1">
            Enter para enviar • Shift+Enter para nueva línea
          </div>
        </div>
        <button
          type="submit"
          disabled={!canUserWrite || !newMessage.trim()}
          className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center min-h-[52px] min-w-[52px] flex-shrink-0"
          title={canUserWrite ? "Enviar mensaje" : "Espera tu turno"}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Ayuda */}
      <div className="mt-4 text-xs text-slate-400 text-center">
        💡 Mecánica: Sócrates dirige preguntas específicas alternando entre tú y el filósofo
      </div>
    </div>
  )
} 