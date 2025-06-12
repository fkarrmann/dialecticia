'use client'

import { useState, useEffect } from 'react'
import { Plus, Bot, Settings, Trash2, RefreshCw } from 'lucide-react'

interface LLMModel {
  id: string
  providerId: string
  modelName: string
  displayName: string
  isActive: boolean
  maxTokens: number
  costPer1kInput: number
  costPer1kOutput: number
  capabilities?: string
  parameters?: string
  usageFunction?: string
  provider: {
    id: string
    name: string
    displayName: string
    isActive: boolean
  }
  _count?: {
    interactions: number
  }
  createdAt: string
  updatedAt: string
}

interface LLMProvider {
  id: string
  name: string
  displayName: string
  isActive: boolean
}

export default function LLMModelsManager() {
  const [models, setModels] = useState<LLMModel[]>([])
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  
  const [newModel, setNewModel] = useState({
    providerId: '',
    modelName: '',
    displayName: '',
    maxTokens: 4000,
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.01,
    usageFunction: '',
    capabilities: [] as string[],
    parameters: {
      temperature: 0.7,
      top_p: 1.0,
      frequency_penalty: 0,
      presence_penalty: 0
    }
  })

  useEffect(() => {
    fetchProviders()
    fetchModels()
  }, [])

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/admin/llm/providers')
      if (response.ok) {
        const data = await response.json()
        setProviders(data.filter((p: LLMProvider) => p.isActive))
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    }
  }

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/admin/llm/models')
      if (response.ok) {
        const data = await response.json()
        setModels(data)
      } else {
        console.error('Error fetching models:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    } finally {
      setLoading(false)
    }
  }

  const createModel = async () => {
    if (!newModel.providerId || !newModel.modelName || !newModel.displayName) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    try {
      const response = await fetch('/api/admin/llm/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newModel,
          capabilities: newModel.capabilities,
          parameters: newModel.parameters
        })
      })

      if (response.ok) {
        const data = await response.json()
        setModels(prev => [data, ...prev])
        setNewModel({
          providerId: '',
          modelName: '',
          displayName: '',
          maxTokens: 4000,
          costPer1kInput: 0.0025,
          costPer1kOutput: 0.01,
          usageFunction: '',
          capabilities: [],
          parameters: {
            temperature: 0.7,
            top_p: 1.0,
            frequency_penalty: 0,
            presence_penalty: 0
          }
        })
        setIsCreating(false)
        alert('Modelo creado exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating model:', error)
      alert('Error al crear el modelo')
    }
  }

  const deleteModel = async (modelId: string, modelName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el modelo "${modelName}"?\n\nEsta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/llm/models/${modelId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        setModels(prev => prev.filter(m => m.id !== modelId))
        alert('Modelo eliminado exitosamente')
      } else {
        const error = await response.json()
        
        if (error.configurations && error.configurations.length > 0) {
          const configNames = error.configurations.map((c: any) => `• ${c.name} (${c.isActive ? 'Activa' : 'Inactiva'})`).join('\n')
          const message = `${error.details}\n\nConfiguraciones que usan este modelo:\n${configNames}\n\n¿Quieres eliminar automáticamente el modelo Y todas sus configuraciones?`
          
          if (confirm(message)) {
            await forceDeleteModel(modelId, modelName)
          }
        } else {
          alert(`Error: ${error.error}\n\n${error.details || ''}`)
        }
      }
    } catch (error) {
      console.error('Error deleting model:', error)
      alert('Error al eliminar el modelo')
    }
  }

  const toggleModelStatus = async (modelId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/llm/models/${modelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      })

      if (response.ok) {
        const updatedModel = await response.json()
        setModels(prev => prev.map(m => 
          m.id === modelId 
            ? { ...m, isActive: !currentStatus }
            : m
        ))
        alert(`Modelo ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating model status:', error)
      alert('Error al actualizar el estado del modelo')
    }
  }

  const forceDeleteModel = async (modelId: string, modelName: string) => {
    try {
      const response = await fetch(`/api/admin/llm/models/${modelId}/force-delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const result = await response.json()
        setModels(prev => prev.filter(m => m.id !== modelId))
        
        const configsDeleted = result.deletedConfigurations.length
        const configsList = result.deletedConfigurations.map((c: any) => `• ${c.name}`).join('\n')
        
        alert(`✅ Eliminación exitosa:\n\n• Modelo: ${modelName}\n• Configuraciones eliminadas: ${configsDeleted}\n\n${configsList}`)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}\n\n${error.details || ''}`)
      }
    } catch (error) {
      console.error('Error force deleting model:', error)
      alert('Error al eliminar el modelo forzadamente')
    }
  }

  const filteredModels = selectedProvider 
    ? models.filter(m => m.providerId === selectedProvider)
    : models

  const calculateAverageCost = (model: LLMModel) => {
    return ((model.costPer1kInput + model.costPer1kOutput) / 2).toFixed(4)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
        <span className="ml-2 text-slate-300">Cargando modelos...</span>
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
              <p className="text-slate-400 text-sm">Total Modelos</p>
              <p className="text-2xl font-bold text-white">{models.length}</p>
            </div>
            <Bot className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Modelos Activos</p>
              <p className="text-2xl font-bold text-green-400">
                {models.filter(m => m.isActive).length}
              </p>
            </div>
            <Settings className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Interacciones</p>
              <p className="text-2xl font-bold text-blue-400">
                {models.reduce((total, m) => total + (m._count?.interactions || 0), 0)}
              </p>
            </div>
            <RefreshCw className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Costo Promedio/1k</p>
              <p className="text-2xl font-bold text-yellow-400">
                $
                {models.length > 0 
                  ? (models.reduce((total, m) => total + ((m.costPer1kInput + m.costPer1kOutput) / 2), 0) / models.length).toFixed(3)
                  : '0.000'
                }
              </p>
            </div>
            <Bot className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-white">Filtrar por Proveedor</h2>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos los proveedores</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.displayName}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Modelo</span>
          </button>
        </div>

        {isCreating && (
          <div className="border-t border-slate-700 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Proveedor *
                </label>
                <select
                  value={newModel.providerId}
                  onChange={(e) => setNewModel(prev => ({ ...prev, providerId: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selecciona un proveedor</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre del Modelo *
                </label>
                <input
                  type="text"
                  value={newModel.modelName}
                  onChange={(e) => setNewModel(prev => ({ ...prev, modelName: e.target.value }))}
                  placeholder="gpt-4o, claude-3-sonnet, gemini-pro"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre para Mostrar *
                </label>
                <input
                  type="text"
                  value={newModel.displayName}
                  onChange={(e) => setNewModel(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="GPT-4o (Most Advanced)"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Función de Uso
                </label>
                <select
                  value={newModel.usageFunction}
                  onChange={(e) => setNewModel(prev => ({ ...prev, usageFunction: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Uso general</option>
                  <option value="philosopher_response">Respuesta de filósofos</option>
                  <option value="personality_analysis">Análisis de personalidad</option>
                  <option value="final_personality_generation">Generación final</option>
                  <option value="antagonistic_selection">Selección antagónica</option>
                  <option value="socratic_questioning">Preguntas socráticas</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={newModel.maxTokens}
                  onChange={(e) => setNewModel(prev => ({ ...prev, maxTokens: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Costo/1k Input
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={newModel.costPer1kInput}
                  onChange={(e) => setNewModel(prev => ({ ...prev, costPer1kInput: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Costo/1k Output
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={newModel.costPer1kOutput}
                  onChange={(e) => setNewModel(prev => ({ ...prev, costPer1kOutput: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={createModel}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                Crear Modelo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de modelos */}
      <div className="bg-slate-800 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            Modelos Existentes 
            {selectedProvider && (
              <span className="text-purple-400 ml-2">
                ({providers.find(p => p.id === selectedProvider)?.displayName})
              </span>
            )}
          </h2>
        </div>

        {filteredModels.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            No hay modelos configurados
            {selectedProvider && ' para este proveedor'}
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {filteredModels.map((model) => (
              <div key={model.id} className="p-6 hover:bg-slate-700/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-white">
                        {model.displayName}
                      </h3>
                      <span className="text-slate-400">({model.modelName})</span>
                      {model.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactivo
                        </span>
                      )}
                      {model.usageFunction && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {model.usageFunction}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-slate-400 mt-1">
                      Proveedor: {model.provider.displayName}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-slate-400">Max Tokens:</span>
                        <p className="text-white font-medium">{model.maxTokens.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Input/1k:</span>
                        <p className="text-green-400 font-medium">${model.costPer1kInput.toFixed(4)}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Output/1k:</span>
                        <p className="text-blue-400 font-medium">${model.costPer1kOutput.toFixed(4)}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Promedio/1k:</span>
                        <p className="text-yellow-400 font-medium">${calculateAverageCost(model)}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Interacciones:</span>
                        <p className="text-white font-medium">{model._count?.interactions || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button 
                      onClick={() => toggleModelStatus(model.id, model.isActive)}
                      className="p-2 text-slate-400 hover:text-purple-400"
                      title={model.isActive ? 'Desactivar modelo' : 'Activar modelo'}
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteModel(model.id, model.displayName)}
                      className="p-2 text-slate-400 hover:text-red-400"
                      title="Eliminar modelo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 