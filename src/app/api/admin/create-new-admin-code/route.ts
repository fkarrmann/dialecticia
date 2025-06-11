import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;
    
    if (key !== 'CREATE-ADMIN-CODE-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = new PrismaClient();

    // Crear nuevo código de invitación para admin
    const newAdminCode = await prisma.invitationCode.create({
      data: {
        code: 'FEDERICO-ADMIN-FINAL',
        description: 'Código final de administrador para Federico',
        maxUses: 3,
        currentUses: 0,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
      }
    });

    await prisma.$disconnect();

    return NextResponse.json({ 
      success: true, 
      newCode: newAdminCode.code,
      message: 'Nuevo código creado exitosamente'
    });

  } catch (error) {
    console.error('Error creando código:', error);
    return NextResponse.json({ 
      error: 'Error creando código', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 