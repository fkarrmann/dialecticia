'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import PhilosopherWizard from '@/components/philosopher/PhilosopherWizard'
import EditPhilosopherWizard from '@/components/philosopher/EditPhilosopherWizard'
import ProtectedLayout from '@/components/layout/ProtectedLayout'
import { 
  Plus, 
  Search, 
  Star, 
  Users, 
  Brain, 
  Eye,
  Heart,
  Sparkles,
  User,
  Edit3,
  Trash2,
  ExternalLink,
  Copy,
  ArrowLeft,
  X,
  BookOpen,
  MessageSquare
} from 'lucide-react'

// Usamos las mismas interfaces que el wizard para consistencia
interface TradeOffAttribute {
  name: string
  leftExtreme: string
  rightExtreme: string
  value: number
}

interface PhilosopherData {
  name: string
  photoUrl?: string
  inspirationType: 'philosopher' | 'school' | ''
  inspirationSource: string
  attributes: TradeOffAttribute[]
  secretSauce: string
  debateMechanics: string
  personalityScores: { name: string; value: number }[]
  generatedDescription: string
  isPublic: boolean
}

interface Philosopher {
  id: string
  name: string
  description: string
  publicDescription?: string
  photoUrl?: string
  philosophicalSchool: string
  inspirationSource?: string
  isPublic: boolean
  isDefault: boolean
  createdBy?: string
  rating: number
  totalRatings: number
  tags?: string[]
  usageCount: number
  createdAt: string
  favoritedBy?: any[]
  isActiveForUser?: boolean
  isFavorite?: boolean
  isActive: boolean
  argumentStyle?: string
  questioningApproach?: string
  personalityTraits?: any[]
  personalityAspects?: { name: string; value: number }[]
  coreBeliefs?: string[]
  debateMechanics?: string
  customPrompt?: string
}

// Función para generar color según el valor (0-5 para personalityTraits)
const getValueColor = (value: number, max: number = 5): string => {
  const percentage = value / max
  
  if (percentage <= 0.3) {
    // Celeste para valores bajos (0-30%)
    return 'rgb(34, 211, 238)' // sky-400
  } else if (percentage <= 0.7) {
    // Amarillo/Naranja para valores medios (30-70%)
    const blendFactor = (percentage - 0.3) / 0.4
    const r = Math.round(34 + (251 - 34) * blendFactor)  // sky-400 to yellow-400
    const g = Math.round(211 + (191 - 211) * blendFactor)
    const b = Math.round(238 + (36 - 238) * blendFactor)
    return `rgb(${r}, ${g}, ${b})`
  } else {
    // Rojo para valores altos (70-100%)
    const blendFactor = (percentage - 0.7) / 0.3
    const r = Math.round(251 + (239 - 251) * blendFactor)  // yellow-400 to red-500
    const g = Math.round(191 + (68 - 191) * blendFactor)
    const b = Math.round(36 + (68 - 36) * blendFactor)
    return `rgb(${r}, ${g}, ${b})`
  }
}

export default function PhilosophersPage() {
  const [philosophers, setPhilosophers] = useState<Philosopher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'my' | 'public' | 'favorites'>('all')
  const [showWizard, setShowWizard] = useState(false)
  const [isCreatingPhilosopher, setIsCreatingPhilosopher] = useState(false)
  const [activePhilosopherId, setActivePhilosopherId] = useState<string | null>(null)
  const [editingPhilosopher, setEditingPhilosopher] = useState<Philosopher | null>(null)
  const [showEditWizard, setShowEditWizard] = useState(false)
  const [editingMode, setEditingMode] = useState<'edit' | 'duplicate'>('edit')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState<boolean>(false)
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false)
  const [viewingPhilosopher, setViewingPhilosopher] = useState<Philosopher | null>(null)

  useEffect(() => {
    loadPhilosophers()
    
    // Obtener userId del usuario actual
    const getCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        console.log('🔍 Debug - Datos de sesión:', data)
        if (data.authenticated && data.user) {
          console.log('🔍 Debug - Setting currentUserId:', data.user.id)
          console.log('🔍 Debug - Setting isAdmin:', data.user.isAdmin)
          setCurrentUserId(data.user.id)
          setIsCurrentUserAdmin(data.user.isAdmin || false)
        }
      } catch (error) {
        console.error('Error obteniendo usuario actual:', error)
      }
    }
    
    getCurrentUser()
  }, [])

  // Debug effect para ver los datos - mejorado
  useEffect(() => {
    if (philosophers.length > 0 && currentUserId) {
      console.log('🔍 Debug completo:')
      console.log('📋 CurrentUserId:', currentUserId)
      philosophers.forEach(p => {
        console.log(`🔍 ${p.name}:`, {
          createdBy: p.createdBy,
          isOwn: p.createdBy === currentUserId,
          canEdit: p.createdBy === currentUserId || isCurrentUserAdmin,
          hasCreatedBy: !!p.createdBy
        })
      })
    }
  }, [philosophers, currentUserId, isCurrentUserAdmin])

  const loadPhilosophers = async () => {
    try {
      console.log('📥 Cargando filósofos desde el servidor...')
      setLoading(true)
      const response = await fetch('/api/philosophers')
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Filósofos cargados:', data.data.length, 'filósofos')
        // DEBUG: Verificar personalityTraits
        data.data.forEach((p: any) => {
          if (p.personalityTraits && p.personalityTraits.length > 0) {
            console.log(`🎯 ${p.name} tiene personalityTraits:`, p.personalityTraits)
          }
        })
        setPhilosophers(data.data)
        setActivePhilosopherId(data.activePhilosopherId || null)
      }
    } catch (error) {
      console.error('Error loading philosophers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePhilosopher = async (data: PhilosopherData) => {
    try {
      setIsCreatingPhilosopher(true)
      
      console.log('🚀 Enviando datos del wizard:', data)
      
      // Generar los campos usando LLMService con prompts de la base de datos
      const generateArgumentStyle = async (debateMechanics: string, inspirationSource: string, secretSauce: string) => {
        try {
          const response = await fetch('/api/admin/llm/generate-field', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              functionName: 'argument_style_generation',
              data: {
                debateMechanics,
                inspirationSource,
                secretSauce
              }
            })
          })
          
          if (!response.ok) {
            console.log('❌ Error generando argumentStyle, usando fallback')
            // Fallback básico
            const styleMap: Record<string, string> = {
              'socratic': 'Estilo socrático: Utiliza preguntas incisivas para guiar hacia el auto-descubrimiento',
              'provocative': 'Estilo provocativo: Desafía activamente las creencias establecidas',
              'contemplative': 'Estilo contemplativo: Reflexiona profundamente invitando a la meditación',
              'analytical': 'Estilo analítico: Descompone argumentos con rigor metodológico',
              'creative': 'Estilo creativo: Emplea analogías y metáforas innovadoras'
            }
            return styleMap[debateMechanics] || `Estilo dialéctico inspirado en ${inspirationSource}`
          }
          
          const result = await response.json()
          return result.content || `Estilo dialéctico inspirado en ${inspirationSource}`
        } catch (error) {
          console.log('❌ Error en generateArgumentStyle:', error)
          return `Estilo dialéctico inspirado en ${inspirationSource}`
        }
      }

      const generateQuestioningApproach = async (attributes: typeof data.attributes, inspirationSource: string) => {
        try {
          const response = await fetch('/api/admin/llm/generate-field', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              functionName: 'questioning_approach_generation',
              data: {
                attributes: attributes.map(attr => ({
                  name: attr.name,
                  value: attr.value,
                  leftExtreme: attr.leftExtreme,
                  rightExtreme: attr.rightExtreme
                })),
                inspirationSource
              }
            })
          })
          
          if (!response.ok) {
            console.log('❌ Error generando questioningApproach, usando fallback')
            return 'Método dialéctico: Formula preguntas que revelan contradicciones internas del pensamiento'
          }
          
          const result = await response.json()
          return result.content || 'Método dialéctico: Formula preguntas que revelan contradicciones internas'
        } catch (error) {
          console.log('❌ Error en generateQuestioningApproach:', error)
          return 'Método dialéctico: Formula preguntas que revelan contradicciones internas'
        }
      }

      const generateCoreBeliefs = async (inspirationSource: string, secretSauce: string, debateMechanics: string) => {
        try {
          const response = await fetch('/api/admin/llm/generate-field', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              functionName: 'core_beliefs_generation',
              data: {
                inspirationSource,
                secretSauce,
                debateMechanics
              }
            })
          })
          
          if (!response.ok) {
            console.log('❌ Error generando coreBeliefs, usando fallback')
            return [
              `Los principios de ${inspirationSource} ofrecen un marco sólido para la comprensión`,
              'El diálogo filosófico es esencial para el desarrollo del pensamiento crítico',
              'Las preguntas correctas son más valiosas que las respuestas fáciles'
            ]
          }
          
          const result = await response.json()
          return result.content || [
            `Los principios de ${inspirationSource} ofrecen un marco sólido`,
            'El diálogo filosófico es esencial para el pensamiento crítico',
            'Las preguntas correctas son más valiosas que las respuestas fáciles'
          ]
        } catch (error) {
          console.log('❌ Error en generateCoreBeliefs:', error)
          return [
            `Los principios de ${inspirationSource} ofrecen un marco sólido`,
            'El diálogo filosófico es esencial para el pensamiento crítico'
          ]
        }
      }

      console.log('🔧 Generando campos con LLMService...')
      
      // Generar los campos de forma paralela
      const [argumentStyle, questioningApproach, coreBeliefs] = await Promise.all([
        generateArgumentStyle(data.debateMechanics, data.inspirationSource, data.secretSauce),
        generateQuestioningApproach(data.attributes, data.inspirationSource),
        generateCoreBeliefs(data.inspirationSource, data.secretSauce, data.debateMechanics)
      ])

      console.log('✅ Campos generados:', { argumentStyle, questioningApproach, coreBeliefs })

      // Mapear los datos del wizard al formato que espera la API
      const requestData = {
        name: data.name,
        description: data.generatedDescription, // Usar la descripción generada
        publicDescription: data.generatedDescription, // Usar como descripción pública también
        photoUrl: data.photoUrl,
        philosophicalSchool: data.inspirationSource, // Usar inspirationSource como philosophicalSchool
        inspirationSource: data.inspirationSource,
        debateMechanics: data.debateMechanics,
        argumentStyle: argumentStyle,
        questioningApproach: questioningApproach,
        isPublic: data.isPublic,
        tags: [], // Valor por defecto
        customPrompt: data.secretSauce, // Usar secretSauce como customPrompt
        coreBeliefs: coreBeliefs,
        personalityScores: data.personalityScores, // ✅ CORREGIDO: usar personalityScores
        personalityAspects: data.attributes // Mapear attributes como personalityAspects
      }
      
      console.log('📋 DEBUG - requestData completo:', {
        name: requestData.name,
        argumentStyle: requestData.argumentStyle,
        questioningApproach: requestData.questioningApproach,
        coreBeliefs: requestData.coreBeliefs,
        secretSauce: data.secretSauce
      })

      const response = await fetch('/api/philosophers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        const createdPhilosopher = await response.json()
        console.log('🎉 Filósofo creado, datos devueltos:', createdPhilosopher.data)
        setShowWizard(false)
        // Pequeño delay para asegurar que la DB se haya actualizado
        await new Promise(resolve => setTimeout(resolve, 500))
        await loadPhilosophers()
        alert('¡Filósofo creado exitosamente!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error('Error creating philosopher:', error)
      alert('Error creando el filósofo')
    } finally {
      setIsCreatingPhilosopher(false)
    }
  }

  const toggleFavorite = async (philosopherId: string) => {
    try {
      const response = await fetch(`/api/philosophers/${philosopherId}/favorite`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await loadPhilosophers()
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleUsePhilosopher = async (philosopherId: string) => {
    try {
      const response = await fetch(`/api/philosophers/${philosopherId}/activate`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setActivePhilosopherId(philosopherId)
        await loadPhilosophers()
        alert('Filósofo activado exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error('Error activating philosopher:', error)
      alert('Error activando el filósofo')
    }
  }

  const handleEditWithWizard = async (philosopher: Philosopher) => {
    try {
      // Cargar datos frescos del servidor antes de editar
      console.log('🔄 Cargando datos frescos para editar:', philosopher.name)
      console.log('🔍 Datos locales actuales:', {
        personalityTraits: philosopher.personalityTraits,
        personalityAspects: philosopher.personalityAspects,
        description: philosopher.description ? philosopher.description.substring(0, 100) + '...' : 'sin descripción'
      })
      
      const response = await fetch(`/api/philosophers/${philosopher.id}`)
      if (response.ok) {
        const data = await response.json()
        console.log('📋 Datos frescos cargados del servidor:')
        console.log('- Name:', data.data.name)
        console.log('- PersonalityScores:', data.data.personalityScores)
        console.log('- PersonalityAspects:', data.data.personalityAspects)
        console.log('- Description length:', data.data.description?.length)
        console.log('- Full data:', data.data)
        
        setEditingPhilosopher(data.data)
        setEditingMode('edit')
        setShowEditWizard(true)
      } else {
        console.error('Error cargando datos del filósofo')
        alert('Error cargando los datos del filósofo')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error cargando los datos del filósofo')
    }
  }

  const handleDuplicatePhilosopher = (philosopher: Philosopher) => {
    setEditingPhilosopher(philosopher)
    setEditingMode('duplicate')
    setShowEditWizard(true)
  }

  const handleDeletePhilosopher = async (philosopherId: string, philosopherName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${philosopherName}? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/philosophers/${philosopherId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadPhilosophers()
        alert('Filósofo eliminado exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting philosopher:', error)
      alert('Error eliminando el filósofo')
    }
  }

  const handleSaveWizardResult = (updatedPhilosopher: any) => {
    console.log('💾 Guardando resultado del wizard:', {
      mode: editingMode,
      name: updatedPhilosopher.name,
      hasPersonalityTraits: !!updatedPhilosopher.personalityTraits,
      personalityTraitsLength: updatedPhilosopher.personalityTraits?.length || 0
    })
    
    if (editingMode === 'duplicate') {
      // Para duplicación, agregar nuevo filósofo
      setPhilosophers(prev => [updatedPhilosopher, ...prev])
    } else {
      // Para edición, recargar todos los datos del servidor para asegurar consistencia
      console.log('🔄 Recargando datos del servidor después de edición...')
      loadPhilosophers()
    }
    setEditingPhilosopher(null)
    setShowEditWizard(false)
  }

  const handleCloseEditWizard = () => {
    setEditingPhilosopher(null)
    setShowEditWizard(false)
  }

  const handleRegenerateAll = async () => {
    if (!isCurrentUserAdmin) {
      alert('❌ Solo administradores pueden realizar esta acción')
      return
    }

    const confirmRegenerate = confirm(
      '🚀 ¿Estás seguro de que quieres regenerar TODOS los filósofos?\n\n' +
      '✅ NUEVA VERSIÓN MEJORADA:\n' +
      '• Usa el sistema de prompts configurado en Admin\n' +
      '• Aplica modelos específicos por función\n' +
      '• Incluye el tono de comunicación activo\n' +
      '• Respeta todas las configuraciones del sistema\n\n' +
      '⚠️ Esta operación:\n' +
      '• Actualizará las descripciones y rasgos de personalidad\n' +
      '• Puede tardar varios minutos\n' +
      '• Afectará a todos los filósofos del sistema\n\n' +
      '¿Continuar?'
    )

    if (!confirmRegenerate) return

    try {
      setIsRegeneratingAll(true)
      console.log('🚀 Iniciando regeneración masiva con sistema mejorado...')
      
      const response = await fetch('/api/admin/philosophers/regenerate-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ securityKey: 'migration2025' })
      })

      if (!response.ok) {
        throw new Error(`Error en la regeneración: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Regeneración completada:', result)
      
      if (result.success) {
        // Usar la estructura correcta con 'results' en lugar de 'stats'
        const stats = result.results || {}
        const metadata = result.metadata || {}
        
        alert(
          `🎉 ¡Regeneración completada con sistema mejorado!\n\n` +
          `✅ Filósofos procesados: ${stats.processed || 0}\n` +
          `✅ Actualizados: ${stats.updated || 0}\n` +
          `❌ Errores: ${stats.errors || 0}\n\n` +
          `🆕 MEJORAS APLICADAS:\n` +
          `🎵 Tono de comunicación: ${metadata.usedCommunicationTone ? 'Aplicado' : 'Sin tono específico'}\n` +
          `🤖 Sistema: ${metadata.systemVersion || 'V2_MEJORADO'}\n` +
          `📋 Prompts: Desde base de datos del admin\n\n` +
          `🔄 Recargando filósofos...`
        )
        
        // Recargar la lista de filósofos
        await loadPhilosophers()
      } else {
        throw new Error(result.error || 'Error desconocido en la regeneración')
      }
      
    } catch (error) {
      console.error('❌ Error en regeneración masiva:', error)
      alert(`❌ Error en la regeneración masiva:\n\n${error}`)
    } finally {
      setIsRegeneratingAll(false)
    }
  }

  const filteredPhilosophers = philosophers.filter(philosopher => {
    const matchesSearch = philosopher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         philosopher.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         philosopher.philosophicalSchool.toLowerCase().includes(searchTerm.toLowerCase())
    
    switch (filterType) {
      case 'my':
        return matchesSearch && philosopher.createdBy
      case 'public':
        return matchesSearch && philosopher.isPublic
      case 'favorites':
        return matchesSearch && philosopher.favoritedBy && philosopher.favoritedBy.length > 0
      default:
        return matchesSearch
    }
  })

  if (showWizard) {
    return (
      <ProtectedLayout>
        <PhilosopherWizard
          onComplete={handleCreatePhilosopher}
          onCancel={() => setShowWizard(false)}
        />
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Link 
                  href="/"
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Volver al inicio</span>
                </Link>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                    🧪 Laboratorio de Filósofos
                    <Sparkles className="w-8 h-8 text-purple-400" />
                  </h1>
                  <p className="text-slate-300 text-lg">
                    Crea, explora y comparte filósofos únicos para tus debates
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                {/* Botón de regeneración masiva - Solo para administradores */}
                {isCurrentUserAdmin && (
                  <Button
                    onClick={handleRegenerateAll}
                    disabled={isRegeneratingAll}
                    className="bg-orange-600 hover:bg-orange-700 text-white border border-orange-500"
                    size="lg"
                    title="🆕 REGENERAR TODOS con Sistema Mejorado: Usa prompts del admin, modelos específicos y tono de comunicación activo (Solo Administradores)"
                  >
                    {isRegeneratingAll ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Regenerando con Sistema V2...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        🔬 Regenerar Todos V2
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  onClick={() => setShowWizard(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Crear Filósofo
                </Button>
              </div>
            </div>

            {/* Búsqueda y filtros */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar filósofos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
              
              <div className="flex gap-2">
                {['all', 'my', 'public', 'favorites'].map((filter) => (
                  <Button
                    key={filter}
                    variant={filterType === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType(filter as any)}
                    className={filterType === filter ? "bg-purple-600 text-white" : "text-slate-300 border-slate-600"}
                  >
                    {filter === 'all' && '🌐 Todos'}
                    {filter === 'my' && '👤 Míos'}
                    {filter === 'public' && '🌍 Públicos'}
                    {filter === 'favorites' && '❤️ Favoritos'}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
            </div>
          )}

          {/* Grid de filósofos */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhilosophers.map((philosopher) => (
                <div 
                  key={philosopher.id} 
                  className={`bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border transition-all duration-200 hover:shadow-xl hover:scale-105 ${
                    activePhilosopherId === philosopher.id
                      ? 'border-purple-500 shadow-purple-500/25'
                      : 'border-slate-700 hover:border-purple-400'
                  }`}
                >
                  {/* Header del filósofo */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {philosopher.photoUrl ? (
                        <img
                          src={philosopher.photoUrl}
                          alt={philosopher.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <Brain className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          {philosopher.name}
                          {activePhilosopherId === philosopher.id && (
                            <Badge className="bg-purple-600 text-white">Activo</Badge>
                          )}
                        </h3>
                        {philosopher.inspirationSource ? (
                          <p className="text-sm text-purple-300">
                            Inspirado en {philosopher.inspirationSource}
                          </p>
                        ) : (
                          <p className="text-sm text-purple-300">{philosopher.philosophicalSchool}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                    <Button
                        size="sm"
                      variant="ghost"
                      onClick={() => toggleFavorite(philosopher.id)}
                        className="text-slate-400 hover:text-red-400"
                    >
                        <Heart className={`w-4 h-4 ${philosopher.isFavorite ? 'fill-red-400 text-red-400' : ''}`} />
                    </Button>
                      
                      {philosopher.isPublic && (
                        <Badge variant="outline" className="text-green-400 border-green-400">
                          <Eye className="w-3 h-3 mr-1" />
                          Público
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Descripción */}
                  <p className="text-slate-300 text-sm mb-4 line-clamp-3">
                    {philosopher.publicDescription || philosopher.description}
                  </p>

                    {/* Tags */}
                  {philosopher.tags && Array.isArray(philosopher.tags) && philosopher.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {philosopher.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {philosopher.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                            +{philosopher.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                  {/* Categorías de Personalidad */}
                  {philosopher.personalityTraits && Array.isArray(philosopher.personalityTraits) && philosopher.personalityTraits.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-purple-400 mb-2 uppercase tracking-wider">Personalidad</h4>
                      <div className="flex flex-wrap gap-2">
                        {philosopher.personalityTraits.map((trait, index) => (
                          <div key={index} className="flex items-center gap-2 bg-gradient-to-r from-purple-900/40 to-slate-800/40 px-3 py-1.5 rounded-lg border border-purple-800/30">
                            <span className="text-purple-300 font-medium text-sm">{trait.name}</span>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    i < trait.value 
                                      ? 'bg-current'
                                      : 'bg-slate-600'
                                  }`}
                                  style={{
                                    color: i < trait.value ? getValueColor(trait.value, 5) : undefined
                                  }}
                                />
                              ))}
                              <span 
                                className="ml-1 text-xs font-bold"
                                style={{ color: getValueColor(trait.value, 5) }}
                              >
                                {trait.value}
                              </span>
                            </div>
                      </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {philosopher.usageCount} usos
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {philosopher.rating.toFixed(1)} ({philosopher.totalRatings})
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUsePhilosopher(philosopher.id)}
                      className={`flex-1 ${
                        activePhilosopherId === philosopher.id
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'bg-slate-700 hover:bg-slate-600'
                      } text-white`}
                      size="sm"
                    >
                      <User className="w-4 h-4 mr-2" />
                      {activePhilosopherId === philosopher.id ? 'Activo' : 'Usar'}
                    </Button>
                    
                    {/* Botones de edición - mostrar duplicar siempre, editar/eliminar solo para propios */}
                    <div className="flex gap-1">
                      {/* Botón de ver detalles - SIEMPRE visible */}
                      <Button
                        onClick={() => setViewingPhilosopher(philosopher)}
                        variant="outline"
                        size="sm"
                        className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                        title="Ver detalles completos"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {/* Botón de duplicar - SIEMPRE visible */}
                      <Button
                        onClick={() => handleDuplicatePhilosopher(philosopher)}
                        variant="outline"
                        size="sm"
                        className="text-emerald-400 border-emerald-400 hover:bg-emerald-400/10"
                        title="Duplicar filósofo"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>

                      {/* Botones de editar y eliminar - SOLO para filósofos propios O admin */}
                      {(philosopher.createdBy && currentUserId && (philosopher.createdBy === currentUserId || isCurrentUserAdmin)) && (
                        <>
                          <Button
                            onClick={() => handleEditWithWizard(philosopher)}
                            variant="outline"
                            size="sm"
                            className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                            title="Editar filósofo"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeletePhilosopher(philosopher.id, philosopher.name)}
                            variant="outline"
                            size="sm"
                            className="text-red-400 border-red-400 hover:bg-red-400/10"
                            title="Eliminar filósofo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-slate-300 border-slate-600 hover:bg-slate-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Estado vacío */}
          {!loading && filteredPhilosophers.length === 0 && (
            <div className="text-center py-16">
              <Brain className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No se encontraron filósofos
              </h3>
              <p className="text-slate-400 mb-6">
                {searchTerm ? 
                  'Intenta con diferentes términos de búsqueda' : 
                  'Crea tu primer filósofo para comenzar'
                }
              </p>
                  <Button
                    onClick={() => setShowWizard(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                <Plus className="w-5 h-5 mr-2" />
                Crear Filósofo
                  </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de edición con wizard */}
      {editingPhilosopher && (
        <EditPhilosopherWizard
          philosopher={editingPhilosopher as any}
          isOpen={showEditWizard}
          onClose={handleCloseEditWizard}
          onSave={handleSaveWizardResult}
          currentUserId={currentUserId}
          isCurrentUserAdmin={isCurrentUserAdmin}
          isDuplicating={editingMode === 'duplicate'}
        />
      )}

      {/* Modal de creación con wizard */}
      {showWizard && (
        <PhilosopherWizard
          onComplete={handleCreatePhilosopher}
          onCancel={() => setShowWizard(false)}
        />
      )}

      {/* Modal de detalles completos */}
      {viewingPhilosopher && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-4">
                {viewingPhilosopher.photoUrl ? (
                  <img
                    src={viewingPhilosopher.photoUrl}
                    alt={viewingPhilosopher.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-white">{viewingPhilosopher.name}</h2>
                  {viewingPhilosopher.inspirationSource ? (
                    <p className="text-purple-300">Inspirado en {viewingPhilosopher.inspirationSource}</p>
                  ) : (
                    <p className="text-purple-300">{viewingPhilosopher.philosophicalSchool}</p>
                  )}
                </div>
              </div>
              <Button
                onClick={() => setViewingPhilosopher(null)}
                variant="outline"
                size="sm"
                className="text-slate-400 border-slate-600 hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Descripción */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Descripción Filosófica
                </h3>
                <p className="text-slate-300 bg-slate-800/50 rounded-lg p-4">
                  {viewingPhilosopher.publicDescription || viewingPhilosopher.description}
                </p>
              </div>

              {/* Grid de información */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Aspectos de Personalidad (Trade-offs) */}
                {viewingPhilosopher.personalityAspects && viewingPhilosopher.personalityAspects.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                      Aspectos de Personalidad
                    </h3>
                    <div className="space-y-3">
                      {viewingPhilosopher.personalityAspects.map((aspect, index) => (
                        <div key={index} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-blue-300 font-medium text-sm">{aspect.name}</span>
                            <span className="text-white font-bold">{aspect.value}/10</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(aspect.value / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rasgos de Personalidad */}
                {viewingPhilosopher.personalityTraits && Array.isArray(viewingPhilosopher.personalityTraits) && viewingPhilosopher.personalityTraits.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-400" />
                      Rasgos de Personalidad
                    </h3>
                    <div className="space-y-2">
                      {viewingPhilosopher.personalityTraits.map((trait, index) => (
                        <div key={index} className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                          <span className="text-red-300 font-medium text-sm flex-1">{trait.name}</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < trait.value ? 'bg-current' : 'bg-slate-600'
                                }`}
                                style={{
                                  color: i < trait.value ? getValueColor(trait.value, 5) : undefined
                                }}
                              />
                            ))}
                            <span 
                              className="ml-2 text-sm font-bold"
                              style={{ color: getValueColor(trait.value, 5) }}
                            >
                              {trait.value}/5
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Más información */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Creencias Fundamentales */}
                {viewingPhilosopher.coreBeliefs && Array.isArray(viewingPhilosopher.coreBeliefs) && viewingPhilosopher.coreBeliefs.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-green-400" />
                      Creencias Fundamentales
                    </h3>
                    <div className="space-y-2">
                      {viewingPhilosopher.coreBeliefs.map((belief, index) => (
                        <div key={index} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                          <p className="text-green-300 text-sm">"{belief}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Información de debate */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-orange-400" />
                      Estilo de Debate
                    </h3>
                    <div className="space-y-3">
                      {viewingPhilosopher.argumentStyle && (
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                          <h4 className="text-orange-300 font-medium text-sm mb-1">Estilo Argumentativo</h4>
                          <p className="text-slate-300 text-sm">{viewingPhilosopher.argumentStyle}</p>
                        </div>
                      )}
                      {viewingPhilosopher.questioningApproach && (
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                          <h4 className="text-orange-300 font-medium text-sm mb-1">Enfoque de Cuestionamiento</h4>
                          <p className="text-slate-300 text-sm">{viewingPhilosopher.questioningApproach}</p>
                        </div>
                      )}
                      {viewingPhilosopher.debateMechanics && (
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                          <h4 className="text-orange-300 font-medium text-sm mb-1">Mecánicas de Debate</h4>
                          <p className="text-slate-300 text-sm">{viewingPhilosopher.debateMechanics}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Salsa Secreta */}
              {viewingPhilosopher.customPrompt && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Salsa Secreta
                  </h3>
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/30">
                    <p className="text-purple-100 italic leading-relaxed">
                      "{viewingPhilosopher.customPrompt}"
                    </p>
                  </div>
                </div>
              )}

              {/* Stats del filósofo */}
              <div className="border-t border-slate-700 pt-4">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {viewingPhilosopher.usageCount} debates
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {viewingPhilosopher.rating.toFixed(1)} ({viewingPhilosopher.totalRatings} valoraciones)
                    </div>
                    {viewingPhilosopher.isPublic && (
                      <div className="flex items-center gap-1 text-green-400">
                        <Eye className="w-4 h-4" />
                        Público
                      </div>
                    )}
                  </div>
                  <div className="text-slate-500">
                    Creado {new Date(viewingPhilosopher.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  )
} 