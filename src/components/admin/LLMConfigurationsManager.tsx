'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Settings, Edit3, Plus, Trash2, Eye, EyeOff } from 'lucide-react'

interface LLMConfiguration {
  id: string
  functionName: string
  description: string | null
  parameters: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface LLMModel {
  id: string
  displayName: string
  provider: {
    displayName: string
  }
}

export default function LLMConfigurationsManager() {
  const [configurations, setConfigurations] = useState<LLMConfiguration[]>([])
  const [models, setModels] = useState<LLMModel[]>([])
  const [loading, setLoading] = useState(true)
  const [editingConfig, setEditingConfig] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [expandedConfigs, setExpandedConfigs] = useState<Set<string>>(new Set())

  const [editConfig, setEditConfig] = useState({
    id: '',
    functionName: '',
    description: '',
    parameters: '',
    modelId: '',
    isActive: true
  })

  const [newConfig, setNewConfig] = useState({
    functionName: '',
    description: '',
    parameters: '{}',
    modelId: '',
    isActive: true
  })

  useEffect(() => {
    fetchConfigurations()
    fetchModels()
  }, [])

  const fetchConfigurations = async () => {
    try {
      const response = await fetch('/api/admin/llm/configurations')
      if (response.ok) {
        const data = await response.json()
        setConfigurations(data)
      } else {
        console.error('Error fetching configurations:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching configurations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/admin/llm/models')
      if (response.ok) {
        const data = await response.json()
        setModels(data.filter((m: LLMModel & { isActive: boolean }) => m.isActive))
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    }
  }

  const createConfiguration = async () => {
    if (!newConfig.functionName || !newConfig.description) {
      alert('Por favor completa los campos requeridos')
      return
    }

    try {
      // Validar JSON si hay parámetros
      if (newConfig.parameters) {
        JSON.parse(newConfig.parameters)
      }

      const response = await fetch('/api/admin/llm/configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionName: newConfig.functionName,
          description: newConfig.description,
          parameters: newConfig.parameters || null,
          modelId: newConfig.modelId || null,
          isActive: newConfig.isActive
        })
      })

      if (response.ok) {
        const data = await response.json()
        setConfigurations(prev => [data, ...prev])
        setNewConfig({
          functionName: '',
          description: '',
          parameters: '{}',
          modelId: '',
          isActive: true
        })
        setIsCreating(false)
        alert('Configuración creada exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        alert('Error: Los parámetros deben ser JSON válido')
      } else {
        console.error('Error creating configuration:', error)
        alert('Error al crear la configuración')
      }
    }
  }

  const startEditing = (config: LLMConfiguration) => {
    setEditConfig({
      id: config.id,
      functionName: config.functionName,
      description: config.description || '',
      parameters: config.parameters || '{}',
      modelId: '',
      isActive: config.isActive
    })
    setEditingConfig(config.id)
  }

  const updateConfiguration = async () => {
    if (!editConfig.functionName || !editConfig.description) {
      alert('Por favor completa los campos requeridos')
      return
    }

    try {
      // Validar JSON si hay parámetros
      if (editConfig.parameters) {
        JSON.parse(editConfig.parameters)
      }

      const response = await fetch(`/api/admin/llm/configurations/${editConfig.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionName: editConfig.functionName,
          description: editConfig.description,
          parameters: editConfig.parameters || null,
          modelId: editConfig.modelId || null,
          isActive: editConfig.isActive
        })
      })

      if (response.ok) {
        const data = await response.json()
        setConfigurations(prev => prev.map(c => c.id === editConfig.id ? data : c))
        setEditingConfig(null)
        setEditConfig({
          id: '',
          functionName: '',
          description: '',
          parameters: '{}',
          modelId: '',
          isActive: true
        })
        alert('Configuración actualizada exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        alert('Error: Los parámetros deben ser JSON válido')
      } else {
        console.error('Error updating configuration:', error)
        alert('Error al actualizar la configuración')
      }
    }
  }

  const deleteConfiguration = async (configId: string, functionName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la configuración "${functionName}"?\n\nEsta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/llm/configurations/${configId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        setConfigurations(prev => prev.filter(c => c.id !== configId))
        alert('Configuración eliminada exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting configuration:', error)
      alert('Error al eliminar la configuración')
    }
  }

  const toggleExpanded = (configId: string) => {
    setExpandedConfigs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(configId)) {
        newSet.delete(configId)
      } else {
        newSet.add(configId)
      }
      return newSet
    })
  }

  const formatJSON = (jsonString: string) => {
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2)
    } catch {
      return jsonString
    }
  }

  const getParametersPreview = (parameters: string | null) => {
    if (!parameters) return 'Sin parámetros'
    
    try {
      const parsed = JSON.parse(parameters)
      const keys = Object.keys(parsed)
      if (keys.length === 0) return 'Objeto vacío'
      if (keys.length <= 3) return keys.join(', ')
      return `${keys.slice(0, 3).join(', ')}... (+${keys.length - 3} más)`
    } catch {
      return 'JSON inválido'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
        <span className="ml-2 text-slate-300">Cargando configuraciones...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Configuraciones</p>
              <p className="text-2xl font-bold text-white">{configurations.length}</p>
            </div>
            <Settings className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Configuraciones Activas</p>
              <p className="text-2xl font-bold text-green-400">
                {configurations.filter(c => c.isActive).length}
              </p>
            </div>
            <Settings className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Con Parámetros</p>
              <p className="text-2xl font-bold text-blue-400">
                {configurations.filter(c => c.parameters && c.parameters !== '{}').length}
              </p>
            </div>
            <Settings className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Crear nueva configuración */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Configuraciones LLM</h2>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Configuración</span>
          </button>
        </div>

        {isCreating && (
          <div className="border-t border-slate-700 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre de Función *
                </label>
                <input
                  type="text"
                  value={newConfig.functionName}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, functionName: e.target.value }))}
                  placeholder="conversation_settings, debug_mode, etc."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Modelo LLM (Opcional)
                </label>
                <select
                  value={newConfig.modelId}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, modelId: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selección automática</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.provider.displayName} - {model.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Descripción *
              </label>
              <input
                type="text"
                value={newConfig.description}
                onChange={(e) => setNewConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe el propósito de esta configuración..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Parámetros (JSON)
              </label>
              <textarea
                value={newConfig.parameters}
                onChange={(e) => setNewConfig(prev => ({ ...prev, parameters: e.target.value }))}
                placeholder='{"key": "value", "setting": true}'
                rows={6}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">
                Formato JSON válido. Usa {} para parámetros vacíos.
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="newIsActive"
                checked={newConfig.isActive}
                onChange={(e) => setNewConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="newIsActive" className="ml-2 text-sm text-slate-300">
                Configuración activa
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
              <button
                onClick={() => {
                  setIsCreating(false)
                  setNewConfig({
                    functionName: '',
                    description: '',
                    parameters: '{}',
                    modelId: '',
                    isActive: true
                  })
                }}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={createConfiguration}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                Crear Configuración
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de configuraciones */}
      <div className="bg-slate-800 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Configuraciones Existentes</h2>
        </div>

        {configurations.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            No hay configuraciones creadas
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {configurations.map((config) => (
              <div key={config.id} className="p-6 hover:bg-slate-700/50">
                {editingConfig === config.id ? (
                  // Modo edición
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Nombre de Función *
                        </label>
                        <input
                          type="text"
                          value={editConfig.functionName}
                          onChange={(e) => setEditConfig(prev => ({ ...prev, functionName: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Modelo LLM (Opcional)
                        </label>
                        <select
                          value={editConfig.modelId}
                          onChange={(e) => setEditConfig(prev => ({ ...prev, modelId: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Selección automática</option>
                          {models.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.provider.displayName} - {model.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Descripción *
                      </label>
                      <input
                        type="text"
                        value={editConfig.description}
                        onChange={(e) => setEditConfig(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Parámetros (JSON)
                      </label>
                      <textarea
                        value={editConfig.parameters}
                        onChange={(e) => setEditConfig(prev => ({ ...prev, parameters: e.target.value }))}
                        rows={8}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      />
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-slate-400">
                          Formato JSON válido requerido
                        </p>
                        <button
                          onClick={() => setEditConfig(prev => ({ 
                            ...prev, 
                            parameters: formatJSON(prev.parameters) 
                          }))}
                          className="text-xs text-purple-400 hover:text-purple-300"
                        >
                          Formatear JSON
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="editIsActive"
                        checked={editConfig.isActive}
                        onChange={(e) => setEditConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="editIsActive" className="ml-2 text-sm text-slate-300">
                        Configuración activa
                      </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                      <button
                        onClick={() => {
                          setEditingConfig(null)
                          setEditConfig({
                            id: '',
                            functionName: '',
                            description: '',
                            parameters: '{}',
                            modelId: '',
                            isActive: true
                          })
                        }}
                        className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={updateConfiguration}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                      >
                        Guardar Cambios
                      </button>
                    </div>
                  </div>
                ) : (
                  // Modo vista
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-white">
                          {config.functionName}
                        </h3>
                        {config.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactiva
                          </span>
                        )}
                        {config.functionName === 'conversation_settings' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            🗣️ Etapas Conversacionales
                          </span>
                        )}
                      </div>
                      
                      <p className="text-slate-400 mt-1">
                        {config.description || 'Sin descripción'}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-slate-400">Parámetros:</span>
                          <p className="text-white font-medium">
                            {getParametersPreview(config.parameters)}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400">Actualizado:</span>
                          <p className="text-white font-medium">
                            {new Date(config.updatedAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>

                      {expandedConfigs.has(config.id) && config.parameters && (
                        <div className="mt-4 p-4 bg-slate-900 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-slate-300">Parámetros JSON:</h4>
                          </div>
                          <pre className="text-xs text-slate-300 overflow-x-auto">
                            {formatJSON(config.parameters)}
                          </pre>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {config.parameters && (
                        <button
                          onClick={() => toggleExpanded(config.id)}
                          className="p-2 text-slate-400 hover:text-blue-400"
                          title={expandedConfigs.has(config.id) ? 'Ocultar parámetros' : 'Ver parámetros'}
                        >
                          {expandedConfigs.has(config.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={() => startEditing(config)}
                        className="p-2 text-slate-400 hover:text-purple-400"
                        title="Editar configuración"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteConfiguration(config.id, config.functionName)}
                        className="p-2 text-slate-400 hover:text-red-400"
                        title="Eliminar configuración"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 