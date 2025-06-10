'use client'

import { useState } from 'react'
import { MoreVertical, Edit, Trash2, Eye, Download } from 'lucide-react'
import Link from 'next/link'
import ExportProgressModal from '@/components/ui/ExportProgressModal'

interface DebateActionsProps {
  debateId: string
}

export default function DebateActions({ debateId }: DebateActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este debate? Esta acción no se puede deshacer.')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/debates/${debateId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Recargar la página para actualizar la lista
        window.location.reload()
      } else {
        alert('Error al eliminar el debate')
      }
    } catch (error) {
      console.error('Error deleting debate:', error)
      alert('Error al eliminar el debate')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExportStart = () => {
    setIsOpen(false) // Cerrar el menú cuando inicie la exportación
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded hover:bg-slate-700 transition-colors"
        disabled={isDeleting}
      >
        <MoreVertical className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-10 min-w-[150px]">
          <Link
            href={`/debate/${debateId}`}
            className="flex items-center px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver debate
          </Link>
          
          <Link
            href={`/debate/${debateId}/edit`}
            className="flex items-center px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Link>
          
          {/* Componente de exportación con modal de progreso */}
          <div className="flex items-center px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            <ExportProgressModal
              debateId={debateId}
              buttonText="Exportar PDF"
              buttonClassName="bg-transparent hover:bg-transparent text-slate-300 disabled:opacity-50 p-0"
              onExportStart={handleExportStart}
              onExportCancel={() => {
                console.log('Exportación cancelada desde card')
                setIsOpen(false)
              }}
            />
          </div>
          
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      )}

      {/* Overlay para cerrar el menú */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 