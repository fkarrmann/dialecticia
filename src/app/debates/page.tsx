import Link from 'next/link'
import { prisma } from '@/lib/db'
import DebateActions from '@/components/debate/DebateActions'
import ExportProgressModal from '@/components/ui/ExportProgressModal'
import { Search, Plus } from 'lucide-react'
import type { Debate, DebateParticipant, Philosopher } from '@prisma/client'

interface DebatesPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

type DebateWithDetails = Debate & {
  participants: (DebateParticipant & {
    philosopher: Philosopher
  })[]
  _count: {
    messages: number
  }
}

export default async function DebatesPage({ searchParams }: DebatesPageProps) {
  const search = typeof searchParams.search === 'string' ? searchParams.search : ''
  
  // Obtener todos los debates con filtros
  const debates: DebateWithDetails[] = await prisma.debate.findMany({
    where: search ? {
      topic: {
        contains: search
      }
    } : undefined,
    orderBy: { updatedAt: 'desc' },
    include: {
      participants: {
        include: {
          philosopher: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Todos los Debates
            </h1>
            <p className="text-slate-300">
              Gestiona y explora tu historial completo de diálogos filosóficos
            </p>
          </div>
          
          <Link
            href="/debate/new"
            className="mt-4 md:mt-0 flex items-center bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Debate
          </Link>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <form method="GET">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Buscar debates por tema..."
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
              />
            </form>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{debates.length}</div>
            <div className="text-slate-400">Total debates</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">
              {debates.reduce((acc, debate) => acc + debate._count.messages, 0)}
            </div>
            <div className="text-slate-400">Total mensajes</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">
              {debates.filter(d => d.updatedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
            </div>
            <div className="text-slate-400">Esta semana</div>
          </div>
        </div>

        {/* Debates List */}
        {debates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🤔</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {search ? 'No se encontraron debates' : 'No hay debates aún'}
            </h3>
            <p className="text-slate-400 mb-6">
              {search 
                ? 'Intenta con otros términos de búsqueda' 
                : 'Comienza tu primer diálogo filosófico'
              }
            </p>
            {!search && (
              <Link
                href="/debate/new"
                className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Crear Primer Debate
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {debates.map((debate) => (
              <div 
                key={debate.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {debate.topic}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <span>💬 {debate._count.messages} mensajes</span>
                      <span>📅 {new Date(debate.updatedAt).toLocaleDateString()}</span>
                      <span>🕒 {new Date(debate.updatedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <DebateActions debateId={debate.id} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm text-slate-500 mr-3">Filósofos:</span>
                    <div className="flex space-x-2">
                      {debate.participants.map((participant) => (
                        <span 
                          key={participant.id}
                          className="text-sm bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full"
                        >
                          {participant.philosopher.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link 
                      href={`/debate/${debate.id}`}
                      className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded transition-colors"
                    >
                      Continuar →
                    </Link>
                    <ExportProgressModal
                      debateId={debate.id}
                      buttonText="Exportar PDF"
                      buttonClassName="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link 
            href="/"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
} 