import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verificación simple sin auth para debug
    const counts = await Promise.all([
      prisma.philosopher.count(),
      prisma.lLMProvider.count(),
      prisma.lLMModel.count(),
      prisma.promptTemplate.count(),
      prisma.user.count()
    ]);

    const [philosophers, providers, models, prompts, users] = counts;

    return NextResponse.json({
      status: 'ok',
      counts: {
        philosophers,
        providers,
        models,
        prompts,
        users
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json(
      { error: 'Database check failed', details: error },
      { status: 500 }
    );
  }
} 