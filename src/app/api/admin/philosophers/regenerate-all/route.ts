import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentSession } from '@/lib/auth'
import { LLMService } from '@/lib/llm-service'

const prisma = new PrismaClient()

// Función para obtener el tono de comunicación activo
const getActiveCommunicationTone = async () => {
  try {
    const activeTone = await prisma.customTone.findFirst({
      where: { isActive: true }
    })
    
    if (activeTone) {
      return {
        preset: 'custom',
        description: activeTone.aiInterpretation
      }
    }
    
    return null
  } catch (error) {
    console.error('Error obteniendo tono activo:', error)
    return null
  }
}

// Mapeo de datos faltantes basado en el filósofo
const getDefaultData = (philosopher: any) => {
  // Generar secretSauce basada en la descripción existente
  const secretSauce = philosopher.description 
    ? `${philosopher.description.slice(0, 100)}. Enfoque único basado en ${philosopher.philosophicalSchool || 'principios filosóficos clásicos'}.`
    : `Pensador inspirado en ${philosopher.philosophicalSchool || 'la tradición filosófica'} con perspectiva única y original.`

  // Asignar debateMechanics basado en la escuela filosófica
  let debateMechanics = 'socratic_dialogue' // Por defecto
  
  if (philosopher.philosophicalSchool?.toLowerCase().includes('estoic')) {
    debateMechanics = 'analytical'
  } else if (philosopher.philosophicalSchool?.toLowerCase().includes('existencial')) {
    debateMechanics = 'contemplative'
  } else if (philosopher.philosophicalSchool?.toLowerCase().includes('nietzsche')) {
    debateMechanics = 'provocative'
  } else if (philosopher.philosophicalSchool?.toLowerCase().includes('pragma')) {
    debateMechanics = 'rhetorical'
  } else if (philosopher.philosophicalSchool?.toLowerCase().includes('dialéctic')) {
    debateMechanics = 'dialectical'
  }

  return { secretSauce, debateMechanics }
}

// Generar trade-offs por defecto basados en la escuela filosófica
const getDefaultTradeOffs = (philosopher: any) => {
  const { philosophicalSchool, name } = philosopher
  
  // Trade-offs por defecto balanceados
  let defaultAttributes = [
    { name: "Actitud hacia el Cambio", leftExtreme: "Conservador", rightExtreme: "Revolucionario", value: 5 },
    { name: "Enfoque Cognitivo", leftExtreme: "Estructurado", rightExtreme: "Creativo", value: 5 },
    { name: "Estilo de Razonamiento", leftExtreme: "Analítico", rightExtreme: "Sintético", value: 5 },
    { name: "Método de Conocimiento", leftExtreme: "Sistemático", rightExtreme: "Intuitivo", value: 5 },
    { name: "Orientación Práctica", leftExtreme: "Pragmático", rightExtreme: "Idealista", value: 5 }
  ]

  // Ajustar basado en la escuela filosófica o nombre
  if (philosophicalSchool?.toLowerCase().includes('estoic') || name?.toLowerCase().includes('zenón')) {
    defaultAttributes[0].value = 3 // Más conservador
    defaultAttributes[1].value = 3 // Más estructurado
    defaultAttributes[4].value = 2 // Muy pragmático
  } else if (philosophicalSchool?.toLowerCase().includes('existencial') || name?.toLowerCase().includes('sartre')) {
    defaultAttributes[0].value = 8 // Revolucionario
    defaultAttributes[1].value = 8 // Creativo
    defaultAttributes[2].value = 7 // Sintético
    defaultAttributes[3].value = 7 // Intuitivo
    defaultAttributes[4].value = 8 // Idealista
  } else if (name?.toLowerCase().includes('nietzsche')) {
    defaultAttributes[0].value = 9 // Muy revolucionario
    defaultAttributes[1].value = 9 // Muy creativo
    defaultAttributes[2].value = 8 // Sintético
    defaultAttributes[3].value = 8 // Intuitivo
  } else if (name?.toLowerCase().includes('kant')) {
    defaultAttributes[1].value = 2 // Muy estructurado
    defaultAttributes[2].value = 2 // Muy analítico
    defaultAttributes[3].value = 2 // Muy sistemático
  } else if (name?.toLowerCase().includes('sócrates')) {
    defaultAttributes[0].value = 6 // Ligeramente revolucionario
    defaultAttributes[1].value = 7 // Creativo
    defaultAttributes[2].value = 6 // Sintético
    defaultAttributes[3].value = 8 // Muy intuitivo
  }

  return defaultAttributes
}

// Generar cada campo usando el sistema de prompts del admin
const generateFieldWithPrompts = async (fieldType: string, data: any) => {
  try {
    console.log(`🎯 Generando ${fieldType} usando sistema de prompts...`)
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/admin/llm/generate-field`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fieldType,
        ...data
      })
    })

    if (!response.ok) {
      throw new Error(`Error generando ${fieldType}: ${response.statusText}`)
    }

    const result = await response.json()
    return result.response

  } catch (error) {
    console.error(`❌ Error generando ${fieldType}:`, error)
    // Fallback a valores por defecto
    if (fieldType === 'argument_style_generation') {
      return `Estilo ${data.debateMechanics}: Enfoque basado en ${data.inspirationSource} con elementos únicos`
    } else if (fieldType === 'core_beliefs_generation') {
      return [
        `Inspirado en principios de ${data.inspirationSource}`,
        `Enfoque metodológico basado en ${data.debateMechanics}`,
        `Perspectiva única: ${data.secretSauce?.slice(0, 60) || 'Originalidad filosófica'}`
      ]
    }
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificación simple de seguridad
    const body = await request.json().catch(() => ({}))
    const securityKey = body.securityKey || 'migration2025'
    
    if (securityKey !== 'migration2025') {
      return NextResponse.json({
        success: false,
        error: 'Clave de seguridad incorrecta',
      }, { status: 403 })
    }

    console.log('🔄 Iniciando regeneración masiva con sistema de prompts completo...')

    // 🆕 Obtener tono de comunicación activo
    const activeTone = await getActiveCommunicationTone()
    console.log('🎵 Tono de comunicación activo:', activeTone ? 'Sí' : 'No')

    // Obtener todos los filósofos existentes
    const philosophers = await prisma.philosopher.findMany({
      include: {
        personalityAspects: true
      }
    })

    console.log(`📊 Encontrados ${philosophers.length} filósofos para regenerar`)

    const results = {
      processed: 0,
      updated: 0,
      errors: 0,
      details: [] as any[]
    }

    for (const philosopher of philosophers) {
      try {
        console.log(`🧠 Procesando: ${philosopher.name}`)
        results.processed++

        // 1. Obtener o generar datos necesarios
        const { secretSauce, debateMechanics } = getDefaultData(philosopher)
        
        // 2. Obtener trade-offs existentes o generar por defecto
        let attributes = []
        
        if (philosopher.personalityAspects && philosopher.personalityAspects.length > 0) {
          // Convertir aspectos existentes al formato trade-off
          const aspectMapping: Record<string, { leftExtreme: string; rightExtreme: string }> = {
            "Enfoque Cognitivo": { leftExtreme: "Estructurado", rightExtreme: "Creativo" },
            "Orientación Práctica": { leftExtreme: "Pragmático", rightExtreme: "Idealista" },
            "Método de Conocimiento": { leftExtreme: "Sistemático", rightExtreme: "Intuitivo" },
            "Actitud hacia el Cambio": { leftExtreme: "Conservador", rightExtreme: "Revolucionario" },
            "Estilo de Razonamiento": { leftExtreme: "Analítico", rightExtreme: "Sintético" }
          }
          
          // Crear el conjunto completo de trade-offs
          const defaultAttributes = getDefaultTradeOffs(philosopher)
          
          // Actualizar con valores existentes si los hay
          attributes = defaultAttributes.map(defaultAttr => {
            const existingAspect = philosopher.personalityAspects?.find(
              (aspect: any) => aspect.aspectName === defaultAttr.name
            )
            
            if (existingAspect) {
              return {
                ...defaultAttr,
                value: existingAspect.value
              }
            }
            
            return defaultAttr
          })
        } else {
          // Usar trade-offs por defecto basados en la escuela filosófica
          attributes = getDefaultTradeOffs(philosopher)
        }

        // 3. 🆕 Preparar datos completos para el endpoint generate-final-result con sistema de prompts
        const regenerationData = {
          name: philosopher.name,
          inspirationSource: philosopher.philosophicalSchool || philosopher.name,
          inspirationType: 'school', // Asumir escuela por defecto
          attributes,
          secretSauce,
          debateMechanics,
          communicationTone: activeTone // ✅ INCLUIR tono activo del sistema
        }

        console.log(`📤 Enviando al sistema mejorado de generación...`)

        // 4. 🆕 Llamar al endpoint mejorado generate-final-result
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/admin/philosophers/generate-final-result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(regenerationData)
        })

        if (!response.ok) {
          throw new Error(`Error en generate-final-result: ${response.statusText}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(`Generate-final-result falló: ${result.error}`)
        }

        // 5. Actualizar el filósofo con los nuevos datos
        await prisma.philosopher.update({
          where: { id: philosopher.id },
          data: {
            description: result.description,
            personalityTraits: JSON.stringify(result.personalityScores),
            debateMechanics,
            // 🆕 Guardar información adicional generada
            ...(result.fields?.argumentStyle && { argumentStyle: result.fields.argumentStyle }),
            ...(result.fields?.coreBeliefs && { coreBeliefs: result.fields.coreBeliefs })
          }
        })

        // 6. Actualizar los aspectos de personalidad con los trade-offs
        await prisma.philosopherPersonalityAspect.deleteMany({
          where: { philosopherId: philosopher.id }
        })

        await prisma.philosopherPersonalityAspect.createMany({
          data: [
            // Guardar trade-offs
            ...attributes.map(attr => ({
              philosopherId: philosopher.id,
              aspectName: attr.name,
              value: attr.value,
              generatedBy: 'AI_MIGRATION_V2' // 🆕 Marcar con nueva versión
            })),
            // Guardar rasgos generados por el sistema mejorado
            ...result.personalityScores.map((score: any) => ({
              philosopherId: philosopher.id,
              aspectName: score.name,
              value: score.value,
              generatedBy: 'SYSTEM_PROMPTS_V2' // 🆕 Marcar que usa sistema de prompts
            }))
          ]
        })

        results.updated++
        results.details.push({
          name: philosopher.name,
          status: 'success',
          newTraits: result.personalityScores.map((s: any) => `${s.name}:${s.value}`).join(', '),
          usedTone: activeTone ? 'Sí' : 'No',
          fields: result.fields ? Object.keys(result.fields).join(', ') : 'Básicos'
        })

        console.log(`✅ ${philosopher.name} regenerado con sistema completo`)

        // Pausa para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (error) {
        console.error(`❌ Error procesando ${philosopher.name}:`, error)
        results.errors++
        results.details.push({
          name: philosopher.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    console.log('🎉 Regeneración masiva completada con sistema de prompts!')
    console.log(`📊 Resultados: ${results.updated} actualizados, ${results.errors} errores`)
    console.log(`🎵 Tono usado: ${activeTone ? 'Sistema activo' : 'Sin tono específico'}`)

    return NextResponse.json({
      success: true,
      message: 'Regeneración masiva completada con sistema de prompts mejorado',
      results,
      metadata: {
        usedCommunicationTone: !!activeTone,
        toneInfo: activeTone?.description || 'Sin tono específico',
        systemVersion: 'V2_WITH_PROMPTS'
      }
    })

  } catch (error) {
    console.error('Error en regeneración masiva:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor durante la regeneración masiva',
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 