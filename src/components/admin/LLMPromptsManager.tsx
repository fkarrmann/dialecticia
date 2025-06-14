'use client'

import { useState, useEffect } from 'react'
import { Plus, FileText, Edit, Trash2, RefreshCw, Eye, Copy, X, Power, PowerOff } from 'lucide-react'

interface PromptTemplate {
  id: string
  name: string
  category: string
  displayName: string
  version: string
  isActive: boolean
  systemPrompt: string
  userPrompt?: string
  description?: string
  usage?: string
  parameters?: string
  testData?: string
  modelId?: string
  model?: {
    id: string
    displayName: string
    provider: {
      displayName: string
    }
  }
  createdBy?: string
  _count: {
    interactions: number
  }
  createdAt: string
  updatedAt: string
}

interface LLMModel {
  id: string
  displayName: string
  provider: {
    id: string
    displayName: string
    name: string
  }
}

export default function LLMPromptsManager() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([])
  const [models, setModels] = useState<LLMModel[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [previewPrompt, setPreviewPrompt] = useState<string | null>(null)
  
  const [newPrompt, setNewPrompt] = useState({
    name: '',
    category: 'socratic',
    displayName: '',
    systemPrompt: '',
    userPrompt: '',
    description: '',
    usage: '',
    parameters: {},
    testData: {},
    modelId: ''
  })

  const [editPrompt, setEditPrompt] = useState({
    id: '',
    name: '',
    category: 'socratic',
    displayName: '',
    systemPrompt: '',
    userPrompt: '',
    description: '',
    usage: '',
    parameters: {},
    testData: {},
    modelId: ''
  })

  const categories = [
    { value: 'socratic', label: 'Socrático' },
    { value: 'philosopher', label: 'Filósofo' },
    { value: 'analysis', label: 'Análisis' },
    { value: 'generation', label: 'Generación' },
    { value: 'system', label: 'Sistema' }
  ]

  useEffect(() => {
    fetchPrompts()
    fetchModels()
  }, [])

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/admin/llm/prompts')
      if (response.ok) {
        const data = await response.json()
        setPrompts(data)
      } else {
        console.error('Error fetching prompts:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/admin/llm/models')
      if (response.ok) {
        const data = await response.json()
        setModels(data.filter((model: any) => model.isActive))
      } else {
        console.error('Error fetching models:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    }
  }

  const createPrompt = async () => {
    if (!newPrompt.name || !newPrompt.displayName || !newPrompt.systemPrompt) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    try {
      const response = await fetch('/api/admin/llm/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrompt)
      })

      if (response.ok) {
        const data = await response.json()
        setPrompts(prev => [data, ...prev])
        setNewPrompt({
          name: '',
          category: 'socratic',
          displayName: '',
          systemPrompt: '',
          userPrompt: '',
          description: '',
          usage: '',
          parameters: {},
          testData: {},
          modelId: ''
        })
        setIsCreating(false)
        alert('Prompt creado exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating prompt:', error)
      alert('Error al crear el prompt')
    }
  }

  const startEditing = (prompt: PromptTemplate) => {
    setEditPrompt({
      id: prompt.id,
      name: prompt.name,
      category: prompt.category,
      displayName: prompt.displayName,
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt || '',
      description: prompt.description || '',
      usage: prompt.usage || '',
      parameters: prompt.parameters ? JSON.parse(prompt.parameters) : {},
      testData: prompt.testData ? JSON.parse(prompt.testData) : {},
      modelId: prompt.modelId || ''
    })
    setEditingPrompt(prompt.id)
  }

  const updatePrompt = async () => {
    if (!editPrompt.name || !editPrompt.displayName || !editPrompt.systemPrompt) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    try {
      const response = await fetch(`/api/admin/llm/prompts/${editPrompt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editPrompt.name,
          category: editPrompt.category,
          displayName: editPrompt.displayName,
          systemPrompt: editPrompt.systemPrompt,
          userPrompt: editPrompt.userPrompt,
          description: editPrompt.description,
          usage: editPrompt.usage,
          parameters: editPrompt.parameters,
          testData: editPrompt.testData,
          modelId: editPrompt.modelId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPrompts(prev => prev.map(p => p.id === editPrompt.id ? data : p))
        setEditingPrompt(null)
        setEditPrompt({
          id: '',
          name: '',
          category: 'socratic',
          displayName: '',
          systemPrompt: '',
          userPrompt: '',
          description: '',
          usage: '',
          parameters: {},
          testData: {},
          modelId: ''
        })
        alert('Prompt actualizado exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating prompt:', error)
      alert('Error al actualizar el prompt')
    }
  }

  const copyPrompt = (promptContent: string) => {
    navigator.clipboard.writeText(promptContent)
    alert('Prompt copiado al portapapeles')
  }

  const deletePrompt = async (promptId: string, promptName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el prompt "${promptName}"?\n\nNota: Si tiene interacciones registradas, se desactivará en lugar de eliminarse.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/llm/prompts/${promptId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const result = await response.json()
        setPrompts(prev => prev.filter(p => p.id !== promptId))
        alert(result.message || 'Prompt eliminado exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting prompt:', error)
      alert('Error al eliminar el prompt')
    }
  }

  const togglePromptStatus = async (promptId: string, promptName: string, currentStatus: boolean) => {
    const action = currentStatus ? 'desactivar' : 'activar'
    if (!confirm(`¿Estás seguro de que quieres ${action} el prompt "${promptName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/llm/prompts/${promptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      })

      if (response.ok) {
        const updatedPrompt = await response.json()
        setPrompts(prev => prev.map(p => p.id === promptId ? updatedPrompt : p))
        alert(`Prompt ${action} exitosamente`)
        
        // Refetch para asegurar que tenemos el estado correcto
        await fetchPrompts()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error toggling prompt status:', error)
      alert(`Error al ${action} el prompt`)
    }
  }

  const filteredPrompts = selectedCategory 
    ? prompts.filter(p => p.category === selectedCategory)
    : prompts

  const groupedPrompts = filteredPrompts.reduce((acc, prompt) => {
    if (!acc[prompt.name]) {
      acc[prompt.name] = []
    }
    acc[prompt.name].push(prompt)
    return acc
  }, {} as Record<string, PromptTemplate[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
        <span className="ml-2 text-slate-300">Cargando prompts...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Prompts</p>
              <p className="text-2xl font-bold text-white">{prompts.length}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Prompts Activos</p>
              <p className="text-2xl font-bold text-green-400">
                {prompts.filter(p => p.isActive).length}
              </p>
            </div>
            <Edit className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Categorías</p>
              <p className="text-2xl font-bold text-blue-400">
                {new Set(prompts.map(p => p.category)).size}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Interacciones</p>
              <p className="text-2xl font-bold text-yellow-400">
                {prompts.reduce((total, p) => total + (p._count?.interactions || 0), 0)}
              </p>
            </div>
            <RefreshCw className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Filtros y acciones */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-white">Filtrar por Categoría</h2>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Prompt</span>
          </button>
        </div>

        {isCreating && (
          <div className="border-t border-slate-700 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre del Prompt *
                </label>
                <input
                  type="text"
                  value={newPrompt.name}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="socratic_default, philosopher_response"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Categoría *
                </label>
                <select
                  value={newPrompt.category}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Modelo LLM
                </label>
                <select
                  value={newPrompt.modelId}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, modelId: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selección automática</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.provider.displayName} - {model.displayName}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Si no seleccionas un modelo, se elegirá automáticamente según la función
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre para Mostrar *
                </label>
                <input
                  type="text"
                  value={newPrompt.displayName}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Sócrates - Pregunta por Defecto"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={newPrompt.description}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción de qué hace este prompt"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Uso/Función
                </label>
                <input
                  type="text"
                  value={newPrompt.usage}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, usage: e.target.value }))}
                  placeholder="Utilizado cuando Sócrates hace preguntas generales"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                System Prompt *
              </label>
              <textarea
                value={newPrompt.systemPrompt}
                onChange={(e) => setNewPrompt(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="Eres Sócrates, el maestro del método socrático..."
                rows={8}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                User Prompt (Opcional)
              </label>
              <textarea
                value={newPrompt.userPrompt}
                onChange={(e) => setNewPrompt(prev => ({ ...prev, userPrompt: e.target.value }))}
                placeholder="Template del prompt del usuario con variables..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={createPrompt}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                Crear Prompt
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de prompts */}
      <div className="bg-slate-800 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            Prompts Existentes
            {selectedCategory && (
              <span className="text-purple-400 ml-2">
                ({categories.find(c => c.value === selectedCategory)?.label})
              </span>
            )}
          </h2>
        </div>

        {Object.keys(groupedPrompts).length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            No hay prompts configurados
            {selectedCategory && ' en esta categoría'}
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {Object.entries(groupedPrompts).map(([promptName, versions]) => {
              const activeVersion = versions.find(v => v.isActive) || versions[0]
              
              return (
                <div key={promptName} className="p-6 hover:bg-slate-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-white">
                          {activeVersion.displayName}
                        </h3>
                        <span className="text-slate-400">({promptName})</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {activeVersion.category}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          v{activeVersion.version}
                        </span>
                        {activeVersion.model && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            🤖 {activeVersion.model.provider.displayName} - {activeVersion.model.displayName}
                          </span>
                        )}
                        {!activeVersion.model && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            🔄 Auto-select
                          </span>
                        )}
                        {versions.length > 1 && (
                          <span className="text-slate-400 text-sm">
                            +{versions.length - 1} versión{versions.length > 2 ? 'es' : ''}
                          </span>
                        )}
                      </div>
                      
                      {activeVersion.description && (
                        <p className="text-slate-400 mt-1">{activeVersion.description}</p>
                      )}
                      
                      {activeVersion.usage && (
                        <p className="text-slate-500 mt-1 text-sm">Uso: {activeVersion.usage}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-3 text-sm text-slate-400">
                        <span>Interacciones: {activeVersion._count?.interactions || 0}</span>
                        <span>Longitud: {activeVersion.systemPrompt.length} chars</span>
                        {activeVersion.userPrompt && (
                          <span>+ User Prompt ({activeVersion.userPrompt.length} chars)</span>
                        )}
                      </div>

                      {/* Preview del prompt */}
                      <div className="mt-3">
                        <div className="bg-slate-900 rounded-lg p-3 border border-slate-600">
                          <div className="text-slate-300 text-sm font-mono">
                            {activeVersion.systemPrompt.length > 200 
                              ? `${activeVersion.systemPrompt.substring(0, 200)}...`
                              : activeVersion.systemPrompt
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setPreviewPrompt(activeVersion.id)}
                        className="p-2 text-slate-400 hover:text-blue-400"
                        title="Ver completo"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => copyPrompt(activeVersion.systemPrompt)}
                        className="p-2 text-slate-400 hover:text-green-400"
                        title="Copiar prompt"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => startEditing(activeVersion)}
                        className="p-2 text-slate-400 hover:text-purple-400"
                        title="Editar prompt"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => togglePromptStatus(activeVersion.id, activeVersion.displayName, activeVersion.isActive)}
                        className={`p-2 ${activeVersion.isActive 
                          ? 'text-green-400 hover:text-orange-400' 
                          : 'text-red-400 hover:text-green-400'
                        }`}
                        title={activeVersion.isActive ? 'Desactivar prompt' : 'Activar prompt'}
                      >
                        {activeVersion.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deletePrompt(activeVersion.id, activeVersion.displayName)}
                        className="p-2 text-slate-400 hover:text-red-400"
                        title="Eliminar prompt"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de preview */}
      {previewPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Preview Completo</h3>
              <button
                onClick={() => setPreviewPrompt(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-slate-300 whitespace-pre-wrap">
              {prompts.find(p => p.id === previewPrompt)?.systemPrompt}
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {editingPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Editar Prompt</h3>
              <button
                onClick={() => {
                  setEditingPrompt(null)
                  setEditPrompt({
                    id: '',
                    name: '',
                    category: 'socratic',
                    displayName: '',
                    systemPrompt: '',
                    userPrompt: '',
                    description: '',
                    usage: '',
                    parameters: {},
                    testData: {},
                    modelId: ''
                  })
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre del Prompt *
                  </label>
                  <input
                    type="text"
                    value={editPrompt.name}
                    onChange={(e) => setEditPrompt(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="socratic_default, philosopher_response"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={editPrompt.category}
                    onChange={(e) => setEditPrompt(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Modelo LLM
                  </label>
                  <select
                    value={editPrompt.modelId}
                    onChange={(e) => setEditPrompt(prev => ({ ...prev, modelId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Selección automática</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.provider.displayName} - {model.displayName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    Si no seleccionas un modelo, se elegirá automáticamente según la función
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre para Mostrar *
                  </label>
                  <input
                    type="text"
                    value={editPrompt.displayName}
                    onChange={(e) => setEditPrompt(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Sócrates - Pregunta por Defecto"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={editPrompt.description}
                    onChange={(e) => setEditPrompt(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción de qué hace este prompt"
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Uso/Función
                  </label>
                  <input
                    type="text"
                    value={editPrompt.usage}
                    onChange={(e) => setEditPrompt(prev => ({ ...prev, usage: e.target.value }))}
                    placeholder="Utilizado cuando Sócrates hace preguntas generales"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  System Prompt *
                </label>
                <textarea
                  value={editPrompt.systemPrompt}
                  onChange={(e) => setEditPrompt(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  placeholder="Eres Sócrates, el maestro del método socrático..."
                  rows={10}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  User Prompt (Opcional)
                </label>
                <textarea
                  value={editPrompt.userPrompt}
                  onChange={(e) => setEditPrompt(prev => ({ ...prev, userPrompt: e.target.value }))}
                  placeholder="Template del prompt del usuario con variables..."
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                />
              </div>

              <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <div className="text-yellow-400 mt-0.5">⚠️</div>
                  <div className="text-yellow-200 text-sm">
                    <strong>Importante:</strong> Si modificas el contenido del prompt (System Prompt, User Prompt o Nombre), se creará una nueva versión automáticamente. Solo los cambios en metadatos (descripción, uso) no crearán versiones nuevas.
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                <button
                  onClick={() => {
                    setEditingPrompt(null)
                    setEditPrompt({
                      id: '',
                      name: '',
                      category: 'socratic',
                      displayName: '',
                      systemPrompt: '',
                      userPrompt: '',
                      description: '',
                      usage: '',
                      parameters: {},
                      testData: {},
                      modelId: ''
                    })
                  }}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={updatePrompt}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                >
                  Actualizar Prompt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 