'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Sparkles } from 'lucide-react'

export default function NewDebatePage() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/debates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          description: description.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        router.push(`/debate/${result.data.id}`)
      } else {
        setError(result.error || 'Error al crear el debate')
      }
    } catch (err) {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const topicSuggestions = [
    "¿Es la inteligencia artificial una amenaza para la humanidad?",
    "¿Deberíamos priorizar la felicidad individual o el bienestar colectivo?",
    "¿Es la libertad de expresión absoluta o tiene límites?",
    "¿Existe el libre albedrío o todo está predeterminado?",
    "¿Es la democracia la mejor forma de gobierno?",
    "¿Debería existir la propiedad privada?",
    "¿Es la tecnología más beneficiosa o perjudicial para la sociedad?",
    "¿Tiene la vida humana un propósito intrínseco?",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link 
            href="/"
            className="mr-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Nuevo Debate Socrático
            </h1>
            <p className="text-slate-300">
              Propón un tema y deja que los filósofos desafíen tus ideas
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Formulario */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-slate-300 mb-2">
                    Tema del Debate *
                  </label>
                  <textarea
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="¿Cuál es tu posición o idea que quieres debatir?"
                    className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={3}
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Mínimo 3 caracteres. Sé específico para obtener mejores respuestas.
                  </p>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                    Descripción Adicional (Opcional)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explica más detalles sobre tu posición o contexto específico..."
                    className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={2}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || topic.length < 3}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creando debate...
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5 mr-2" />
                      Iniciar Debate
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Sugerencias */}
            <div className="space-y-6">
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
                <div className="flex items-center mb-4">
                  <Sparkles className="w-5 h-5 text-purple-400 mr-2" />
                  <h3 className="text-xl font-semibold text-white">
                    Temas Sugeridos
                  </h3>
                </div>
                <div className="space-y-2">
                  {topicSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setTopic(suggestion)}
                      className="w-full text-left p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg text-slate-300 hover:text-white transition-colors text-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-6 border border-purple-500/30">
                <h3 className="text-lg font-semibold text-white mb-3">
                  💡 Consejos para un Buen Debate
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Sé específico en tu posición inicial</li>
                  <li>• Los filósofos seleccionarán automáticamente para máximo contraste</li>
                  <li>• Prepárate para defender tus ideas con argumentos sólidos</li>
                  <li>• Mantén la mente abierta a nuevas perspectivas</li>
                  <li>• El objetivo es aprender, no ganar</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 