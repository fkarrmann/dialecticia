import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentSession } from '@/lib/auth'
import { LLMService } from '@/lib/llm-service'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const generateFinalResultSchema = z.object({
  name: z.string(),
  inspirationSource: z.string(),
  inspirationType: z.enum(['philosopher', 'school']),
  attributes: z.array(z.object({
    name: z.string(),
    leftExtreme: z.string(),
    rightExtreme: z.string(),
    value: z.number().min(0).max(10)
  })),
  secretSauce: z.string(),
  debateMechanics: z.string()
})

// Función para generar puntajes de personalidad únicos basados en trade-offs usando LLM
const generatePersonalityScores = async (data: any) => {
  try {
    console.log('🧠 Generando RESUMEN INTEGRAL del perfil completo del filósofo...')
    
    // 🔍 DEBUG: Verificar datos de entrada
    console.log('📋 Datos de entrada:', {
      name: data.name,
      inspirationType: data.inspirationType,
      inspirationSource: data.inspirationSource,
      secretSauce: data.secretSauce,
      secretSauceLength: data.secretSauce?.length || 0,
      debateMechanics: data.debateMechanics,
      attributesCount: data.attributes?.length || 0
    })
    
    // 📊 ANÁLISIS INTEGRAL DE TODO EL PERFIL
    
    // 1️⃣ Analizar trade-offs para identificar tendencias dominantes
    const tradeOffAnalysis = data.attributes.map((attr: any) => ({
      name: attr.name,
      value: attr.value,
      leftExtreme: attr.leftExtreme,
      rightExtreme: attr.rightExtreme,
      tendency: attr.value <= 3 ? 'left' : attr.value >= 7 ? 'right' : 'balanced',
      intensity: attr.value <= 2 || attr.value >= 8 ? 'extreme' : attr.value <= 4 || attr.value >= 6 ? 'strong' : 'moderate'
    }))
    
    // 2️⃣ Identificar patrones dominantes en trade-offs
    const leftTraits = tradeOffAnalysis.filter((t: any) => t.tendency === 'left').map((t: any) => t.leftExtreme)
    const rightTraits = tradeOffAnalysis.filter((t: any) => t.tendency === 'right').map((t: any) => t.rightExtreme)
    const extremeTraits = tradeOffAnalysis.filter((t: any) => t.intensity === 'extreme')
    
    console.log('🎯 Análisis de trade-offs:', {
      leftTraits,
      rightTraits,
      extremeTraits: extremeTraits.map((t: any) => `${t.name}: ${t.value <= 2 ? t.leftExtreme : t.rightExtreme}`)
    })

    console.log('🧠 Consultando LLM para resumen integral...')
    
    // Obtener el prompt template de la base de datos
    let promptTemplate = null
    try {
      promptTemplate = await prisma.promptTemplate.findFirst({
        where: { 
          name: 'final_personality_generation',
          isActive: true 
        }
      })
    } catch (error) {
      console.log(`⚠️ Error obteniendo prompt template: ${error}`)
      throw new Error('No se pudo obtener el prompt template de la base de datos')
    }
    
    if (!promptTemplate) {
      console.log('❌ ERROR: No se encontró prompt final_personality_generation en la base de datos')
      throw new Error('Prompt template final_personality_generation no encontrado en la base de datos')
    }
    
    // Construir el prompt usando SOLO el template de la base de datos
    let finalPrompt = promptTemplate.template
    
    console.log('🔍 DEBUG: Prompt original de BD:', promptTemplate.template.substring(0, 200) + '...')
    console.log('🔍 DEBUG: Longitud prompt original:', promptTemplate.template.length)
    
    // Reemplazar placeholders básicos si existen
    if (finalPrompt.includes('{TIPO_INSPIRACION}')) {
      finalPrompt = finalPrompt.replace('{TIPO_INSPIRACION}', data.inspirationType === 'philosopher' ? 'Filósofo' : 'Escuela')
      console.log('🔄 Reemplazado TIPO_INSPIRACION')
    }
    if (finalPrompt.includes('{FUENTE_INSPIRACION}')) {
      finalPrompt = finalPrompt.replace('{FUENTE_INSPIRACION}', data.inspirationSource)
      console.log('🔄 Reemplazado FUENTE_INSPIRACION')
    }
    if (finalPrompt.includes('{SALSA_SECRETA}')) {
      finalPrompt = finalPrompt.replace('{SALSA_SECRETA}', data.secretSauce)
      console.log('🔄 Reemplazado SALSA_SECRETA')
    }
    if (finalPrompt.includes('{MECANICAS_DEBATE}')) {
      finalPrompt = finalPrompt.replace('{MECANICAS_DEBATE}', data.debateMechanics)
      console.log('🔄 Reemplazado MECANICAS_DEBATE')
    }
    if (finalPrompt.includes('{TONO_COMUNICACION}')) {
      const toneText = data.communicationTone 
        ? (typeof data.communicationTone === 'object' 
            ? `${data.communicationTone.preset}: ${data.communicationTone.description}`
            : data.communicationTone)
        : 'No especificado'
      finalPrompt = finalPrompt.replace('{TONO_COMUNICACION}', toneText)
      console.log('🔄 Reemplazado TONO_COMUNICACION')
    }
    if (finalPrompt.includes('{TRADE_OFFS_INFO}')) {
      const tradeOffsText = tradeOffAnalysis.map((attr: any) => {
        const label = attr.value <= 2 ? `EXTREMO ${attr.leftExtreme.toUpperCase()}` :
                      attr.value >= 8 ? `EXTREMO ${attr.rightExtreme.toUpperCase()}` :
                      attr.value <= 4 ? `Tiende hacia ${attr.leftExtreme}` :
                      attr.value >= 6 ? `Tiende hacia ${attr.rightExtreme}` : 'Equilibrado'
        return `- ${attr.name}: ${label} (${attr.value}/10)`
      }).join('\n')
      finalPrompt = finalPrompt.replace('{TRADE_OFFS_INFO}', tradeOffsText)
      console.log('🔄 Reemplazado TRADE_OFFS_INFO')
    }
    
    console.log('🔍 DEBUG: Prompt final después de reemplazos:', finalPrompt.substring(0, 200) + '...')
    console.log('🔍 DEBUG: Longitud prompt final:', finalPrompt.length)
    
    console.log('✅ Usando prompt de la base de datos')
    console.log('📤 PROMPT COMPLETO ENVIADO AL LLM:')
    console.log('=' .repeat(80))
    console.log(finalPrompt)
    console.log('=' .repeat(80))
    
    // Usar el servicio LLM centralizado SIN especificar modelo (usa el del prompt template)
    const llmResponse = await LLMService.callLLM({
      functionName: 'final_personality_generation',
      messages: [
        {
          role: 'system',
          content: finalPrompt
        },
        {
          role: 'user',
          content: `Analiza este perfil filosófico completo y genera exactamente 3 rasgos como se solicita.`
        }
      ],
      temperature: 0.7,
      maxTokens: 1000
    })
    
    const content = llmResponse.content
    console.log('🎯 Respuesta del LLM para resumen integral:', content)
    
    // Limpiar respuesta si viene con markdown
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim()
    console.log('🔍 JSON limpiado para parsing:', cleanedContent)

    // Parsear respuesta JSON
    const parsedResult = JSON.parse(cleanedContent)
    
    if (parsedResult.categories && Array.isArray(parsedResult.categories) && parsedResult.categories.length === 3) {
      // Procesar categorías y asegurar rango válido
      const processedCategories = parsedResult.categories.map((cat: any) => ({
        name: cat.name,
        value: Math.max(1, Math.min(5, cat.value)) // Asegurar rango 1-5
      }))
      
      console.log('✅ Rasgos integrales generados:', processedCategories)
      return processedCategories
    }

    throw new Error('La respuesta del LLM no tiene el formato JSON válido esperado')

  } catch (error) {
    console.error('❌ Error generando rasgos integrales con LLM:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    throw new Error(`La IA no está respondiendo correctamente: ${errorMessage}`)
  }
}

// Función para generar argumentStyle usando LLM
const generateArgumentStyleField = async (data: any) => {
  try {
    console.log('🎭 Generando estilo argumentativo...')
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/api/admin/llm/generate-field`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        functionName: 'argument_style_generation',
        data: {
          debateMechanics: data.debateMechanics,
          inspirationSource: data.inspirationSource,
          secretSauce: data.secretSauce,
          communicationTone: data.communicationTone
        }
      })
    })
    
    if (!response.ok) {
      console.log('❌ Error generando argumentStyle, usando fallback')
      return `Estilo dialéctico inspirado en ${data.inspirationSource}`
    }
    
    const result = await response.json()
    return result.content || `Estilo dialéctico inspirado en ${data.inspirationSource}`
  } catch (error) {
    console.log('❌ Error en generateArgumentStyleField:', error)
    return `Estilo dialéctico inspirado en ${data.inspirationSource}`
  }
}

// Función para generar coreBeliefs usando LLM
const generateCoreBeliefsField = async (data: any) => {
  try {
    console.log('📚 Generando creencias fundamentales...')
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/api/admin/llm/generate-field`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        functionName: 'core_beliefs_generation',
        data: {
          inspirationSource: data.inspirationSource,
          secretSauce: data.secretSauce,
          debateMechanics: data.debateMechanics,
          communicationTone: data.communicationTone
        }
      })
    })
    
    if (!response.ok) {
      console.log('❌ Error generando coreBeliefs, usando fallback')
      return [
        `Los principios de ${data.inspirationSource} ofrecen un marco sólido`,
        'El diálogo filosófico es esencial para el pensamiento crítico',
        'Las preguntas correctas son más valiosas que las respuestas fáciles'
      ]
    }
    
    const result = await response.json()
    return result.content || [
      `Los principios de ${data.inspirationSource} ofrecen un marco sólido`,
      'El diálogo filosófico es esencial para el pensamiento crítico',
      'Las preguntas correctas son más valiosas que las respuestas fáciles'
    ]
  } catch (error) {
    console.log('❌ Error en generateCoreBeliefsField:', error)
    return [
      `Los principios de ${data.inspirationSource} ofrecen un marco sólido`,
      'El diálogo filosófico es esencial para el pensamiento crítico'
    ]
  }
}

// Función para generar descripción usando LLM
const generateDescription = async (data: any, personalityScores: any[]) => {
  try {
    console.log('📝 Generando descripción dinámica con LLM...')
    
    // Buscar el prompt para análisis de personalidad (personality_analysis)
    let promptTemplate = null
    try {
      promptTemplate = await prisma.promptTemplate.findFirst({
        where: { 
          name: 'personality_analysis',
          isActive: true 
        }
      })
    } catch (error) {
      console.log(`⚠️ No se encontró prompt personality_analysis, usando prompt genérico`)
    }
    
    let finalPrompt = ''
    let modelToUse = null
    
    if (promptTemplate) {
      console.log('✅ Usando prompt personality_analysis desde BD')
      
      // Usar el prompt de la base de datos y reemplazar variables como en generatePersonalityScores
      finalPrompt = promptTemplate.template
      
      console.log('🔍 DEBUG: Prompt personality_analysis original:', finalPrompt.substring(0, 200) + '...')
      
      // Reemplazar variables básicas si existen
      if (finalPrompt.includes('{TIPO_INSPIRACION}')) {
        finalPrompt = finalPrompt.replace('{TIPO_INSPIRACION}', data.inspirationType === 'philosopher' ? 'Filósofo' : 'Escuela')
        console.log('🔄 Reemplazado TIPO_INSPIRACION')
      }
      if (finalPrompt.includes('{FUENTE_INSPIRACION}')) {
        finalPrompt = finalPrompt.replace('{FUENTE_INSPIRACION}', data.inspirationSource)
        console.log('🔄 Reemplazado FUENTE_INSPIRACION')
      }
      if (finalPrompt.includes('{SALSA_SECRETA}')) {
        finalPrompt = finalPrompt.replace('{SALSA_SECRETA}', data.secretSauce)
        console.log('🔄 Reemplazado SALSA_SECRETA')
      }
      if (finalPrompt.includes('{MECANICAS_DEBATE}')) {
        finalPrompt = finalPrompt.replace('{MECANICAS_DEBATE}', data.debateMechanics)
        console.log('🔄 Reemplazado MECANICAS_DEBATE')
      }
      if (finalPrompt.includes('{TONO_COMUNICACION}')) {
        const toneText = data.communicationTone 
          ? (typeof data.communicationTone === 'object' 
              ? `${data.communicationTone.preset}: ${data.communicationTone.description}`
              : data.communicationTone)
          : 'No especificado'
        finalPrompt = finalPrompt.replace('{TONO_COMUNICACION}', toneText)
        console.log('🔄 Reemplazado TONO_COMUNICACION')
      }
      if (finalPrompt.includes('{NOMBRE_FILOSOFO}')) {
        finalPrompt = finalPrompt.replace('{NOMBRE_FILOSOFO}', data.name)
        console.log('🔄 Reemplazado NOMBRE_FILOSOFO')
      }
      
      // Variables específicas del prompt personality_analysis (según BD)
      if (finalPrompt.includes('{NOMBRE}')) {
        finalPrompt = finalPrompt.replace(/{NOMBRE}/g, data.name)
        console.log('🔄 Reemplazado NOMBRE')
      }
      
      // DESCRIPCION (sin tilde, como está en la BD)
      if (finalPrompt.includes('{DESCRIPCION}')) {
        const tempDescription = `Un filósofo inspirado en ${data.inspirationSource}, con una personalidad única definida por: ${data.secretSauce}. Su estilo de debate es ${data.debateMechanics}.`
        finalPrompt = finalPrompt.replace(/{DESCRIPCION}/g, tempDescription)
        console.log('🔄 Reemplazado DESCRIPCION')
      }
      
      // También manejar la versión con tilde por compatibilidad
      if (finalPrompt.includes('{DESCRIPCIÓN}')) {
        const tempDescription = `Un filósofo inspirado en ${data.inspirationSource}, con una personalidad única definida por: ${data.secretSauce}. Su estilo de debate es ${data.debateMechanics}.`
        finalPrompt = finalPrompt.replace(/{DESCRIPCIÓN}/g, tempDescription)
        console.log('🔄 Reemplazado DESCRIPCIÓN')
      }
      
      if (finalPrompt.includes('{ESCUELA_FILOSOFICA}') || finalPrompt.includes('{ESCUELA_FILOSÓFICA}')) {
        finalPrompt = finalPrompt.replace(/{ESCUELA_FILOSOFICA}/g, data.inspirationSource)
        finalPrompt = finalPrompt.replace(/{ESCUELA_FILOSÓFICA}/g, data.inspirationSource)
        console.log('🔄 Reemplazado ESCUELA_FILOSOFICA')
      }
      
      // ESTILO_ARGUMENTATIVO (como está en la BD)
      if (finalPrompt.includes('{ESTILO_ARGUMENTATIVO}')) {
        const estiloArgumentativo = `Su estilo de argumentación se caracteriza por ser ${data.debateMechanics}, con un enfoque en ${data.secretSauce}.`
        finalPrompt = finalPrompt.replace(/{ESTILO_ARGUMENTATIVO}/g, estiloArgumentativo)
        console.log('🔄 Reemplazado ESTILO_ARGUMENTATIVO')
      }
      
      // ENFOQUE_CUESTIONAMIENTO (nueva variable que faltaba)
      if (finalPrompt.includes('{ENFOQUE_CUESTIONAMIENTO}')) {
        const enfoqueQuestionamiento = `Su enfoque de cuestionamiento se basa en ${data.debateMechanics}, utilizando la perspectiva de ${data.inspirationSource} para desafiar ideas establecidas.`
        finalPrompt = finalPrompt.replace(/{ENFOQUE_CUESTIONAMIENTO}/g, enfoqueQuestionamiento)
        console.log('🔄 Reemplazado ENFOQUE_CUESTIONAMIENTO')
      }
      
      // Mantener compatibilidad con versiones anteriores
      if (finalPrompt.includes('{INSPIRACION}') || finalPrompt.includes('{INSPIRACIÓN}')) {
        finalPrompt = finalPrompt.replace(/{INSPIRACION}/g, data.inspirationSource)
        finalPrompt = finalPrompt.replace(/{INSPIRACIÓN}/g, data.inspirationSource)
        console.log('🔄 Reemplazado INSPIRACION')
      }
      if (finalPrompt.includes('{CREENCIAS_CENTRALES}')) {
        const creenciasCentrales = `Sus ideas centrales giran en torno a: ${data.secretSauce}. Utiliza un enfoque de debate ${data.debateMechanics}.`
        finalPrompt = finalPrompt.replace(/{CREENCIAS_CENTRALES}/g, creenciasCentrales)
        console.log('🔄 Reemplazado CREENCIAS_CENTRALES')
      }
      if (finalPrompt.includes('{ESTILO_ARGUMENTACION}') || finalPrompt.includes('{ESTILO_ARGUMENTACIÓN}')) {
        const estiloArgumentacion = `Su estilo de argumentación se caracteriza por ser ${data.debateMechanics}, con un enfoque en ${data.secretSauce}.`
        finalPrompt = finalPrompt.replace(/{ESTILO_ARGUMENTACION}/g, estiloArgumentacion)
        finalPrompt = finalPrompt.replace(/{ESTILO_ARGUMENTACIÓN}/g, estiloArgumentacion)
        console.log('🔄 Reemplazado ESTILO_ARGUMENTACION')
      }
      
      // Construir información de rasgos de personalidad
      if (finalPrompt.includes('{RASGOS_PERSONALIDAD}')) {
        const rasgosInfo = personalityScores.map((trait: any) => `- ${trait.name}: ${trait.value}/5`).join('\n')
        finalPrompt = finalPrompt.replace('{RASGOS_PERSONALIDAD}', rasgosInfo)
        console.log('🔄 Reemplazado RASGOS_PERSONALIDAD')
      }
      
      // Construir información de trade-offs si existe
      if (finalPrompt.includes('{TRADE_OFFS_INFO}')) {
        const tradeOffsInfo = data.attributes?.map((attr: any) => {
          const label = attr.value <= 2 ? `EXTREMO ${attr.leftExtreme.toUpperCase()}` :
                        attr.value >= 8 ? `EXTREMO ${attr.rightExtreme.toUpperCase()}` :
                        attr.value <= 4 ? `Tiende hacia ${attr.leftExtreme}` :
                        attr.value >= 6 ? `Tiende hacia ${attr.rightExtreme}` : 'Equilibrado'
          return `- ${attr.name}: ${label} (${attr.value}/10)`
        }).join('\n') || 'No hay información de trade-offs'
        
        finalPrompt = finalPrompt.replace('{TRADE_OFFS_INFO}', tradeOffsInfo)
        console.log('🔄 Reemplazado TRADE_OFFS_INFO')
      }
      
      console.log('🔍 DEBUG: Prompt final después de reemplazos:', finalPrompt.substring(0, 200) + '...')
      console.log('🔍 DEBUG: Longitud prompt final:', finalPrompt.length)
      
    } else {
      // Crear un prompt dinámico genérico en español si no hay template
      finalPrompt = `Eres un experto en crear perfiles filosóficos únicos. Genera una descripción atractiva y original en español para este perfil de filósofo.

DATOS DEL FILÓSOFO:
- Nombre: ${data.name}
- Tipo de Inspiración: ${data.inspirationType === 'philosopher' ? 'Filósofo' : 'Escuela'}
- Fuente de Inspiración: ${data.inspirationSource}
- Salsa Secreta: ${data.secretSauce}
- Mecánicas de Debate: ${data.debateMechanics}
- Tono de Comunicación: ${data.communicationTone 
  ? (typeof data.communicationTone === 'object' 
      ? `${data.communicationTone.preset}: ${data.communicationTone.description}`
      : data.communicationTone)
  : 'No especificado'}

RESUMEN DE TRADE-OFFS:
${data.attributes?.map((attr: any) => {
  const label = attr.value <= 2 ? `EXTREMO ${attr.leftExtreme.toUpperCase()}` :
                attr.value >= 8 ? `EXTREMO ${attr.rightExtreme.toUpperCase()}` :
                attr.value <= 4 ? `Tiende hacia ${attr.leftExtreme}` :
                attr.value >= 6 ? `Tiende hacia ${attr.rightExtreme}` : 'Equilibrado'
  return `- ${attr.name}: ${label} (${attr.value}/10)`
}).join('\n') || 'No hay información de trade-offs'}

RASGOS DE PERSONALIDAD:
${personalityScores.map((trait: any) => `- ${trait.name}: ${trait.value}/5`).join('\n')}

REQUISITOS:
1. Escribe en ESPAÑOL
2. Crea una descripción única y atractiva (NO basada en plantillas)
3. Máximo 1800 caracteres
4. Incorpora naturalmente la fuente de inspiración, salsa secreta, estilo de debate y rasgos de personalidad
5. Haz que se sienta como una persona filosófica real y distintiva
6. Evita lenguaje repetitivo y clichés
7. Enfócate en lo que hace único y atractivo a este filósofo para debates

Genera SOLO el texto de descripción, sin formato adicional ni etiquetas.`
      
      console.log('🔄 Usando prompt dinámico genérico en español')
    }
    
    console.log('📤 PROMPT DESCRIPCIÓN ENVIADO AL LLM:')
    console.log('================================================================================')
    console.log(finalPrompt)
    console.log('================================================================================')
    
    // Llamar al LLM
    const llmResponse = await LLMService.callLLM({
      functionName: promptTemplate ? 'personality_analysis' : 'final_personality_generation',
      messages: [
        {
          role: 'system',
          content: finalPrompt
        },
        {
          role: 'user',
          content: `Genera una descripción atractiva en español para este perfil de filósofo.`
        }
      ],
      temperature: 0.8, // Más creatividad para descripciones
      maxTokens: 800
    })
    
    let description = llmResponse.content.trim()
    
    // Limpiar cualquier formato extra
    description = description.replace(/^["']|["']$/g, '').trim()
    
    console.log('✅ Descripción generada con LLM:', description.substring(0, 100) + '...')
    
    // Asegurar que no exceda 1800 caracteres
    if (description.length > 1800) {
      description = description.substring(0, 1800).trim() + '...'
      console.log('✂️ Descripción recortada a 1800 caracteres')
    }
    
    return description
    
  } catch (error) {
    console.error('❌ Error generando descripción con LLM:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    throw new Error(`La IA no está respondiendo correctamente para la descripción: ${errorMessage}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación - TEMPORALMENTE DESHABILITADO PARA MIGRACIÓN
    // const session = await getCurrentSession()
    // if (!session) {
    //   return NextResponse.json({
    //     success: false,
    //     error: 'No autenticado',
    //   }, { status: 401 })
    // }

    const body = await request.json()
    const validatedData = generateFinalResultSchema.parse(body)

    console.log('🧠 Generando resultado final para filósofo con trade-offs...')

    // Generar puntajes de personalidad basados en trade-offs
    const personalityScores = await generatePersonalityScores(validatedData)

    // Generar descripción mejorada
    const description = await generateDescription(validatedData, personalityScores)

    // Generar campos adicionales en paralelo
    console.log('🔧 Generando campos adicionales con LLM...')
    const [argumentStyle, coreBeliefs] = await Promise.all([
      generateArgumentStyleField(validatedData),
      generateCoreBeliefsField(validatedData)
    ])

    // Los personalityTraits ya se generan en generatePersonalityScores
    const fields = {
      personalityTraits: personalityScores,
      coreBeliefs: coreBeliefs,
      argumentStyle: argumentStyle
    }

    console.log('✅ Resultado final generado exitosamente con trade-offs y campos adicionales')

    return NextResponse.json({
      success: true,
      personalityScores,
      description,
      fields
    })

  } catch (error) {
    console.error('Error generating final result:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Datos inválidos',
        details: error.errors,
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
} 