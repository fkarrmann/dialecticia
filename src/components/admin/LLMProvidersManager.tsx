'use client'

import { useState, useEffect } from 'react'
import { Plus, Database, Eye, EyeOff, Edit, Trash2, Check, X, RefreshCw } from 'lucide-react'

interface LLMProvider {
  id: string
  name: string
  displayName: string
  baseUrl: string
  isActive: boolean
  hasApiKey: boolean
  apiKeyPreview?: string
  maxTokens: number
  rateLimitRpm: number
  rateLimitTpm: number
  costPer1kTokens: number
  models: Array<{
    id: string
    modelName: string
    displayName: string
    isActive: boolean
  }>
  _count: {
    interactions: number
  }
  createdAt: string
  updatedAt: string
}

export default function LLMProvidersManager() {
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingProvider, setEditingProvider] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})
  
  const [newProvider, setNewProvider] = useState({
    name: '',
    displayName: '',
    baseUrl: '',
    apiKey: '',
    maxTokens: 4000,
    rateLimitRpm: 60,
    rateLimitTpm: 60000,
    costPer1kTokens: 0.002
  })

  const [editProvider, setEditProvider] = useState({
    id: '',
    name: '',
    displayName: '',
    baseUrl: '',
    apiKey: '',
    maxTokens: 4000,
    rateLimitRpm: 60,
    rateLimitTpm: 60000,
    costPer1kTokens: 0.002,
    isActive: true
  })

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/admin/llm/providers')
      if (response.ok) {
        const data = await response.json()
        setProviders(data)
      } else {
        console.error('Error fetching providers:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProvider = async () => {
    if (!newProvider.name || !newProvider.displayName || !newProvider.baseUrl) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    try {
      const response = await fetch('/api/admin/llm/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProvider)
      })

      if (response.ok) {
        const data = await response.json()
        setProviders(prev => [data, ...prev])
        setNewProvider({
          name: '',
          displayName: '',
          baseUrl: '',
          apiKey: '',
          maxTokens: 4000,
          rateLimitRpm: 60,
          rateLimitTpm: 60000,
          costPer1kTokens: 0.002
        })
        setIsCreating(false)
        alert('Proveedor creado exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating provider:', error)
      alert('Error al crear el proveedor')
    }
  }

  const startEditing = (provider: LLMProvider) => {
    setEditProvider({
      id: provider.id,
      name: provider.name,
      displayName: provider.displayName,
      baseUrl: provider.baseUrl,
      apiKey: '', // Empty for security, user needs to enter if they want to change
      maxTokens: provider.maxTokens,
      rateLimitRpm: provider.rateLimitRpm,
      rateLimitTpm: provider.rateLimitTpm,
      costPer1kTokens: provider.costPer1kTokens,
      isActive: provider.isActive
    })
    setEditingProvider(provider.id)
  }

  const updateProvider = async () => {
    if (!editProvider.name || !editProvider.displayName || !editProvider.baseUrl) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    try {
      const response = await fetch(`/api/admin/llm/providers/${editProvider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editProvider.name,
          displayName: editProvider.displayName,
          baseUrl: editProvider.baseUrl,
          ...(editProvider.apiKey && { apiKey: editProvider.apiKey }),
          maxTokens: editProvider.maxTokens,
          rateLimitRpm: editProvider.rateLimitRpm,
          rateLimitTpm: editProvider.rateLimitTpm,
          costPer1kTokens: editProvider.costPer1kTokens,
          isActive: editProvider.isActive
        })
      })

      if (response.ok) {
        const data = await response.json()
        setProviders(prev => prev.map(p => p.id === editProvider.id ? data : p))
        setEditingProvider(null)
        setEditProvider({
          id: '',
          name: '',
          displayName: '',
          baseUrl: '',
          apiKey: '',
          maxTokens: 4000,
          rateLimitRpm: 60,
          rateLimitTpm: 60000,
          costPer1kTokens: 0.002,
          isActive: true
        })
        alert('Proveedor actualizado exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating provider:', error)
      alert('Error al actualizar el proveedor')
    }
  }

  const deleteProvider = async (providerId: string, providerName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el proveedor "${providerName}"?\n\nEsta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/llm/providers/${providerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        setProviders(prev => prev.filter(p => p.id !== providerId))
        alert('Proveedor eliminado exitosamente')
      } else {
        const error = await response.json()
        
        if (error.models && error.models.length > 0) {
          const modelNames = error.models.map((m: any) => `• ${m.name} (${m.modelIdentifier}) - ${m.isActive ? 'Activo' : 'Inactivo'}`).join('\n')
          const message = `${error.details}\n\nModelos que pertenecen a este proveedor:\n${modelNames}\n\n¿Quieres ir a la pestaña de Modelos para eliminarlos?`
          
          if (confirm(message)) {
            alert('Ve a la pestaña "Modelos" para eliminar estos modelos primero.')
          }
        } else if (error.configurations && error.configurations.length > 0) {
          const configNames = error.configurations.map((c: any) => `• ${c.name} (${c.isActive ? 'Activa' : 'Inactiva'})`).join('\n')
          const message = `${error.details}\n\nConfiguraciones que usan este proveedor:\n${configNames}\n\n¿Quieres ir a la pestaña de Configuraciones para eliminarlas?`
          
          if (confirm(message)) {
            alert('Ve a la pestaña "Configuraciones" para eliminar o reasignar estas configuraciones primero.')
          }
        } else {
          alert(`Error: ${error.error}\n\n${error.details || ''}`)
        }
      }
    } catch (error) {
      console.error('Error deleting provider:', error)
      alert('Error al eliminar el proveedor')
    }
  }

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
        <span className="ml-2 text-slate-300">Cargando proveedores...</span>
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
              <p className="text-slate-400 text-sm">Total Proveedores</p>
              <p className="text-2xl font-bold text-white">{providers.length}</p>
            </div>
            <Database className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Proveedores Activos</p>
              <p className="text-2xl font-bold text-green-400">
                {providers.filter(p => p.isActive).length}
              </p>
            </div>
            <Check className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Modelos Totales</p>
              <p className="text-2xl font-bold text-blue-400">
                {providers.reduce((total, p) => total + p.models.length, 0)}
              </p>
            </div>
            <Database className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Interacciones</p>
              <p className="text-2xl font-bold text-yellow-400">
                {providers.reduce((total, p) => total + p._count.interactions, 0)}
              </p>
            </div>
            <RefreshCw className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Crear nuevo proveedor */}
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Crear Proveedor LLM</h2>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Proveedor</span>
          </button>
        </div>

        {isCreating && (
          <div className="border-t border-slate-700 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre del Proveedor *
                </label>
                <input
                  type="text"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="openai, anthropic, google"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre para Mostrar *
                </label>
                <input
                  type="text"
                  value={newProvider.displayName}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="OpenAI, Anthropic, Google AI"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  URL Base de API *
                </label>
                <input
                  type="url"
                  value={newProvider.baseUrl}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={newProvider.apiKey}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={newProvider.maxTokens}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, maxTokens: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rate Limit (RPM)
                </label>
                <input
                  type="number"
                  value={newProvider.rateLimitRpm}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, rateLimitRpm: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rate Limit (TPM)
                </label>
                <input
                  type="number"
                  value={newProvider.rateLimitTpm}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, rateLimitTpm: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Costo/1k Tokens
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={newProvider.costPer1kTokens}
                  onChange={(e) => setNewProvider(prev => ({ ...prev, costPer1kTokens: Number(e.target.value) }))}
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
                onClick={createProvider}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                Crear Proveedor
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de proveedores */}
      <div className="bg-slate-800 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Proveedores Existentes</h2>
        </div>

        {providers.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            No hay proveedores configurados
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {providers.map((provider) => (
              <div key={provider.id} className="p-6 hover:bg-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-white">
                        {provider.displayName}
                      </h3>
                      <span className="text-slate-400">({provider.name})</span>
                      {provider.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactivo
                        </span>
                      )}
                    </div>
                    
                    <p className="text-slate-400 mt-1">{provider.baseUrl}</p>
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-slate-400">
                      <span>Modelos: {provider.models.length}</span>
                      <span>Interacciones: {provider._count.interactions}</span>
                      <span>Max Tokens: {provider.maxTokens.toLocaleString()}</span>
                      {provider.hasApiKey && (
                        <div className="flex items-center space-x-2">
                          <span>API Key:</span>
                          <button
                            onClick={() => toggleApiKeyVisibility(provider.id)}
                            className="flex items-center space-x-1 text-purple-400 hover:text-purple-300"
                          >
                            {showApiKey[provider.id] ? (
                              <>
                                <EyeOff className="w-4 h-4" />
                                <span>Ocultar</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" />
                                <span>{provider.apiKeyPreview}</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEditing(provider)}
                      className="p-2 text-slate-400 hover:text-purple-400"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteProvider(provider.id, provider.displayName)}
                      className="p-2 text-slate-400 hover:text-red-400"
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

      {/* Modal de edición */}
      {editingProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Editar Proveedor</h3>
              <button
                onClick={() => {
                  setEditingProvider(null)
                  setEditProvider({
                    id: '',
                    name: '',
                    displayName: '',
                    baseUrl: '',
                    apiKey: '',
                    maxTokens: 4000,
                    rateLimitRpm: 60,
                    rateLimitTpm: 60000,
                    costPer1kTokens: 0.002,
                    isActive: true
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
                    Nombre del Proveedor *
                  </label>
                  <input
                    type="text"
                    value={editProvider.name}
                    onChange={(e) => setEditProvider(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="openai, anthropic, google"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre para Mostrar *
                  </label>
                  <input
                    type="text"
                    value={editProvider.displayName}
                    onChange={(e) => setEditProvider(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="OpenAI, Anthropic, Google AI"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    URL Base de API *
                  </label>
                  <input
                    type="url"
                    value={editProvider.baseUrl}
                    onChange={(e) => setEditProvider(prev => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="https://api.openai.com/v1"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    API Key (dejar vacío para mantener actual)
                  </label>
                  <input
                    type="password"
                    value={editProvider.apiKey}
                    onChange={(e) => setEditProvider(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="sk-... (nueva API key)"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={editProvider.maxTokens}
                    onChange={(e) => setEditProvider(prev => ({ ...prev, maxTokens: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Rate Limit (RPM)
                  </label>
                  <input
                    type="number"
                    value={editProvider.rateLimitRpm}
                    onChange={(e) => setEditProvider(prev => ({ ...prev, rateLimitRpm: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Rate Limit (TPM)
                  </label>
                  <input
                    type="number"
                    value={editProvider.rateLimitTpm}
                    onChange={(e) => setEditProvider(prev => ({ ...prev, rateLimitTpm: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Costo/1k Tokens
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={editProvider.costPer1kTokens}
                    onChange={(e) => setEditProvider(prev => ({ ...prev, costPer1kTokens: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editProvider.isActive}
                  onChange={(e) => setEditProvider(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-slate-300">
                  Proveedor activo
                </label>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <div className="text-yellow-400 mt-0.5">⚠️</div>
                  <div className="text-yellow-200 text-sm">
                    <strong>Importante:</strong> Si cambias la API key, la nueva clave reemplazará completamente la anterior. Deja el campo vacío si quieres mantener la API key actual.
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                <button
                  onClick={() => {
                    setEditingProvider(null)
                    setEditProvider({
                      id: '',
                      name: '',
                      displayName: '',
                      baseUrl: '',
                      apiKey: '',
                      maxTokens: 4000,
                      rateLimitRpm: 60,
                      rateLimitTpm: 60000,
                      costPer1kTokens: 0.002,
                      isActive: true
                    })
                  }}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={updateProvider}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                >
                  Actualizar Proveedor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 