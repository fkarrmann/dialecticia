'use client'

import { useState } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'

interface Philosopher {
  id: string
  name: string
  description: string
  philosophicalSchool: string
  argumentStyle?: string
  questioningApproach?: string
  isActive: boolean
}

interface EditPhilosopherModalProps {
  philosopher: Philosopher
  isOpen: boolean
  onClose: () => void
  onSave: (updatedPhilosopher: Philosopher) => void
}

export default function EditPhilosopherModal({
  philosopher,
  isOpen,
  onClose,
  onSave
}: EditPhilosopherModalProps) {
  const [formData, setFormData] = useState({
    name: philosopher.name,
    description: philosopher.description,
    philosophicalSchool: philosopher.philosophicalSchool,
    argumentStyle: philosopher.argumentStyle || '',
    questioningApproach: philosopher.questioningApproach || '',
    isActive: philosopher.isActive
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/philosophers/${philosopher.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        onSave(result.data)
        onClose()
      } else {
        setError(result.error || 'Error al actualizar el filósofo')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-800 rounded-lg shadow-xl border border-slate-700 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            Editar Filósofo: {philosopher.name}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              maxLength={50}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Descripción *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={4}
              required
              maxLength={500}
            />
            <p className="text-xs text-slate-400 mt-1">
              {formData.description.length}/500 caracteres
            </p>
          </div>

          {/* Escuela Filosófica */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Escuela Filosófica *
            </label>
            <input
              type="text"
              value={formData.philosophicalSchool}
              onChange={(e) => setFormData({ ...formData, philosophicalSchool: e.target.value })}
              className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="ej: Existencialismo, Racionalismo, etc."
              required
            />
          </div>

          {/* Estilo Argumentativo */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Estilo Argumentativo
            </label>
            <textarea
              value={formData.argumentStyle}
              onChange={(e) => setFormData({ ...formData, argumentStyle: e.target.value })}
              className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={3}
              placeholder="Describe cómo argumenta este filósofo..."
            />
          </div>

          {/* Enfoque de Cuestionamiento */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Enfoque de Cuestionamiento
            </label>
            <textarea
              value={formData.questioningApproach}
              onChange={(e) => setFormData({ ...formData, questioningApproach: e.target.value })}
              className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={3}
              placeholder="Describe cómo hace preguntas este filósofo..."
            />
          </div>

          {/* Estado Activo */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-300">
              Filósofo activo (disponible para debates)
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim() || !formData.description.trim() || !formData.philosophicalSchool.trim()}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 