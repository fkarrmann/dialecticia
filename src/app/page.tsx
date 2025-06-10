import Link from 'next/link'
import { prisma } from '@/lib/db'
import DebateActions from '@/components/debate/DebateActions'
import ExportProgressModal from '@/components/ui/ExportProgressModal'
import ProtectedLayout from '@/components/layout/ProtectedLayout'
import LogoutButton from '@/components/auth/LogoutButton'
import { getCurrentSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  // Obtener sesión actual
  const session = await getCurrentSession()
  if (!session) {
    redirect('/login')
  }

  // Obtener filósofos para mostrar en la página principal
  const philosophers = await prisma.philosopher.findMany({
    take: 4,
    orderBy: { usageCount: 'desc' }
  })

  // Obtener debates del usuario actual solamente
  const userDebates = await prisma.debate.findMany({
    where: {
      userId: session.user.id
    },
    take: 6,
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
    <ProtectedLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-16">
          {/* Header con logout y bienvenida */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-white">
              <p className="text-lg">Bienvenido, <span className="font-semibold text-purple-300">{session.user.name}</span></p>
              <p className="text-sm text-slate-400">Código: {session.invitationCode.code}</p>
            </div>
            <LogoutButton variant="link" />
          </div>

          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-white mb-6">
              Dialecticia 🏛️
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              ¿Estás listo para cuestionar tus propias ideas?
            </p>
          </div>

          {/* CTA Principal */}
          <div className="text-center mb-16">
            <div className="space-y-6">
              {/* Botones principales */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/debate/new"
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
                >
                  Iniciar Debate
                </Link>
                <Link 
                  href="/philosophers"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
                >
                  🧪 Laboratorio de Pensadores
                </Link>
              </div>
              
              {/* Enlaces de administración - solo para admin */}
              <div className="text-sm space-x-4">
                <Link 
                  href="/admin/llm-management"
                  className="text-slate-400 hover:text-purple-400 transition-colors"
                >
                  🤖 Gestión LLM
                </Link>
                <span className="text-slate-600">•</span>
                <Link 
                  href="/admin/invitations"
                  className="text-slate-400 hover:text-purple-400 transition-colors"
                >
                  🎫 Gestión de Invitaciones
                </Link>
              </div>
            </div>
          </div>

          {/* Mis Debates */}
          {userDebates.length > 0 ? (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white">
                  Mis Debates ({userDebates.length})
                </h2>
                <Link 
                  href="/debates"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Ver todos →
                </Link>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userDebates.map((debate) => (
                  <div 
                    key={debate.id}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white line-clamp-2">
                        {debate.topic}
                      </h3>
                      <DebateActions debateId={debate.id} />
                    </div>
                    
                    <div className="flex items-center mb-3 text-sm text-slate-400">
                      <span className="mr-4">💬 {debate._count.messages} mensajes</span>
                      <span>{new Date(debate.updatedAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center mb-4">
                      <span className="text-xs text-slate-500 mr-2">Con:</span>
                      <div className="flex space-x-2">
                        {debate.participants.slice(0, 2).map((participant) => (
                          <span 
                            key={participant.id}
                            className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded"
                          >
                            {participant.philosopher.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link 
                        href={`/debate/${debate.id}`}
                        className="flex-1 text-center bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded transition-colors"
                      >
                        Continuar debate
                      </Link>
                      <ExportProgressModal
                        debateId={debate.id}
                        buttonText="Exportar PDF"
                        buttonClassName="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-16 text-center">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 border border-slate-700">
                <div className="text-6xl mb-4">🏛️</div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  ¡Comienza tu primer debate!
                </h2>
                <p className="text-slate-300 mb-6">
                  Aún no tienes debates. Inicia una conversación filosófica con nuestros grandes pensadores.
                </p>
                <Link 
                  href="/debate/new"
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Iniciar mi primer debate
                </Link>
              </div>
            </div>
          )}

          {/* Filósofos Destacados */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Conocé a Nuestros Pensadores
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {philosophers.map((philosopher) => (
                <div 
                  key={philosopher.id}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700"
                >
                  <h3 className="text-xl font-bold text-white mb-2">
                    {philosopher.name}
                  </h3>
                  <p className="text-purple-300 text-sm mb-3">
                    {philosopher.philosophicalSchool}
                  </p>
                  <p className="text-slate-300 text-sm">
                    {philosopher.description}
                  </p>
                  <div className="mt-4 text-xs text-slate-400">
                    Debates: {philosopher.usageCount}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl mb-4">🎭</div>
              <h3 className="text-xl font-bold text-white mb-2">
                Pensadores Únicos
              </h3>
              <p className="text-slate-300">
                Cada debate incluye personajes únicos con personalidades filosóficas distintas
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🏛️</div>
              <h3 className="text-xl font-bold text-white mb-2">
                Método Socrático
              </h3>
              <p className="text-slate-300">
                Preguntas penetrantes que desarman ideas preconcebidas
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💾</div>
              <h3 className="text-xl font-bold text-white mb-2">
                Historial Privado
              </h3>
              <p className="text-slate-300">
                Todos tus debates se guardan de forma privada y organizada
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-slate-400">
            <p className="italic">
              &quot;El único conocimiento verdadero es saber que no sabes nada&quot; - Sócrates
            </p>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
