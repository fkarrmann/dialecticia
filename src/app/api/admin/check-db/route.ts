import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(request: NextRequest) {
  const prisma = new PrismaClient();
  
  try {
    // Verificaciones rápidas
    const [
      providers,
      models,
      admins,
      codes,
      philosophers,
      templates,
      configs,
      tones
    ] = await Promise.all([
      prisma.lLMProvider.findMany({ select: { name: true, isActive: true, baseUrl: true } }),
      prisma.lLMModel.findMany({ 
        select: { 
          name: true, 
          modelIdentifier: true, 
          isActive: true,
          provider: { select: { name: true } }
        }
      }),
      prisma.user.findMany({ 
        where: { isAdmin: true },
        select: { email: true, name: true, isAdmin: true }
      }),
      prisma.invitationCode.findMany({ 
        select: { code: true, description: true, maxUses: true, currentUses: true, isActive: true }
      }),
      prisma.philosopher.findMany({ 
        select: { name: true, isActive: true, isDefault: true, isPublic: true }
      }),
      prisma.promptTemplate.findMany({ 
        select: { name: true, category: true, isActive: true }
      }),
      prisma.lLMConfiguration.findMany({ 
        select: { 
          name: true, 
          isActive: true,
          model: { select: { name: true } },
          provider: { select: { name: true } }
        }
      }),
      prisma.customTone.findMany({ 
        select: { title: true, isActive: true, usageCount: true }
      })
    ]);

    const summary = {
      providers: providers.length,
      models: models.length,
      admins: admins.length,
      codes: codes.length,
      philosophers: philosophers.length,
      templates: templates.length,
      configs: configs.length,
      tones: tones.length
    };

    return NextResponse.json({
      success: true,
      summary,
      details: {
        providers,
        models,
        admins,
        codes,
        philosophers: philosophers.slice(0, 5), // Solo primeros 5
        templates: templates.slice(0, 5), // Solo primeros 5
        configs,
        tones
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Error checking database', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 