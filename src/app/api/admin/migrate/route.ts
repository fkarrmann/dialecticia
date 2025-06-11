import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Este endpoint es TEMPORAL para migración - eliminar después del uso
export async function POST(request: NextRequest) {
  try {
    // Verificación de seguridad básica
    const body = await request.json();
    const { action, adminKey } = body;
    
    // Verificar clave admin (usar algo seguro en producción)
    if (adminKey !== 'DIALECTICIA-MIGRATION-2024-SECURE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = new PrismaClient();

    if (action === 'test-connection') {
      // Solo probar conexión
      await prisma.$connect();
      const userCount = await prisma.user.count();
      await prisma.$disconnect();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Conexión exitosa',
        currentUsers: userCount 
      });
    }

    if (action === 'run-migration') {
      // Datos hardcodeados de tu SQLite (los datos críticos)
      console.log('🚀 Iniciando migración desde Vercel...');

      // 1. Crear LLM Providers
      const providers = [
        {
          name: 'openai',
          baseUrl: 'https://api.openai.com/v1',
          isActive: true
        },
        {
          name: 'anthropic',
          baseUrl: 'https://api.anthropic.com',
          isActive: true
        }
      ];

      for (const provider of providers) {
        await prisma.lLMProvider.upsert({
          where: { name: provider.name },
          update: {},
          create: provider
        });
      }

      // 2. Crear LLM Models
      const openaiProvider = await prisma.lLMProvider.findUnique({ where: { name: 'openai' } });
      const anthropicProvider = await prisma.lLMProvider.findUnique({ where: { name: 'anthropic' } });

      const models = [
        {
          name: 'GPT-4o (Most Advanced)',
          providerId: openaiProvider!.id,
          modelIdentifier: 'gpt-4o',
          isActive: true,
          maxTokens: 4096,
          costPer1kTokens: 5.0
        },
        {
          name: 'GPT-4o Mini (Fast & Efficient)',
          providerId: openaiProvider!.id,
          modelIdentifier: 'gpt-4o-mini',
          isActive: true,
          maxTokens: 4096,
          costPer1kTokens: 0.15
        },
        {
          name: 'Claude 3.5 Sonnet (Latest)',
          providerId: anthropicProvider!.id,
          modelIdentifier: 'claude-3-5-sonnet-20241022',
          isActive: true,
          maxTokens: 8000,
          costPer1kTokens: 3.0
        },
        {
          name: 'Claude Sonnet 4 (Real)',
          providerId: anthropicProvider!.id,
          modelIdentifier: 'claude-sonnet-4-20250514',
          isActive: true,
          maxTokens: 8000,
          costPer1kTokens: 3.0
        }
      ];

      for (const model of models) {
        await prisma.lLMModel.upsert({
          where: {
            providerId_modelIdentifier: {
              providerId: model.providerId,
              modelIdentifier: model.modelIdentifier
            }
          },
          update: {},
          create: model
        });
      }

      // 3. Crear Usuario Admin
      await prisma.user.upsert({
        where: { email: 'fkarrmann@gmail.com' },
        update: {},
        create: {
          email: 'fkarrmann@gmail.com',
          name: 'Federico Karrmann',
          isAdmin: true
        }
      });

      // 4. Crear códigos de invitación
      const invitationCodes = [
        {
          code: 'DIALECTICIA-LAUNCH-2024',
          description: 'Código de lanzamiento principal',
          maxUses: 100,
          expiresAt: new Date('2025-12-31')
        },
        {
          code: 'ADMIN-ACCESS-FEDERICO',
          description: 'Acceso especial para administrador',
          maxUses: 5,
          expiresAt: new Date('2025-12-31')
        }
      ];

      for (const codeData of invitationCodes) {
        await prisma.invitationCode.upsert({
          where: { code: codeData.code },
          update: {},
          create: codeData
        });
      }

      await prisma.$disconnect();

      return NextResponse.json({ 
        success: true, 
        message: 'Migración básica completada',
        migrated: {
          providers: providers.length,
          models: models.length,
          admin: 1,
          codes: invitationCodes.length
        }
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

  } catch (error) {
    console.error('Error en migración:', error);
    return NextResponse.json({ 
      error: 'Error en migración', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 