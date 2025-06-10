'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Sparkles } from 'lucide-react'

interface Philosopher {
  id: string
  name: string
  description: string
  philosophicalSchool: string
  isActive: boolean
}

export default function NewDebatePage() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPhilosopherId, setSelectedPhilosopherId] = useState('')
  const [philosophers, setPhilosophers] = useState<Philosopher[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPhilosophers, setIsLoadingPhilosophers] = useState(true)
  const [isSuggestingPhilosopher, setIsSuggestingPhilosopher] = useState(false)
  const [suggestion, setSuggestion] = useState<{
    reasoning: string
    suggestedPhilosopherId: string
  } | null>(null)
  const [error, setError] = useState('')

  // Cargar filósofos disponibles
  useEffect(() => {
    const loadPhilosophers = async () => {
      try {
        const response = await fetch('/api/philosophers')
        const result = await response.json()
        
        if (result.success) {
          const activePhilosophers = result.data.filter((p: Philosopher) => p.isActive)
          setPhilosophers(activePhilosophers)
          
          // Seleccionar el primer filósofo como default
          if (activePhilosophers.length > 0) {
            setSelectedPhilosopherId(activePhilosophers[0].id)
          }
        }
      } catch (error) {
        console.error('Error loading philosophers:', error)
        setError('Error cargando filósofos disponibles')
      } finally {
        setIsLoadingPhilosophers(false)
      }
    }

    loadPhilosophers()
  }, [])

  // Función para solicitar sugerencia de filósofo
  const suggestPhilosopher = async () => {
    if (!topic.trim() || !description.trim()) {
      setError('Completa el tema y tu punto de vista para obtener una sugerencia')
      return
    }

    setIsSuggestingPhilosopher(true)
    setError('')
    setSuggestion(null)

    try {
      const response = await fetch('/api/philosophers/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          userPosition: description.trim(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuggestion({
          reasoning: result.data.reasoning,
          suggestedPhilosopherId: result.data.suggestedPhilosopherId
        })
        setSelectedPhilosopherId(result.data.suggestedPhilosopherId)
      } else {
        setError(result.error || 'Error al obtener sugerencia')
      }
    } catch (err) {
      setError('Error de conexión al solicitar sugerencia')
    } finally {
      setIsSuggestingPhilosopher(false)
    }
  }

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
          description: description.trim(),
          selectedPhilosopherId,
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
              Nuevo Debate Filosófico
            </h1>
            <p className="text-slate-300">
              Define tu tema, expresa tu punto de vista y elige un filósofo para el debate
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Formulario */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tema del Debate */}
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-slate-300 mb-2">
                    📝 Tema del Debate *
                  </label>
                  <textarea
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="¿Cuál es el tema que quieres debatir? Ej: ¿Es la libertad de expresión absoluta?"
                    className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={3}
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Sé específico para obtener mejores respuestas del filósofo.
                  </p>
                </div>

                {/* Tu Punto de Vista */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                    💭 Tu Punto de Vista *
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explica tu posición sobre este tema. Este será el punto de vista que el filósofo desafiará..."
                    className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={4}
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Tu punto de vista será la base del diálogo filosófico. Sé claro y específico.
                  </p>
                </div>

                {/* Selector de Filósofo */}
                <div>
                  <label htmlFor="philosopher" className="block text-sm font-medium text-slate-300 mb-2">
                    🧠 Filósofo para el Debate *
                  </label>
                  
                  {/* Botón de sugerencia inteligente */}
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={suggestPhilosopher}
                      disabled={isSuggestingPhilosopher || !topic.trim() || !description.trim()}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center"
                    >
                      {isSuggestingPhilosopher ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Analizando tu postura...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          🤖 Sugerir Filósofo Antagónico con IA
                        </>
                      )}
                    </button>
                    <p className="text-xs text-slate-400 mt-2 text-center">
                      {!topic.trim() || !description.trim() 
                        ? 'Completa el tema y tu postura para obtener una sugerencia inteligente' 
                        : 'La IA analizará tu postura y sugerirá el filósofo más desafiante'
                      }
                    </p>
                  </div>

                  {/* Mostrar razonamiento de la sugerencia */}
                  {suggestion && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-purple-300 uppercase tracking-wide mb-1">
                            💡 Sugerencia IA
                          </p>
                          <p className="text-sm text-slate-200 leading-relaxed">
                            {suggestion.reasoning}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selector manual */}
                  <div>
                    <p className="text-sm text-slate-300 mb-2">O selecciona manualmente:</p>
                    {isLoadingPhilosophers ? (
                      <div className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400 mr-2"></div>
                        <span className="text-slate-400">Cargando filósofos...</span>
                      </div>
                    ) : (
                      <select
                        id="philosopher"
                        value={selectedPhilosopherId}
                        onChange={(e) => setSelectedPhilosopherId(e.target.value)}
                        className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      >
                        <option value="">-- Selecciona un filósofo --</option>
                        {philosophers.map((philosopher) => (
                          <option key={philosopher.id} value={philosopher.id}>
                            {philosopher.name} - {philosopher.philosophicalSchool}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Información del filósofo seleccionado */}
                  {selectedPhilosopherId && (
                    <div className="mt-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                      {(() => {
                        const selectedPhil = philosophers.find(p => p.id === selectedPhilosopherId)
                        return selectedPhil ? (
                          <div>
                            <p className="text-sm text-slate-200 font-medium">{selectedPhil.name}</p>
                            <p className="text-xs text-slate-400 mt-1">{selectedPhil.description}</p>
                            <p className="text-xs text-purple-400 mt-2">
                              Escuela: {selectedPhil.philosophicalSchool}
                            </p>
                          </div>
                        ) : null
                      })()}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || topic.length < 3 || description.length < 10 || !selectedPhilosopherId}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creando debate...
                    </>
                  ) : (
                    <>
                      <User className="w-5 h-5 mr-2" />
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
                  <li>• Define claramente el tema que quieres debatir</li>
                  <li>• Explica tu posición de manera específica y detallada</li>
                  <li>• Usa la IA para encontrar el filósofo más desafiante</li>
                  <li>• Cada filósofo tiene su estilo único de argumentación</li>
                  <li>• Prepárate para defender tus ideas con argumentos sólidos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 