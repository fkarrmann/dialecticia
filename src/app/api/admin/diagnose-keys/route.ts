import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      diagnosis: {
        environment: {
          OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
          ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
          LLM_ENCRYPTION_KEY: !!process.env.LLM_ENCRYPTION_KEY,
          DATABASE_POSTGRES_PRISMA_URL: !!process.env.DATABASE_POSTGRES_PRISMA_URL
        },
        providers: [] as any[],
        nextSteps: [] as string[]
      }
    };

    // Verificar proveedores en DB
    const providers = await prisma.lLMProvider.findMany({
      select: {
        name: true,
        isActive: true,
        apiKeyEncrypted: true
      }
    });

    results.diagnosis.providers = providers.map(p => ({
      name: p.name,
      isActive: p.isActive,
      hasEncryptedKey: !!p.apiKeyEncrypted
    }));

    // Generar recomendaciones
    if (!process.env.LLM_ENCRYPTION_KEY) {
      results.diagnosis.nextSteps.push('🔧 CRÍTICO: Agregar LLM_ENCRYPTION_KEY en Vercel Environment Variables');
    }

    const providersWithoutKeys = providers.filter(p => !p.apiKeyEncrypted);
    if (providersWithoutKeys.length > 0) {
      results.diagnosis.nextSteps.push(`🔐 Faltan API keys encriptadas para: ${providersWithoutKeys.map(p => p.name).join(', ')}`);
    }

    if (results.diagnosis.environment.ANTHROPIC_API_KEY && !providers.find(p => p.name === 'anthropic' && p.apiKeyEncrypted)) {
      results.diagnosis.nextSteps.push('⚡ API key de Anthropic disponible pero no encriptada en DB');
    }

    if (results.diagnosis.environment.OPENAI_API_KEY && !providers.find(p => p.name.toLowerCase().includes('openai') && p.apiKeyEncrypted)) {
      results.diagnosis.nextSteps.push('⚡ API key de OpenAI disponible pero no encriptada en DB');
    }

    if (results.diagnosis.nextSteps.length === 0) {
      results.diagnosis.nextSteps.push('✅ Sistema configurado correctamente');
    }

    return NextResponse.json(results);

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message,
      diagnosis: null
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 