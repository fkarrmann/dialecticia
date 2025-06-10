import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addFieldGenerationPrompts() {
  console.log('🌱 Agregando prompts de generación de campos...')

  try {
    // Buscar un modelo activo (preferentemente Claude)
    const model = await prisma.lLMModel.findFirst({
      where: { 
        isActive: true,
        modelName: { contains: 'claude' }
      }
    })

    if (!model) {
      throw new Error('No se encontró un modelo LLM activo')
    }

    console.log(`✅ Usando modelo: ${model.displayName}`)

    // 1. Prompt para generar argumentStyle
    const argumentStylePrompt = await prisma.promptTemplate.upsert({
      where: { name_version: { name: 'argument_style_generation', version: '1.0.0' } },
      update: {
        systemPrompt: `Eres un experto en filosofía y debate que debe generar un estilo argumentativo específico para un filósofo.

INFORMACIÓN DEL FILÓSOFO:
- Mecánicas de Debate: {DEBATE_MECHANICS}
- Inspiración: {INSPIRATION_SOURCE}
- Salsa Secreta: {SECRET_SAUCE}

Tu tarea es generar una descripción del ESTILO ARGUMENTATIVO que defina cómo este filósofo específico aborda los debates y construye sus argumentos.

REQUISITOS:
1. Máximo 150 caracteres
2. Describe el MÉTODO específico que usa
3. Integra sutilmente elementos de su inspiración
4. Refleja sus mecánicas de debate preferidas
5. Usa un tono profesional pero accesible

EJEMPLOS DE FORMATO:
- "Estilo socrático moderno: Combina preguntas incisivas con análisis pragmático para desafiar suposiciones arraigadas"
- "Enfoque contemplativo-analítico: Reflexiona profundamente sobre cada premisa antes de construir argumentos estructurados"

Responde SOLO con la descripción del estilo argumentativo, sin formato adicional.`,
        isActive: true,
        modelId: model.id
      },
      create: {
        name: 'argument_style_generation',
        category: 'generation',
        displayName: 'Generación de Estilo Argumentativo',
        version: '1.0.0',
        systemPrompt: `Eres un experto en filosofía y debate que debe generar un estilo argumentativo específico para un filósofo.

INFORMACIÓN DEL FILÓSOFO:
- Mecánicas de Debate: {DEBATE_MECHANICS}
- Inspiración: {INSPIRATION_SOURCE}
- Salsa Secreta: {SECRET_SAUCE}

Tu tarea es generar una descripción del ESTILO ARGUMENTATIVO que defina cómo este filósofo específico aborda los debates y construye sus argumentos.

REQUISITOS:
1. Máximo 150 caracteres
2. Describe el MÉTODO específico que usa
3. Integra sutilmente elementos de su inspiración
4. Refleja sus mecánicas de debate preferidas
5. Usa un tono profesional pero accesible

EJEMPLOS DE FORMATO:
- "Estilo socrático moderno: Combina preguntas incisivas con análisis pragmático para desafiar suposiciones arraigadas"
- "Enfoque contemplativo-analítico: Reflexiona profundamente sobre cada premisa antes de construir argumentos estructurados"

Responde SOLO con la descripción del estilo argumentativo, sin formato adicional.`,
        description: 'Genera el estilo argumentativo específico de un filósofo',
        usage: 'Creación de filósofos en el wizard',
        isActive: true,
        modelId: model.id,
        parameters: JSON.stringify({
          variables: ['DEBATE_MECHANICS', 'INSPIRATION_SOURCE', 'SECRET_SAUCE'],
          required: ['DEBATE_MECHANICS']
        })
      }
    })

    // 2. Prompt para generar questioningApproach
    const questioningApproachPrompt = await prisma.promptTemplate.upsert({
      where: { name_version: { name: 'questioning_approach_generation', version: '1.0.0' } },
      update: {
        systemPrompt: `Eres un experto en metodología filosófica que debe generar un enfoque de cuestionamiento específico.

INFORMACIÓN DEL FILÓSOFO:
- Inspiración: {INSPIRATION_SOURCE}
- Atributos de Personalidad:
{ATTRIBUTES}

Tu tarea es generar una descripción del ENFOQUE DE CUESTIONAMIENTO que define cómo este filósofo formula preguntas y conduce investigaciones filosóficas.

ANÁLISIS REQUERIDO:
1. Examina los atributos de personalidad para entender sus tendencias
2. Considera su fuente de inspiración filosófica
3. Genera un método de cuestionamiento coherente con su perfil

REQUISITOS:
1. Máximo 120 caracteres
2. Describe el MÉTODO específico de formular preguntas
3. Refleja su personalidad y estilo de razonamiento
4. Integra elementos de su inspiración filosófica

EJEMPLOS DE FORMATO:
- "Método socrático adaptado: Formula preguntas en cascada que revelan contradicciones ocultas"
- "Enfoque fenomenológico: Indaga sobre la experiencia vivida mediante preguntas descriptivas"
- "Cuestionamiento analítico: Descompone conceptos complejos en preguntas precisas y verificables"

Responde SOLO con la descripción del enfoque de cuestionamiento, sin formato adicional.`,
        isActive: true,
        modelId: model.id
      },
      create: {
        name: 'questioning_approach_generation',
        category: 'generation',
        displayName: 'Generación de Enfoque de Cuestionamiento',
        version: '1.0.0',
        systemPrompt: `Eres un experto en metodología filosófica que debe generar un enfoque de cuestionamiento específico.

INFORMACIÓN DEL FILÓSOFO:
- Inspiración: {INSPIRATION_SOURCE}
- Atributos de Personalidad:
{ATTRIBUTES}

Tu tarea es generar una descripción del ENFOQUE DE CUESTIONAMIENTO que define cómo este filósofo formula preguntas y conduce investigaciones filosóficas.

ANÁLISIS REQUERIDO:
1. Examina los atributos de personalidad para entender sus tendencias
2. Considera su fuente de inspiración filosófica
3. Genera un método de cuestionamiento coherente con su perfil

REQUISITOS:
1. Máximo 120 caracteres
2. Describe el MÉTODO específico de formular preguntas
3. Refleja su personalidad y estilo de razonamiento
4. Integra elementos de su inspiración filosófica

EJEMPLOS DE FORMATO:
- "Método socrático adaptado: Formula preguntas en cascada que revelan contradicciones ocultas"
- "Enfoque fenomenológico: Indaga sobre la experiencia vivida mediante preguntas descriptivas"
- "Cuestionamiento analítico: Descompone conceptos complejos en preguntas precisas y verificables"

Responde SOLO con la descripción del enfoque de cuestionamiento, sin formato adicional.`,
        description: 'Genera el enfoque de cuestionamiento específico de un filósofo',
        usage: 'Creación de filósofos en el wizard',
        isActive: true,
        modelId: model.id,
        parameters: JSON.stringify({
          variables: ['INSPIRATION_SOURCE', 'ATTRIBUTES'],
          required: ['INSPIRATION_SOURCE']
        })
      }
    })

    // 3. Prompt para generar coreBeliefs
    const coreBeliefsPrompt = await prisma.promptTemplate.upsert({
      where: { name_version: { name: 'core_beliefs_generation', version: '1.0.0' } },
      update: {
        systemPrompt: `Eres un experto filósofo que debe generar las creencias fundamentales específicas de un pensador.

INFORMACIÓN DEL FILÓSOFO:
- Inspiración: {INSPIRATION_SOURCE}
- Salsa Secreta: {SECRET_SAUCE}
- Mecánicas de Debate: {DEBATE_MECHANICS}

Tu tarea es generar exactamente 3 CREENCIAS FUNDAMENTALES que definan la cosmovisión de este filósofo específico.

ANÁLISIS REQUERIDO:
1. Identifica los principios clave de su fuente de inspiración
2. Integra elementos de su "salsa secreta" (enfoque único)
3. Considera cómo sus mecánicas de debate reflejan sus valores profundos
4. Genera creencias coherentes y distintivas

REQUISITOS:
1. Exactamente 3 creencias
2. Cada creencia debe ser una oración completa y clara
3. Máximo 80 caracteres por creencia
4. Deben ser específicas y distintivas (no genéricas)
5. Coherentes con su inspiración filosófica

FORMATO DE RESPUESTA:
Responde SOLO con un array JSON válido:
[
  "Primera creencia fundamental específica.",
  "Segunda creencia que refleje su inspiración.",
  "Tercera creencia que integre su enfoque único."
]

NO incluyas texto adicional, SOLO el array JSON.`,
        isActive: true,
        modelId: model.id
      },
      create: {
        name: 'core_beliefs_generation',
        category: 'generation',
        displayName: 'Generación de Creencias Fundamentales',
        version: '1.0.0',
        systemPrompt: `Eres un experto filósofo que debe generar las creencias fundamentales específicas de un pensador.

INFORMACIÓN DEL FILÓSOFO:
- Inspiración: {INSPIRATION_SOURCE}
- Salsa Secreta: {SECRET_SAUCE}
- Mecánicas de Debate: {DEBATE_MECHANICS}

Tu tarea es generar exactamente 3 CREENCIAS FUNDAMENTALES que definan la cosmovisión de este filósofo específico.

ANÁLISIS REQUERIDO:
1. Identifica los principios clave de su fuente de inspiración
2. Integra elementos de su "salsa secreta" (enfoque único)
3. Considera cómo sus mecánicas de debate reflejan sus valores profundos
4. Genera creencias coherentes y distintivas

REQUISITOS:
1. Exactamente 3 creencias
2. Cada creencia debe ser una oración completa y clara
3. Máximo 80 caracteres por creencia
4. Deben ser específicas y distintivas (no genéricas)
5. Coherentes con su inspiración filosófica

FORMATO DE RESPUESTA:
Responde SOLO con un array JSON válido:
[
  "Primera creencia fundamental específica.",
  "Segunda creencia que refleje su inspiración.",
  "Tercera creencia que integre su enfoque único."
]

NO incluyas texto adicional, SOLO el array JSON.`,
        description: 'Genera las creencias fundamentales específicas de un filósofo',
        usage: 'Creación de filósofos en el wizard',
        isActive: true,
        modelId: model.id,
        parameters: JSON.stringify({
          variables: ['INSPIRATION_SOURCE', 'SECRET_SAUCE', 'DEBATE_MECHANICS'],
          required: ['INSPIRATION_SOURCE']
        })
      }
    })

    console.log('✅ Prompts creados/actualizados:')
    console.log(`   - ${argumentStylePrompt.name} (ID: ${argumentStylePrompt.id})`)
    console.log(`   - ${questioningApproachPrompt.name} (ID: ${questioningApproachPrompt.id})`)
    console.log(`   - ${coreBeliefsPrompt.name} (ID: ${coreBeliefsPrompt.id})`)

    console.log('\n🎯 Sistema de generación de campos listo!')
    console.log('Los campos argumentStyle, questioningApproach y coreBeliefs ahora se generarán usando LLM con prompts de la base de datos.')

  } catch (error) {
    console.error('❌ Error agregando prompts:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addFieldGenerationPrompts()
  .catch(console.error) 