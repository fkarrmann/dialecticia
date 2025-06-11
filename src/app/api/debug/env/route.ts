import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    const postgresUrl = process.env.DATABASE_POSTGRES_URL;
    const postgresPrismaUrl = process.env.DATABASE_POSTGRES_PRISMA_URL;
    const nodeEnv = process.env.NODE_ENV;
    
    return NextResponse.json({
      success: true,
      environment: {
        NODE_ENV: nodeEnv,
        DATABASE_URL_EXISTS: !!databaseUrl,
        DATABASE_POSTGRES_URL_EXISTS: !!postgresUrl,
        DATABASE_POSTGRES_PRISMA_URL_EXISTS: !!postgresPrismaUrl,
        USING_VARIABLE: postgresPrismaUrl ? 'DATABASE_POSTGRES_PRISMA_URL' : 
                       postgresUrl ? 'DATABASE_POSTGRES_URL' : 
                       databaseUrl ? 'DATABASE_URL' : 'NONE',
        URL_PREFIX: (postgresPrismaUrl || postgresUrl || databaseUrl)?.substring(0, 20) + '...',
        DATABASE_TYPE: (postgresPrismaUrl || postgresUrl || databaseUrl)?.startsWith('postgres') ? 'PostgreSQL' : 
                      (postgresPrismaUrl || postgresUrl || databaseUrl)?.startsWith('file:') ? 'SQLite' : 
                      'Unknown',
        OPENAI_API_KEY_EXISTS: !!process.env.OPENAI_API_KEY,
        ANTHROPIC_API_KEY_EXISTS: !!process.env.ANTHROPIC_API_KEY
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Error checking environment', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 