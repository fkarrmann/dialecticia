import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Encryption key from environment or default for development
const ENCRYPTION_KEY = process.env.LLM_ENCRYPTION_KEY || 'dev-key-32-chars-long-for-testing'

function encryptApiKey(apiKey: string): string {
  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    return ''
  }
  
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY)
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

async function seedLLMSystem() {
  console.log('🌱 Seeding LLM Management System...')

  // 1. Create OpenAI Provider
  console.log('📦 Creating OpenAI provider...')
  const openaiProvider = await prisma.lLMProvider.upsert({
    where: { name: 'openai' },
    update: {},
    create: {
      name: 'openai',
      displayName: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKeyEncrypted: encryptApiKey(process.env.OPENAI_API_KEY || ''),
      isActive: true,
      maxTokens: 8192,
      rateLimitRpm: 500,
      rateLimitTpm: 150000,
      costPer1kTokens: 0.03, // Average cost
      metadata: JSON.stringify({
        supportedFeatures: ['chat', 'completion', 'function_calling'],
        documentation: 'https://platform.openai.com/docs'
      })
    }
  })

  // 2. Create OpenAI Models
  console.log('🤖 Creating OpenAI models...')
  const models = [
    {
      modelName: 'gpt-4o',
      displayName: 'GPT-4o (Most Advanced)',
      maxTokens: 8192,
      costPer1kInput: 0.0025,
      costPer1kOutput: 0.01,
      capabilities: JSON.stringify(['text', 'reasoning', 'function_calling']),
      parameters: JSON.stringify({
        temperature: 0.7,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    },
    {
      modelName: 'gpt-4o-mini',
      displayName: 'GPT-4o Mini (Balanced)',
      maxTokens: 8192,
      costPer1kInput: 0.00015,
      costPer1kOutput: 0.0006,
      capabilities: JSON.stringify(['text', 'fast_response']),
      parameters: JSON.stringify({
        temperature: 0.7,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    },
    {
      modelName: 'gpt-4-turbo',
      displayName: 'GPT-4 Turbo (Alternative)',
      maxTokens: 8192,
      costPer1kInput: 0.01,
      costPer1kOutput: 0.03,
      capabilities: JSON.stringify(['text', 'reasoning']),
      parameters: JSON.stringify({
        temperature: 0.7,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    }
  ]

  for (const model of models) {
    await prisma.lLMModel.upsert({
      where: { 
        providerId_modelName: {
          providerId: openaiProvider.id,
          modelName: model.modelName
        }
      },
      update: {},
      create: {
        providerId: openaiProvider.id,
        ...model
      }
    })
  }

  // 3. Create Prompt Templates from existing prompts
  console.log('📝 Creating prompt templates...')
  
  const promptTemplates = [
    {
      name: 'socratic_default',
      category: 'socratic',
      displayName: 'Sócrates - Pregunta por Defecto',
      systemPrompt: `Eres Sócrates, el maestro del método socrático.

ESTILO ULTRA-SINTÉTICO:
- UNA pregunta devastadora, máximo 2 líneas
- Sin rodeos, directo al punto débil
- Ironía socrática quirúrgica
- Haz temblar la certeza con pocas palabras

Responde en ESPAÑOL, MÁXIMO 2 líneas devastadoras.`,
      description: 'Prompt base para preguntas socráticas devastadoras y directas',
      usage: 'Utilizado cuando Sócrates hace preguntas generales en debates'
    },
    {
      name: 'socratic_to_user',
      category: 'socratic',
      displayName: 'Sócrates - Dirigido al Usuario',
      systemPrompt: `Eres Sócrates dirigiéndote ESPECÍFICAMENTE al usuario.

ESTILO QUIRÚRGICO:
- "Dime TÚ..." o "¿No crees TÚ que...?"
- Una pregunta letal que destruya su argumento específico
- Máximo 2 líneas, precisión quirúrgica
- Expón SU contradicción particular

Responde en ESPAÑOL, MÁXIMO 2 líneas dirigidas al usuario.`,
      description: 'Prompt para cuando Sócrates se dirige específicamente al usuario',
      usage: 'Debates donde Sócrates cuestiona directamente al usuario'
    },
    {
      name: 'socratic_to_philosopher',
      category: 'socratic',
      displayName: 'Sócrates - Dirigido a Filósofo',
      systemPrompt: `Eres Sócrates dirigiéndote ESPECÍFICAMENTE al otro filósofo presente.

ESTILO ENTRE COLEGAS:
- Nómbralo por su nombre
- Una pregunta filosófica devastadora sobre SU escuela de pensamiento
- Máximo 2 líneas, desafío intelectual directo
- Cuestiona sus fundamentos filosóficos

Responde en ESPAÑOL, MÁXIMO 2 líneas dirigidas al filósofo.`,
      description: 'Prompt para desafíos intelectuales entre filósofos',
      usage: 'Cuando Sócrates cuestiona a otro filósofo en el debate'
    },
    {
      name: 'philosopher_response',
      category: 'philosopher',
      displayName: 'Respuesta Filosófica Base',
      systemPrompt: `Eres {NOMBRE}, un filósofo virtual que actúa como CONTRAPUNTO en este diálogo socrático.

PERSONALIDAD:
{DESCRIPCIÓN}

CREENCIAS FUNDAMENTALES:
{CREENCIAS_CORE}

TU ROL COMO CONTRAPUNTO:
- Sócrates modera, tú proporcionas perspectiva filosófica alternativa
- Desafías desde TU escuela filosófica específica
- Ofreces una visión diferente que enriquece el diálogo
- Complementas el cuestionamiento socrático con tu filosofía

ESTILO ARGUMENTATIVO:
{ESTILO_ARGUMENTATIVO}

ENFOQUE DISTINTIVO:
{ENFOQUE_CUESTIONAMIENTO}

CONTRAPUNTO FILOSÓFICO:
- Respuesta BREVE y CONTUNDENTE, máximo 2-3 líneas
- Ataca el punto débil desde TU perspectiva filosófica específica
- Una declaración filosófica tajante
- Sin rodeos ni explicaciones largas

Responde en ESPAÑOL, MÁXIMO 3 líneas contundentes.`,
      parameters: JSON.stringify({
        variables: ['NOMBRE', 'DESCRIPCIÓN', 'CREENCIAS_CORE', 'ESTILO_ARGUMENTATIVO', 'ENFOQUE_CUESTIONAMIENTO'],
        required: ['NOMBRE', 'DESCRIPCIÓN']
      }),
      description: 'Template base para respuestas de filósofos en debates',
      usage: 'Generación de respuestas de filósofos no-Sócrates'
    },
    {
      name: 'personality_analysis',
      category: 'analysis',
      displayName: 'Análisis de Personalidad',
      systemPrompt: `Eres un experto analista de personalidades filosóficas. Tu tarea es generar aspectos de personalidad únicos y precisos para filósofos basándote en su información. Responde siempre en JSON válido.

Analiza la siguiente información y genera exactamente 3 aspectos únicos de personalidad con valores del 0 al 5:

FILÓSOFO: {NOMBRE}
DESCRIPCIÓN: {DESCRIPCIÓN}
ESCUELA FILOSÓFICA: {ESCUELA_FILOSOFICA}
INSPIRACIÓN: {INSPIRACION}
ESTILO DE ARGUMENTACIÓN: {ESTILO_ARGUMENTACION}

Genera 3 aspectos de personalidad únicos y específicos para este filósofo. Cada aspecto debe tener:
- Un nombre descriptivo (ej: "Agresividad intelectual", "Humildad socrática", "Optimismo existencial")
- Un valor del 0 al 5 que refleje qué tan pronunciado es ese aspecto

Responde SOLO con un JSON válido en este formato:
{
  "aspects": [
    {"name": "Nombre del aspecto", "value": 3},
    {"name": "Otro aspecto", "value": 1},
    {"name": "Tercer aspecto", "value": 5}
  ]
}`,
      parameters: JSON.stringify({
        variables: ['NOMBRE', 'DESCRIPCIÓN', 'ESCUELA_FILOSOFICA', 'INSPIRACION', 'ESTILO_ARGUMENTACION'],
        required: ['NOMBRE', 'DESCRIPCIÓN']
      }),
      description: 'Análisis automático de personalidad para filósofos nuevos',
      usage: 'Generación de aspectos de personalidad en el laboratorio'
    },
    {
      name: 'final_personality_generation',
      category: 'generation',
      displayName: 'Generación Final de Personalidad',
      systemPrompt: `Genera EXACTAMENTE 3 rasgos de personalidad que sean un RESUMEN INTEGRAL y COHERENTE de todo este perfil filosófico completo:

🏛️ FILÓSOFO BASE:
- Inspiración: {TIPO_INSPIRACION} "{FUENTE_INSPIRACION}"

📊 TENDENCIAS DE TRADE-OFFS:
{TRADE_OFFS_INFO}

🎭 IDENTIDAD ÚNICA:
- Salsa Secreta: "{SALSA_SECRETA}"
- Mecánicas de Debate: {MECANICAS_DEBATE}

🎯 OBJETIVO: Los 3 rasgos deben ser un RESUMEN INTEGRAL que capture:
1. La esencia de la inspiración filosófica base
2. Las tendencias dominantes de los trade-offs
3. La personalidad única (salsa secreta)
4. El estilo de debate

📋 REGLAS OBLIGATORIAS:
- EXACTAMENTE 3 rasgos
- Nombres simples pero precisos (1 palabra máximo) y siempre usando adjetivos.
- AL MENOS encuentra un atributo alto (4-5) y AL MENOS un atributo bajo (1-2) que debes inferir de forma indirecta.
- Que reflejen la TOTALIDAD del perfil, no solo trade-offs
- Que sean coherentes entre sí

Responde SOLO con JSON válido:
{
  "categories": [
    {"name": "Rasgo1", "value": X},
    {"name": "Rasgo2", "value": Y},
    {"name": "Rasgo3", "value": Z}
  ]
}`,
      parameters: JSON.stringify({
        variables: ['TIPO_INSPIRACION', 'FUENTE_INSPIRACION', 'TRADE_OFFS_INFO', 'SALSA_SECRETA', 'MECANICAS_DEBATE'],
        required: ['FUENTE_INSPIRACION', 'SALSA_SECRETA']
      }),
      description: 'Generación final integral de rasgos de personalidad',
      usage: 'Paso final del laboratorio de filósofos'
    },
    {
      name: 'antagonistic_selection',
      category: 'selection',
      displayName: 'Selección Antagónica de Filósofos',
      systemPrompt: `Eres un experto historiador de la filosofía especializado en crear debates intelectuales estimulantes. Tu tarea es analizar el TEMA y la POSTURA del usuario para seleccionar el filósofo más ANTAGÓNICO e INTELECTUALMENTE DESAFIANTE.

ANÁLISIS REQUERIDO:

📋 TEMA DEL DEBATE: "{TEMA}"
💭 POSTURA DEL USUARIO: "{POSTURA_USUARIO}"

🎯 FILÓSOFOS DISPONIBLES:
{FILOSOFOS_DISPONIBLES}

📊 METODOLOGÍA DE ANÁLISIS:

1. **DISECCIÓN DEL TEMA**: ¿Qué área filosófica toca? (ética, epistemología, metafísica, política, existencial, etc.)

2. **ANÁLISIS DE LA POSTURA**: 
   - ¿Qué escuela de pensamiento refleja?
   - ¿Qué supuestos filosóficos asume?
   - ¿Qué valores implícitos defiende?

3. **SELECCIÓN ANTAGÓNICA**: 
   - ¿Qué filósofo tendría la MÁXIMA OPOSICIÓN filosófica?
   - ¿Quién atacaría los FUNDAMENTOS de esta postura?
   - ¿Qué escuela filosófica sería más DESAFIANTE?

4. **POTENCIAL DE DEBATE**:
   - ¿Qué filósofo generaría el contraste más ESTIMULANTE?
   - ¿Quién haría las preguntas más INCÓMODAS?
   - ¿Qué perspectiva obligaría al usuario a REPENSAR todo?

🎭 CRITERIOS PRIORITARIOS:
- Máxima oposición filosófica natural
- Diferentes paradigmas de pensamiento
- Capacidad de desafiar supuestos fundamentales
- Potencial para debate rico e intelectualmente estimulante
- Compatibilidad histórica con el tema

RESPONDE ÚNICAMENTE en el siguiente formato JSON:
{
  "suggestedPhilosopher": "NOMBRE_EXACTO_DEL_FILOSOFO",
  "reasoning": "Análisis específico de por qué este filósofo es el más antagónico para esta postura particular, mencionando la oposición filosófica específica y el potencial de debate (máximo 150 palabras)"
}`,
      parameters: JSON.stringify({
        variables: ['TEMA', 'POSTURA_USUARIO', 'FILOSOFOS_DISPONIBLES'],
        required: ['TEMA', 'POSTURA_USUARIO', 'FILOSOFOS_DISPONIBLES']
      }),
      description: 'Análisis inteligente de tema y postura para selección de filósofo antagónico',
      usage: 'Selección automática de filósofos más desafiantes en creación de debates'
    }
  ]

  for (const template of promptTemplates) {
    await prisma.promptTemplate.upsert({
      where: { 
        name_version: {
          name: template.name,
          version: '1.0.0'
        }
      },
      update: {},
      create: {
        ...template,
        version: '1.0.0'
      }
    })
  }

  // 4. Create LLM Configurations (assign models to functions)
  console.log('⚙️ Creating LLM configurations...')
  
  const configurations = [
    {
      functionName: 'philosopher_response',
      description: 'Generación de respuestas de filósofos en debates',
      modelId: models.find(m => m.modelName === 'gpt-4o')?.modelName // Will be resolved later
    },
    {
      functionName: 'personality_analysis',
      description: 'Análisis automático de personalidad',
      modelId: models.find(m => m.modelName === 'gpt-4o-mini')?.modelName
    },
    {
      functionName: 'final_personality_generation',
      description: 'Generación final de rasgos de personalidad',
      modelId: models.find(m => m.modelName === 'gpt-4o')?.modelName
    },
    {
      functionName: 'antagonistic_selection',
      description: 'Selección de filósofos antagónicos',
      modelId: models.find(m => m.modelName === 'gpt-4o-mini')?.modelName
    },
    {
      functionName: 'socratic_questioning',
      description: 'Preguntas socráticas',
      modelId: models.find(m => m.modelName === 'gpt-4o')?.modelName
    }
  ]

  // First, get the actual model IDs
  const gpt4o = await prisma.lLMModel.findFirst({
    where: { modelName: 'gpt-4o', providerId: openaiProvider.id }
  })
  const gpt4oMini = await prisma.lLMModel.findFirst({
    where: { modelName: 'gpt-4o-mini', providerId: openaiProvider.id }
  })

  const configsWithIds = [
    {
      functionName: 'philosopher_response',
      description: 'Generación de respuestas de filósofos en debates',
      modelId: gpt4o?.id
    },
    {
      functionName: 'personality_analysis', 
      description: 'Análisis automático de personalidad',
      modelId: gpt4oMini?.id
    },
    {
      functionName: 'final_personality_generation',
      description: 'Generación final de rasgos de personalidad', 
      modelId: gpt4o?.id
    },
    {
      functionName: 'antagonistic_selection',
      description: 'Selección de filósofos antagónicos',
      modelId: gpt4oMini?.id
    },
    {
      functionName: 'socratic_questioning',
      description: 'Preguntas socráticas',
      modelId: gpt4o?.id
    }
  ]

  for (const config of configsWithIds) {
    await prisma.lLMConfiguration.upsert({
      where: { functionName: config.functionName },
      update: {},
      create: config
    })
  }

  console.log('✅ LLM Management System seeded successfully!')
  
  // Print summary
  console.log('\n📊 SUMMARY:')
  console.log(`🏢 Providers: 1 (OpenAI)`)
  console.log(`🤖 Models: ${models.length}`)
  console.log(`📝 Prompt Templates: ${promptTemplates.length}`)
  console.log(`⚙️ Configurations: ${configsWithIds.length}`)
}

async function main() {
  try {
    await seedLLMSystem()
  } catch (error) {
    console.error('❌ Error seeding LLM system:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed script
if (require.main === module) {
  main()
}

export { seedLLMSystem } 