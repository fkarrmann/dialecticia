import { getCurrentSession } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { redirect } from 'next/navigation'
import InvitationManager from '@/components/admin/InvitationManager'

const prisma = new PrismaClient()

export default async function AdminInvitationsPage() {
  // Verificar autenticación (básica - en un sistema real habría roles)
  const session = await getCurrentSession()
  if (!session) {
    redirect('/login')
  }

  // Obtener códigos de invitación
  const invitationCodes = await prisma.invitationCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      sessions: {
        include: {
          user: true
        }
      }
    }
  })

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Gestión de Invitaciones
          </h1>
          <p className="text-slate-400">
            Administra códigos de invitación y sesiones de usuarios
          </p>
        </div>

        <InvitationManager initialCodes={invitationCodes} currentUser={session.user} />
      </div>
    </div>
  )
} 