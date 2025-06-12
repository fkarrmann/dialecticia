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

    console.log('🚀 Inicializando sistema LLM desde admin panel...')
    
    const steps = []

    // 1. Verificar conexión a BD
    try {
      await prisma.$connect()
      steps.push({ step: 'database_connection', success: true, message: 'Conexión a PostgreSQL exitosa' })
    } catch (error) {
      steps.push({ step: 'database_connection', success: false, message: `Error: ${error}` })
      throw error
    }

    // 2. Crear proveedores básicos si no existen
    try {
      const existingProviders = await prisma.lLMProvider.count()
      if (existingProviders === 0) {
        await prisma.lLMProvider.create({
          data: {
            name: 'anthropic',
            baseUrl: 'https://api.anthropic.com/v1',
            isActive: true,
          }
        })
        steps.push({ step: 'providers', success: true, message: 'Proveedor Anthropic creado' })
      } else {
        steps.push({ step: 'providers', success: true, message: `${existingProviders} proveedores encontrados` })
      }
    } catch (error) {
      steps.push({ step: 'providers', success: false, message: `Error: ${error}` })
    }

    // 3. Crear modelos básicos si no existen
    try {
      const existingModels = await prisma.lLMModel.count()
      if (existingModels === 0) {
        const anthropicProvider = await prisma.lLMProvider.findFirst({
          where: { name: 'anthropic' }
        })

        if (anthropicProvider) {
          await prisma.lLMModel.create({
            data: {
              name: 'claude-3-5-sonnet',
              providerId: anthropicProvider.id,
              modelIdentifier: 'claude-3-5-sonnet-20241022',
              isActive: true,
            }
          })
          steps.push({ step: 'models', success: true, message: 'Modelo Claude creado' })
        }
      } else {
        steps.push({ step: 'models', success: true, message: `${existingModels} modelos encontrados` })
      }
    } catch (error) {
      steps.push({ step: 'models', success: false, message: `Error: ${error}` })
    }

    // 4. Crear prompts críticos si no existen
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

ESTILO ARGUMENTATIVO:
{ESTILO_ARGUMENTACION}

CONTRAPUNTO FILOSÓFICO:
- Respuesta BREVE y CONTUNDENTE, máximo 2-3 líneas
- Una declaración filosófica tajante

Responde en ESPAÑOL, MÁXIMO 3 líneas contundentes.`,
          isActive: true
        },
        {
          name: 'antagonistic_selection',
          category: 'selection', 
          description: 'Selección de filósofo antagónico',
          template: `Analiza el tema "{TEMA}" y la postura "{POSTURA_USUARIO}" para seleccionar el filósofo más ANTAGÓNICO.

FILÓSOFOS DISPONIBLES:
{FILOSOFOS_DISPONIBLES}

Responde en JSON:
{
  "suggestedPhilosopher": "NOMBRE_EXACTO",
  "reasoning": "Por qué es antagónico (máximo 150 palabras)"
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
      steps.push({ step: 'prompts', success: true, message: `${createdPrompts} prompts críticos creados` })
    } catch (error) {
      steps.push({ step: 'prompts', success: false, message: `Error: ${error}` })
    }

    // 5. Crear configuración por defecto si no existe
    try {
      const existingConfigs = await prisma.lLMConfiguration.count({
        where: { isActive: true }
      })

      if (existingConfigs === 0) {
        const model = await prisma.lLMModel.findFirst({
          where: { isActive: true },
          include: { provider: true }
        })

        if (model) {
          await prisma.lLMConfiguration.create({
            data: {
              name: 'Default Configuration',
              providerId: model.providerId,
              modelId: model.id,
              maxTokens: 1000,
              temperature: 0.7,
              isActive: true
            }
          })
          steps.push({ step: 'configurations', success: true, message: 'Configuración por defecto creada' })
        } else {
          steps.push({ step: 'configurations', success: false, message: 'No hay modelos disponibles' })
        }
      } else {
        steps.push({ step: 'configurations', success: true, message: `${existingConfigs} configuraciones encontradas` })
      }
    } catch (error) {
      steps.push({ step: 'configurations', success: false, message: `Error: ${error}` })
    }

    // Verificación final
    const summary = {
      providers: await prisma.lLMProvider.count(),
      models: await prisma.lLMModel.count(),
      prompts: await prisma.promptTemplate.count(),
      configurations: await prisma.lLMConfiguration.count({ where: { isActive: true } })
    }

    const successfulSteps = steps.filter(s => s.success).length
    const totalSteps = steps.length

    console.log(`✅ Inicialización completada: ${successfulSteps}/${totalSteps} pasos exitosos`)

    return NextResponse.json({
      success: true,
      completed: successfulSteps === totalSteps,
      steps,
      summary,
      message: `Sistema inicializado: ${successfulSteps}/${totalSteps} componentes configurados correctamente`
    })

  } catch (error) {
    console.error('❌ Error inicializando sistema:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 