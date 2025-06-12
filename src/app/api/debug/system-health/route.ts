import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🏥 System Health Check - Iniciando diagnóstico completo...')
    
    const health = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: { status: 'unknown', error: null as string | null },
      providersCount: 0,
      modelsCount: 0,
      promptsCount: 0,
      configurationsCount: 0,
      criticalPrompts: { found: [] as string[], missing: [] as string[] },
      apiKeys: {
        OPENAI_API_KEY_EXISTS: !!process.env.OPENAI_API_KEY,
        ANTHROPIC_API_KEY_EXISTS: !!process.env.ANTHROPIC_API_KEY,
        LLM_ENCRYPTION_KEY_EXISTS: !!process.env.LLM_ENCRYPTION_KEY,
        DATABASE_URL_TYPE: process.env.DATABASE_POSTGRES_PRISMA_URL ? 'POSTGRES' : 'OTHER'
      }
    }

    // 1. Test Database Connection
    try {
      await prisma.$connect()
      health.database.status = 'connected'
      console.log('✅ Database connection successful')
    } catch (error) {
      health.database.status = 'error'
      health.database.error = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Database connection failed:', error)
      
      return NextResponse.json({
        success: false,
        healthy: false,
        health,
        issue: 'DATABASE_CONNECTION_FAILED'
      })
    }

    // 2. Count Basic Entities
    try {
      health.providersCount = await prisma.lLMProvider.count()
      health.modelsCount = await prisma.lLMModel.count()
      health.promptsCount = await prisma.promptTemplate.count()
      health.configurationsCount = await prisma.lLMConfiguration.count({ where: { isActive: true } })
      
      console.log(`📊 Counts - Providers: ${health.providersCount}, Models: ${health.modelsCount}, Prompts: ${health.promptsCount}, Configs: ${health.configurationsCount}`)
    } catch (error) {
      console.error('❌ Error counting entities:', error)
      return NextResponse.json({
        success: false,
        healthy: false,
        health,
        issue: 'DATABASE_QUERY_FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // 3. Check Critical Prompts
    const criticalPromptNames = [
      'philosopher_chat_system',
      'personality_analysis', 
      'final_personality_generation',
      'argument_style_generation',
      'core_beliefs_generation',
      'antagonistic_selection'
    ]

    try {
      const existingPrompts = await prisma.promptTemplate.findMany({
        where: {
          name: { in: criticalPromptNames }
        },
        select: { name: true, isActive: true }
      })

      health.criticalPrompts.found = existingPrompts.filter(p => p.isActive).map(p => p.name)
      health.criticalPrompts.missing = criticalPromptNames.filter(name => 
        !existingPrompts.some(p => p.name === name && p.isActive)
      )

      console.log(`📝 Critical prompts - Found: ${health.criticalPrompts.found.length}, Missing: ${health.criticalPrompts.missing.length}`)
      if (health.criticalPrompts.missing.length > 0) {
        console.warn('⚠️ Missing prompts:', health.criticalPrompts.missing)
      }
    } catch (error) {
      console.error('❌ Error checking prompts:', error)
    }

    // 4. Health Assessment
    const hasApiKeys = health.apiKeys.OPENAI_API_KEY_EXISTS || health.apiKeys.ANTHROPIC_API_KEY_EXISTS
    const hasBasicEntities = health.providersCount > 0 && health.modelsCount > 0 && health.configurationsCount > 0
    const hasAllCriticalPrompts = health.criticalPrompts.missing.length === 0
    
    const isHealthy = 
      health.database.status === 'connected' &&
      hasApiKeys &&
      hasBasicEntities &&
      hasAllCriticalPrompts

    console.log(`🏥 Overall system health: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`)

    let mainIssue = null
    if (!hasApiKeys) mainIssue = 'MISSING_API_KEYS'
    else if (!hasBasicEntities) mainIssue = 'MISSING_BASIC_ENTITIES'
    else if (!hasAllCriticalPrompts) mainIssue = 'MISSING_CRITICAL_PROMPTS'

    return NextResponse.json({
      success: true,
      healthy: isHealthy,
      health,
      mainIssue,
      recommendations: {
        needsApiKeys: !hasApiKeys,
        needsBasicSetup: !hasBasicEntities,
        needsPromptsSetup: !hasAllCriticalPrompts,
        missingPrompts: health.criticalPrompts.missing
      }
    })

  } catch (error) {
    console.error('❌ System health check failed:', error)
    return NextResponse.json({
      success: false,
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 