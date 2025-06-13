import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Quick Login: Generando URL de acceso directo...')
    
    // Generar código único para acceso directo
    const quickCode = `QUICK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    
    // Crear código de invitación temporal con permisos de admin
    const invitationCode = await prisma.invitationCode.create({
      data: {
        code: quickCode,
        description: 'Código de acceso rápido para admin',
        isActive: true,
        maxUses: 1,
        currentUses: 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        createdBy: 'quick-system'
      }
    })
    
    console.log('✅ Código de acceso rápido creado:', quickCode)
    
    const loginUrl = `https://dialecticia.vercel.app/login?code=${quickCode}`
    
    return NextResponse.json({
      success: true,
      message: 'Código de acceso rápido generado',
      quickCode: quickCode,
      loginUrl: loginUrl,
      instructions: [
        '1. Haz clic en el loginUrl o cópialo en tu navegador',
        '2. Ingresa cualquier nombre y email',
        '3. Se creará automáticamente una sesión de admin',
        '4. Luego ve a /admin/llm-management'
      ],
      expiresAt: invitationCode.expiresAt
    })
    
  } catch (error) {
    console.error('❌ Error en quick login:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 