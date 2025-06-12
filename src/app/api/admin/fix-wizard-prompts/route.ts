import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Wizard prompt templates data
const WIZARD_PROMPTS = [
  {
    name: "final_personality_generation",
    description: "Genera el perfil final de personalidad del filósofo basado en todos los datos del wizard",
    template: `Eres un experto en filosofía y psicología que debe crear un perfil integral de personalidad para un filósofo virtual.

DATOS DEL FILÓSOFO:
- Tipo de inspiración: {TIPO_INSPIRACION}
- Fuente de inspiración: {FUENTE_INSPIRACION}
- Enfoque secreto: {SALSA_SECRETA}
- Mecánicas de debate: {MECANICAS_DEBATE}
- Tono de comunicación: {TONO_COMUNICACION}

ANÁLISIS DE TRADE-OFFS:
{TRADE_OFFS_INFO}

INSTRUCCIONES:
Analiza TODA la información proporcionada y genera exactamente 3 categorías de personalidad que capturen la esencia única de este filósofo. Cada categoría debe:

1. Tener un nombre descriptivo (2-4 palabras)
2. Un valor del 1 al 5 que refleje la intensidad de esa característica
3. Estar basada en los trade-offs y el contexto completo

FORMATO DE RESPUESTA (JSON estricto):
{
  "categories": [
    {"name": "Nombre Categoría 1", "value": 3},
    {"name": "Nombre Categoría 2", "value": 4},
    {"name": "Nombre Categoría 3", "value": 2}
  ]
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.`,
    category: "wizard",
    isActive: true
  },
  {
    name: "argument_style_generation", 
    description: "Genera el estilo argumentativo del filósofo basado en sus características",
    template: `Eres un experto en retórica y filosofía. Debes crear un estilo argumentativo único para un filósofo virtual.

CONTEXTO DEL FILÓSOFO:
- Mecánicas de debate: {DEBATE_MECHANICS}
- Fuente de inspiración: {INSPIRATION_SOURCE}
- Enfoque especial: {SECRET_SAUCE}
- Tono de comunicación: {TONO_COMUNICACION}

INSTRUCCIONES:
Crea un estilo argumentativo coherente y distintivo que refleje estos elementos. El estilo debe describir:

1. Cómo estructura sus argumentos
2. Qué técnicas retóricas prefiere
3. Su enfoque para persuadir y debatir
4. Características únicas de su forma de argumentar

FORMATO: Un párrafo de 150-200 palabras que capture el estilo argumentativo distintivo de este filósofo.

Responde directamente con el texto del estilo argumentativo, sin introducción ni formato adicional.`,
    category: "wizard", 
    isActive: true
  },
  {
    name: "core_beliefs_generation",
    description: "Genera las creencias fundamentales del filósofo",
    template: `Eres un experto en filosofía que debe identificar las creencias centrales de un filósofo virtual.

CONTEXTO DEL FILÓSOFO:
- Mecánicas de debate: {DEBATE_MECHANICS}
- Fuente de inspiración: {INSPIRATION_SOURCE}
- Enfoque especial: {SECRET_SAUCE}
- Tono de comunicación: {TONO_COMUNICACION}

INSTRUCCIONES:
Genera exactamente 3 creencias fundamentales que definan la visión del mundo de este filósofo. Cada creencia debe:

1. Ser una declaración filosófica clara y profunda
2. Reflejar los elementos contextuales proporcionados
3. Estar formulada como una convicción personal del filósofo
4. Ser distintiva y memorable

FORMATO DE RESPUESTA (JSON):
[
  "Primera creencia fundamental como declaración directa",
  "Segunda creencia fundamental como declaración directa", 
  "Tercera creencia fundamental como declaración directa"
]

IMPORTANTE: Responde SOLO con el array JSON de strings, sin texto adicional.`,
    category: "wizard",
    isActive: true
  }
]

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing wizard prompts...')
    
    // 1. Import missing wizard prompts
    console.log('📝 Creating wizard prompt templates...')
    const createdPrompts = []
    
    for (const promptData of WIZARD_PROMPTS) {
      const existing = await prisma.promptTemplate.findFirst({
        where: { name: promptData.name }
      })
      
      if (!existing) {
        const created = await prisma.promptTemplate.create({
          data: promptData
        })
        createdPrompts.push(created.name)
        console.log(`✅ Created prompt: ${created.name}`)
      } else {
        console.log(`⚠️ Prompt already exists: ${promptData.name}`)
      }
    }
    
    // 2. Ensure there's an active configuration that can use environment API keys
    console.log('⚙️ Checking LLM configuration...')
    
    // Find or create a working configuration
    let workingConfig = await prisma.lLMConfiguration.findFirst({
      where: { isActive: true },
      include: { provider: true, model: true }
    })
    
    if (!workingConfig) {
      // Create a basic configuration if none exists
      const openaiProvider = await prisma.lLMProvider.findFirst({
        where: { name: 'openai' }
      })
      
      const openaiModel = await prisma.lLMModel.findFirst({
        where: { providerId: openaiProvider?.id }
      })
      
      if (openaiProvider && openaiModel) {
        workingConfig = await prisma.lLMConfiguration.create({
          data: {
            name: 'Wizard Default Config',
            providerId: openaiProvider.id,
            modelId: openaiModel.id,
            promptTemplateId: null, // Default for all prompts
            maxTokens: 1000,
            temperature: 0.7,
            isActive: true
          },
          include: { provider: true, model: true }
        })
        console.log('✅ Created default LLM configuration')
      }
    }
    
    // 3. Verify wizard prompts now exist
    const wizardPrompts = await prisma.promptTemplate.findMany({
      where: {
        name: {
          in: ['final_personality_generation', 'argument_style_generation', 'core_beliefs_generation']
        },
        isActive: true
      }
    })
    
    console.log(`📊 Wizard prompts active: ${wizardPrompts.length}/3`)
    
    // 4. Test configuration lookup
    const finalGenConfig = await prisma.lLMConfiguration.findFirst({
      where: { 
        isActive: true 
      },
      include: {
        provider: true,
        model: true
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Wizard prompts fixed successfully',
      details: {
        promptsCreated: createdPrompts,
        promptsActive: wizardPrompts.length,
        configurationFound: !!finalGenConfig,
        configurationDetails: finalGenConfig ? {
          name: finalGenConfig.name,
          provider: finalGenConfig.provider.name,
          model: finalGenConfig.model.name,
          hasApiKeyInEnv: finalGenConfig.provider.name === 'openai' ? !!process.env.OPENAI_API_KEY : 
                         finalGenConfig.provider.name === 'anthropic' ? !!process.env.ANTHROPIC_API_KEY : false
        } : null
      }
    })
    
  } catch (error) {
    console.error('❌ Error fixing wizard prompts:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 