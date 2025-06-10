import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth'
import LLMManagementDashboard from '@/components/admin/LLMManagementDashboard'

export default async function LLMManagementPage() {
  const session = await getCurrentSession()
  
  if (!session?.user?.isAdmin) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Gestión de LLM</h1>
            <p className="text-slate-400 mt-2">
              Administra proveedores, modelos, prompts y métricas del sistema de inteligencia artificial
            </p>
          </div>
          
          <LLMManagementDashboard />
        </div>
      </div>
    </div>
  )
} 