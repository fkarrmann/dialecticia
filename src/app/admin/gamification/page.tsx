import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth'
import PersonalityAspectsManager from '@/components/admin/PersonalityAspectsManager'

export default async function GamificationPage() {
  const session = await getCurrentSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Sistema de Gamificación</h1>
            <p className="text-slate-400 mt-2">
              Gestiona los aspectos de personalidad generados automáticamente por IA para cada filósofo
            </p>
          </div>
          
          <PersonalityAspectsManager />
        </div>
      </div>
    </div>
  )
}