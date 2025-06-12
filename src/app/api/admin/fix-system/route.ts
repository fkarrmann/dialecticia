import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    console.log('🔧 Auto-Fix System - Iniciando reparación automática...')
    
    const fixes = {
      providers: { attempted: false, success: false, details: '' },
      models: { attempted: false, success: false, details: '' },
      prompts: { attempted: false, success: false, details: '' },
      configurations: { attempted: false, success: false, details: '' }
    }

    // 1. Verificar y crear proveedores básicos
    fixes.providers.attempted = true
    try {
      const existingProviders = await prisma.lLMProvider.count()
      
      if (existingProviders === 0) {
        console.log('🏗️ Creating basic providers...')
        
        // Crear OpenAI Provider
        await prisma.lLMProvider.create({
          data: {
            name: 'openai',
            baseUrl: 'https://api.openai.com/v1',
            isActive: true,
            maxTokens: 8000,
            rateLimitRpm: 3000,
            rateLimitTpm: 250000,
            costPer1kTokens: 0.002
          }
        })

        // Crear Anthropic Provider
        await prisma.lLMProvider.create({
          data: {
            name: 'anthropic',
            baseUrl: 'https://api.anthropic.com/v1',
            isActive: true,
            maxTokens: 200000,
            rateLimitRpm: 50,
            rateLimitTpm: 40000,
            costPer1kTokens: 0.003
          }
        })

        fixes.providers.success = true
        fixes.providers.details = 'Created OpenAI and Anthropic providers'
      } else {
        fixes.providers.success = true
        fixes.providers.details = `Found ${existingProviders} existing providers`
      }
    } catch (error) {
      fixes.providers.details = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Error fixing providers:', error)
    }

    // 2. Verificar y crear modelos básicos
    fixes.models.attempted = true
    try {
      const existingModels = await prisma.lLMModel.count()
      
      if (existingModels === 0) {
        console.log('🤖 Creating basic models...')
        
        const openaiProvider = await prisma.lLMProvider.findFirst({ where: { name: 'openai' } })
        const anthropicProvider = await prisma.lLMProvider.findFirst({ where: { name: 'anthropic' } })

        if (openaiProvider) {
          await prisma.lLMModel.create({
            data: {
              name: 'gpt-4o-mini',
              providerId: openaiProvider.id,
              modelIdentifier: 'gpt-4o-mini',
              isActive: true,
              maxTokens: 128000,
              costPer1kInput: 0.15,
              costPer1kOutput: 0.6
            }
          })
        }

        if (anthropicProvider) {
          await prisma.lLMModel.create({
            data: {
              name: 'claude-3-5-sonnet',
              providerId: anthropicProvider.id,
              modelIdentifier: 'claude-3-5-sonnet-20241022',
              isActive: true,
              maxTokens: 200000,
              costPer1kInput: 3.0,
              costPer1kOutput: 15.0
            }
          })
        }

        fixes.models.success = true
        fixes.models.details = 'Created basic OpenAI and Anthropic models'
      } else {
        fixes.models.success = true
        fixes.models.details = `Found ${existingModels} existing models`
      }
    } catch (error) {
      fixes.models.details = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Error fixing models:', error)
    }

    // 3. Verificar y crear prompts críticos
    fixes.prompts.attempted = true
    try {
      const criticalPrompts = [
        {
          name: 'philosopher_chat_system',
          category: 'chat',
          description: 'Prompt principal para diálogos filosóficos',
          template: `Eres {NOMBRE}, un filósofo virtual que actúa como CONTRAPUNTO en este diálogo socrático.

PERSONALIDAD:
{DESCRIPCIÓN}

CREENCIAS FUNDAMENTALES:
{CREENCIAS_CENTRALES}

TU ROL COMO CONTRAPUNTO:
- Desafías desde TU escuela filosófica específica
- Ofreces una visión diferente que enriquece el diálogo
- Usas tu personalidad única para argumentar

ESTILO ARGUMENTATIVO:
{ESTILO_ARGUMENTACION}

ENFOQUE DISTINTIVO:
{ENFOQUE_CUESTIONAMIENTO}

CONTRAPUNTO FILOSÓFICO:
- Respuesta BREVE y CONTUNDENTE, máximo 2-3 líneas
- Ataca el punto débil desde TU perspectiva filosófica específica
- Una declaración filosófica tajante
- Sin rodeos ni explicaciones largas

Responde en ESPAÑOL, MÁXIMO 3 líneas contundentes.`,
          isActive: true
        },
        {
          name: 'antagonistic_selection',
          category: 'selection',
          description: 'Análisis para seleccionar el filósofo más desafiante',
          template: `Eres un experto en filosofía. Analiza el tema "{TEMA}" y la postura "{POSTURA_USUARIO}" para seleccionar el filósofo más ANTAGÓNICO.

FILÓSOFOS DISPONIBLES:
{FILOSOFOS_DISPONIBLES}

Responde ÚNICAMENTE en formato JSON:
{
  "suggestedPhilosopher": "NOMBRE_EXACTO_DEL_FILOSOFO",
  "reasoning": "Análisis de por qué este filósofo es el más antagónico (máximo 150 palabras)"
}`,
          isActive: true
        }
      ]

      let createdPrompts = 0
      for (const promptData of criticalPrompts) {
        const existing = await prisma.promptTemplate.findFirst({
          where: { name: promptData.name }
        })

        if (!existing) {
          await prisma.promptTemplate.create({
            data: promptData
          })
          createdPrompts++
        }
      }

      fixes.prompts.success = true
      fixes.prompts.details = `Created ${createdPrompts} missing critical prompts`
    } catch (error) {
      fixes.prompts.details = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Error fixing prompts:', error)
    }

    // 4. Verificar y crear configuración por defecto
    fixes.configurations.attempted = true
    try {
      const existingConfigs = await prisma.lLMConfiguration.count({ where: { isActive: true } })
      
      if (existingConfigs === 0) {
        console.log('⚙️ Creating default configuration...')
        
        // Buscar un modelo disponible
        const availableModel = await prisma.lLMModel.findFirst({
          where: { isActive: true },
          include: { provider: true }
        })

        if (availableModel) {
          await prisma.lLMConfiguration.create({
            data: {
              name: 'Default Configuration',
              providerId: availableModel.providerId,
              modelId: availableModel.id,
              promptTemplateId: null, // Configuración por defecto
              maxTokens: 1000,
              temperature: 0.7,
              isActive: true
            }
          })

          fixes.configurations.success = true
          fixes.configurations.details = `Created default configuration with ${availableModel.name}`
        } else {
          fixes.configurations.details = 'No models available for configuration'
        }
      } else {
        fixes.configurations.success = true
        fixes.configurations.details = `Found ${existingConfigs} existing configurations`
      }
    } catch (error) {
      fixes.configurations.details = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Error fixing configurations:', error)
    }

    const successfulFixes = Object.values(fixes).filter(f => f.attempted && f.success).length
    const totalAttempts = Object.values(fixes).filter(f => f.attempted).length

    console.log(`✅ Auto-fix completed: ${successfulFixes}/${totalAttempts} successful`)

    return NextResponse.json({
      success: true,
      fixed: successfulFixes,
      total: totalAttempts,
      fixes,
      message: `Auto-fix completed: ${successfulFixes}/${totalAttempts} components fixed successfully`
    })

  } catch (error) {
    console.error('❌ Auto-fix system failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 