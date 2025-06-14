import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando códigos de invitación admin...')
    
    // Obtener todos los códigos de invitación
    const invitationCodes = await prisma.invitationCode.findMany({
      include: {
        sessions: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Obtener usuarios admin
    const adminUsers = await prisma.user.findMany({
      where: { isAdmin: true }
    })
    
    console.log(`📊 Encontrados: ${invitationCodes.length} códigos, ${adminUsers.length} admins`)
    
    return NextResponse.json({
      success: true,
      totalCodes: invitationCodes.length,
      totalAdmins: adminUsers.length,
      invitationCodes: invitationCodes.map(code => ({
        id: code.id,
        code: code.code,
        description: code.description,
        isActive: code.isActive,
        maxUses: code.maxUses,
        currentUses: code.currentUses,
        sessionsCount: code.sessions.length,
        users: code.sessions.map(session => ({
          name: session.user.name,
          email: session.user.email,
          isAdmin: session.user.isAdmin,
          isActive: session.isActive
        }))
      })),
      adminUsers: adminUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      })),
      instructions: {
        step1: "Ve a https://dialecticia.vercel.app/login",
        step2: "Usa uno de los códigos de invitación listados arriba",
        step3: "Si tu usuario no es admin, será promovido automáticamente",
        step4: "Luego ve a https://dialecticia.vercel.app/admin/llm-management"
      }
    })
    
  } catch (error) {
    console.error('❌ Error verificando admin codes:', error)
    return NextResponse.json({
      success: false,
      error: 'Error verificando códigos de administración',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 