import { LLMService } from '@/lib/llm-service'
import { prisma } from '@/lib/db'

export interface PersonalityAspect {
  aspectName: string
  value: number // 0-5
  reasoning: string
}

export interface PersonalityAnalysis {
  aspects: PersonalityAspect[]
  summary: string
}

export async function analyzePhilosopherPersonality(
  name: string,
  description: string,
  philosophicalSchool: string,
  coreBeliefs: string,
  argumentStyle: string
): Promise<PersonalityAnalysis> {
  try {
    console.log(`🎭 Analizando personalidad de ${name}...`)
    
    // Obtener el prompt template de la base de datos
    let promptTemplate = null
    try {
      promptTemplate = await prisma.promptTemplate.findFirst({
        where: { 
          name: 'personality_analysis',
          isActive: true 
        }
      })
    } catch (error) {
      console.log(`⚠️ Error obteniendo prompt template: ${error}`)
      throw new Error('No se pudo obtener el prompt template de la base de datos')
    }
    
    if (!promptTemplate) {
      console.log('❌ ERROR: No se encontró prompt personality_analysis en la base de datos')
      throw new Error('Prompt template personality_analysis no encontrado en la base de datos')
    }
    
    // Construir el prompt usando SOLO el template de la base de datos
    let finalPrompt = promptTemplate.template
    
    // Reemplazar placeholders básicos si existen
    if (finalPrompt.includes('{NOMBRE}')) {
      finalPrompt = finalPrompt.replace('{NOMBRE}', name)
    }
    if (finalPrompt.includes('{DESCRIPCIÓN}')) {
      finalPrompt = finalPrompt.replace('{DESCRIPCIÓN}', description)
    }
    if (finalPrompt.includes('{ESCUELA_FILOSOFICA}')) {
      finalPrompt = finalPrompt.replace('{ESCUELA_FILOSOFICA}', philosophicalSchool)
    }
    if (finalPrompt.includes('{INSPIRACION}')) {
      finalPrompt = finalPrompt.replace('{INSPIRACION}', philosophicalSchool)
    }
    if (finalPrompt.includes('{ESTILO_ARGUMENTACION}')) {
      finalPrompt = finalPrompt.replace('{ESTILO_ARGUMENTACION}', argumentStyle)
    }
        
    console.log('✅ Usando prompt de la base de datos')
    console.log('📤 PROMPT ENVIADO AL LLM:')
    console.log('=' .repeat(50))
    console.log(finalPrompt)
    console.log('=' .repeat(50))
    
    // Usar el servicio LLM centralizado SIN especificar modelo (usa el del prompt template)
    const llmResponse = await LLMService.callLLM({
      functionName: 'personality_analysis',
      messages: [
        {
          role: 'system',
          content: finalPrompt
        },
        {
          role: 'user',
          content: `Analiza la personalidad del filósofo con la información proporcionada en el contexto del sistema.`
        }
      ],
      temperature: 0.8, // Un poco de creatividad para aspectos variados
      maxTokens: 1000
    })

    const content = llmResponse.content
    if (!content) {
      throw new Error('No se recibió respuesta del LLM')
    }

    console.log(`🎯 Respuesta del LLM para ${name}:`, content)

    // Limpiar la respuesta y parsear JSON
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
    let analysis: any
    
    try {
      analysis = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('Error parsing JSON from LLM:', parseError)
      console.log('Raw content:', cleanContent)
      throw new Error('Error parsing LLM response as JSON')
    }

    // Adaptar el formato si viene en el formato de aspects array
    let finalAnalysis: PersonalityAnalysis
    if (analysis.aspects && Array.isArray(analysis.aspects)) {
      // El formato ya es correcto
      finalAnalysis = {
        aspects: analysis.aspects.map((aspect: any) => ({
          aspectName: aspect.name || aspect.aspectName,
          value: aspect.value,
          reasoning: aspect.reasoning || `Generado por análisis automático de personalidad`
        })),
        summary: analysis.summary || `Análisis automático de personalidad para ${name}`
      }
    } else {
      throw new Error('Formato de respuesta no válido del LLM')
    }

    // Validar la estructura
    if (!finalAnalysis.aspects || !Array.isArray(finalAnalysis.aspects) || finalAnalysis.aspects.length !== 3) {
      throw new Error('El análisis debe contener exactamente 3 aspectos')
    }

    // Validar cada aspecto
    for (const aspect of finalAnalysis.aspects) {
      if (!aspect.aspectName || typeof aspect.value !== 'number' || aspect.value < 0 || aspect.value > 5) {
        throw new Error(`Aspecto inválido: ${JSON.stringify(aspect)}`)
      }
    }

    console.log(`✅ Análisis completado para ${name}:`, finalAnalysis.aspects.map(a => `${a.aspectName}:${a.value}`).join(', '))
    return finalAnalysis

  } catch (error) {
    console.error(`❌ Error analyzing philosopher personality for ${name}:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    throw new Error(`La IA no está respondiendo correctamente para el análisis de personalidad: ${errorMessage}`)
  }
}

export async function generatePersonalityAspectsForExistingPhilosophers() {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()

  try {
    // Obtener filósofos que no tienen aspectos de personalidad
    const philosophers = await prisma.philosopher.findMany({
      where: {
        personalityAspects: {
          none: {}
        }
      }
    })

    console.log(`🎭 Generando aspectos de personalidad para ${philosophers.length} filósofos...`)

    for (const philosopher of philosophers) {
      try {
        console.log(`🧠 Analizando personalidad de ${philosopher.name}...`)
        
        const analysis = await analyzePhilosopherPersonality(
          philosopher.name,
          philosopher.description,
          philosopher.philosophicalSchool,
          philosopher.coreBeliefs,
          philosopher.argumentStyle
        )

        // Guardar los aspectos en la base de datos
        for (const aspect of analysis.aspects) {
          await prisma.philosopherPersonalityAspect.create({
            data: {
              philosopherId: philosopher.id,
              aspectName: aspect.aspectName,
              value: aspect.value,
              generatedBy: 'AI'
            }
          })
        }

        console.log(`✅ Aspectos generados para ${philosopher.name}: ${analysis.aspects.map(a => `${a.aspectName}:${a.value}`).join(', ')}`)
        
        // Pequeña pausa para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`❌ Error procesando ${philosopher.name}:`, error)
      }
    }

    console.log('🎉 Generación de aspectos completada!')

  } catch (error) {
    console.error('Error generating personality aspects:', error)
  } finally {
    await prisma.$disconnect()
  }
} 