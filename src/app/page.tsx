import Link from 'next/link'
import { prisma } from '@/lib/db'

export default async function HomePage() {
  // Obtener filósofos para mostrar en la página principal
  const philosophers = await prisma.philosopher.findMany({
    take: 4,
    orderBy: { usageCount: 'desc' }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            Dialecticia 🏛️
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Desafía tus ideas con filósofos virtuales que utilizan el método socrático 
            para cuestionar tus certezas más profundas
          </p>
        </div>

        {/* CTA Principal */}
        <div className="text-center mb-16">
          <Link 
            href="/debate/new"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
          >
            Iniciar Nuevo Debate
          </Link>
        </div>

        {/* Filósofos Destacados */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Conoce a Nuestros Filósofos
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
              Filósofos Únicos
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
              Historial Completo
            </h3>
            <p className="text-slate-300">
              Todos los debates se guardan organizados por tema
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
  )
}
