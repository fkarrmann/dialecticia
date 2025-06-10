'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Users, Search } from 'lucide-react'

interface Philosopher {
  id: string
  name: string
  description: string
  philosophicalSchool: string
  personalityTraits: string // JSON string
  coreBeliefs: string // JSON string
  argumentStyle: string
  questioningApproach: string
  isActive: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

interface PhilosopherFormData {
  name: string
  description: string
  philosophicalSchool: string
  personalityTraits: string[]
  coreBeliefs: string[]
  argumentStyle: string
  questioningApproach: string
  isPublic: boolean
}

export default function PhilosopherManager() {
  const [philosophers, setPhilosophers] = useState<Philosopher[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPhilosopher, setEditingPhilosopher] = useState<Philosopher | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState<PhilosopherFormData>({
    name: '',
    description: '',
    philosophicalSchool: '',
    personalityTraits: [''],
    coreBeliefs: [''],
    argumentStyle: '',
    questioningApproach: '',
    isPublic: false
  })

  // Cargar filósofos
  useEffect(() => {
    fetchPhilosophers()
  }, [])

  const fetchPhilosophers = async () => {
    try {
      const response = await fetch('/api/philosophers')
      if (response.ok) {
        const result = await response.json()
        setPhilosophers(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching philosophers:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      philosophicalSchool: '',
      personalityTraits: [''],
      coreBeliefs: [''],
      argumentStyle: '',
      questioningApproach: '',
      isPublic: false
    })
    setEditingPhilosopher(null)
    setShowForm(false)
  }

  const handleEdit = (philosopher: Philosopher) => {
    setFormData({
      name: philosopher.name,
      description: philosopher.description,
      philosophicalSchool: philosopher.philosophicalSchool,
      personalityTraits: JSON.parse(philosopher.personalityTraits || '[""]'),
      coreBeliefs: JSON.parse(philosopher.coreBeliefs || '[""]'),
      argumentStyle: philosopher.argumentStyle,
      questioningApproach: philosopher.questioningApproach,
      isPublic: false // Simplified for now
    })
    setEditingPhilosopher(philosopher)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const filteredData = {
      ...formData,
      personalityTraits: formData.personalityTraits.filter(trait => trait.trim() !== ''),
      coreBeliefs: formData.coreBeliefs.filter(belief => belief.trim() !== '')
    }

    try {
      const url = editingPhilosopher 
        ? `/api/philosophers/${editingPhilosopher.id}`
        : '/api/philosophers'
      
      const method = editingPhilosopher ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filteredData)
      })

      if (response.ok) {
        await fetchPhilosophers()
        resetForm()
      } else {
        const result = await response.json()
        alert(result.error || 'Error al guardar el filósofo')
      }
    } catch (error) {
      console.error('Error saving philosopher:', error)
      alert('Error al guardar el filósofo')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${name}?`)) return

    try {
      const response = await fetch(`/api/philosophers/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchPhilosophers()
      } else {
        const result = await response.json()
        alert(result.error || 'Error al eliminar el filósofo')
      }
    } catch (error) {
      console.error('Error deleting philosopher:', error)
      alert('Error al eliminar el filósofo')
    }
  }

  const addArrayField = (field: 'personalityTraits' | 'coreBeliefs') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const updateArrayField = (field: 'personalityTraits' | 'coreBeliefs', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const removeArrayField = (field: 'personalityTraits' | 'coreBeliefs', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const filteredPhilosophers = philosophers.filter(phil =>
    phil.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    phil.philosophicalSchool.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-100">Gestión de Filósofos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center gap-2 text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Crear Filósofo
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar filósofos por nombre o escuela..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Lista de filósofos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPhilosophers.map((philosopher) => (
          <div key={philosopher.id} className="bg-slate-800 rounded-lg p-4 border border-slate-600">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-slate-100 text-lg">{philosopher.name}</h3>
                <p className="text-sm text-purple-400">{philosopher.philosophicalSchool}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(philosopher)}
                  className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(philosopher.id, philosopher.name)}
                  className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-sm text-slate-300 mb-3 line-clamp-3">{philosopher.description}</p>
            
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {philosopher.usageCount} usos
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                philosopher.isActive 
                  ? 'bg-green-900 text-green-300' 
                  : 'bg-red-900 text-red-300'
              }`}>
                {philosopher.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredPhilosophers.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          {searchTerm ? 'No se encontraron filósofos que coincidan con la búsqueda' : 'No hay filósofos disponibles'}
        </div>
      )}

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-100 mb-4">
              {editingPhilosopher ? 'Editar Filósofo' : 'Crear Nuevo Filósofo'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Escuela Filosófica
                </label>
                <input
                  type="text"
                  value={formData.philosophicalSchool}
                  onChange={(e) => setFormData(prev => ({ ...prev, philosophicalSchool: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              {/* Rasgos de personalidad */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Rasgos de Personalidad
                </label>
                {formData.personalityTraits.map((trait, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={trait}
                      onChange={(e) => updateArrayField('personalityTraits', index, e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ej: Cuestionador, Analítico..."
                    />
                    {formData.personalityTraits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayField('personalityTraits', index)}
                        className="px-3 py-2 text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('personalityTraits')}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  + Agregar rasgo
                </button>
              </div>

              {/* Creencias centrales */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Creencias Centrales
                </label>
                {formData.coreBeliefs.map((belief, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={belief}
                      onChange={(e) => updateArrayField('coreBeliefs', index, e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ej: La virtud es conocimiento..."
                    />
                    {formData.coreBeliefs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayField('coreBeliefs', index)}
                        className="px-3 py-2 text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('coreBeliefs')}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  + Agregar creencia
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Estilo Argumentativo
                </label>
                <textarea
                  value={formData.argumentStyle}
                  onChange={(e) => setFormData(prev => ({ ...prev, argumentStyle: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Describe cómo argumenta este filósofo..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Enfoque de Cuestionamiento
                </label>
                <textarea
                  value={formData.questioningApproach}
                  onChange={(e) => setFormData(prev => ({ ...prev, questioningApproach: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Describe cómo hace preguntas y cuestiona..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-slate-400 hover:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                >
                  {editingPhilosopher ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 