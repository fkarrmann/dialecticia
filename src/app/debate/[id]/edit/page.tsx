import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import EditDebateForm from '@/components/debate/EditDebateForm'

interface EditDebatePageProps {
  params: Promise<{ id: string }>
}

export default async function EditDebatePage({ params }: EditDebatePageProps) {
  const { id } = await params
  
  const debate = await prisma.debate.findUnique({
    where: { id },
    include: {
      participants: {
        include: {
          philosopher: true,
        },
      },
    },
  })

  if (!debate) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">
            Editar Debate
          </h1>
          
          <EditDebateForm debate={debate} />
        </div>
      </div>
    </div>
  )
} 