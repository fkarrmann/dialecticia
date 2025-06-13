import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Creando acceso temporal de admin...')
    
    // Generar código único
    const tempCode = `TEMP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    
    // Crear código de invitación temporal con permisos de admin
    const invitationCode = await prisma.invitationCode.create({
      data: {
        code: tempCode,
        description: 'Código temporal para acceso de admin',
        isActive: true,
        maxUses: 1,
        currentUses: 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        createdBy: 'system'
      }
    })
    
    console.log('✅ Código temporal creado:', tempCode)
    
    return NextResponse.json({
      success: true,
      tempCode: tempCode,
      loginUrl: `https://dialecticia.vercel.app/login?code=${tempCode}`,
      expiresAt: invitationCode.expiresAt,
      instructions: [
        '1. Ve a la URL de login proporcionada',
        '2. Ingresa cualquier email (ej: admin@test.com)',
        '3. Se creará automáticamente una sesión de admin',
        '4. Luego podrás acceder a /admin/llm-management'
      ]
    })

  } catch (error) {
    console.error('❌ Error creando código temporal:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create temp admin access', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 