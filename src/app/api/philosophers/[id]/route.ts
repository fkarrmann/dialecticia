import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'

const updatePhilosopherSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  description: z.string().min(10, 'Mínimo 10 caracteres').max(2000, 'Máximo 2000 caracteres'),
  philosophicalSchool: z.string().min(1, 'La escuela filosófica es requerida'),
  argumentStyle: z.string().optional(),
  questioningApproach: z.string().optional(),
  isActive: z.boolean().optional(),
  // Campos adicionales del laboratorio
  personalityScores: z.array(z.object({
    name: z.string(),
    value: z.number().min(0).max(5)
  })).optional(),
  personalityAspects: z.union([
    z.object({
      attributes: z.array(z.object({
        name: z.string(),
        leftExtreme: z.string(),
        rightExtreme: z.string(),
        value: z.number().min(0).max(10)
      })),
      debateMechanics: z.string()
    }),
    z.array(z.object({
      name: z.string(),
      leftExtreme: z.string().optional(),
      rightExtreme: z.string().optional(),
      value: z.number().min(0).max(10)
    }))
  ]).optional(),
  tags: z.array(z.string()).optional(),
  coreBeliefs: z.array(z.string()).optional(),
  photoUrl: z.union([
    z.string().url('URL inválida'), 
    z.null(), 
    z.literal(''), 
    z.undefined()
  ]).optional().transform(val => val || null),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    // Verificar autenticación
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado',
      }, { status: 401 })
    }

    // Buscar el filósofo con datos completos
    const philosopher = await prisma.philosopher.findUnique({
      where: { id: params.id },
      include: {
        personalityAspects: true,
      }
    })

    if (!philosopher) {
      return NextResponse.json({
        success: false,
        error: 'Filósofo no encontrado',
      }, { status: 404 })
    }

    // Verificar si es favorito del usuario
    const isFavorite = await prisma.philosopherFavorite.findFirst({
      where: { 
        userId: session.user.id,
        philosopherId: philosopher.id 
      }
    })

    // Parsear campos JSON igual que en el listado
    let tags = []
    let coreBeliefs = []
    let personalityScores = []
    let personalityAspects = null
    
    // Parsing seguro de tags
    try {
      tags = philosopher.tags ? JSON.parse(philosopher.tags) : []
    } catch (e) {
      console.warn(`Error parsing tags for philosopher ${philosopher.id}:`, e)
      tags = []
    }
    
    // Parsing seguro de coreBeliefs
    try {
      coreBeliefs = philosopher.coreBeliefs ? JSON.parse(philosopher.coreBeliefs) : []
    } catch (e) {
      console.warn(`Error parsing coreBeliefs for philosopher ${philosopher.id}:`, e)
      coreBeliefs = []
    }
    
    // Parsing seguro de personalityTraits (pero devolvemos como personalityScores para consistencia con el wizard)
    try {
      personalityScores = philosopher.personalityTraits ? JSON.parse(philosopher.personalityTraits) : []
    } catch (e) {
      console.warn(`Error parsing personalityTraits for philosopher ${philosopher.id}:`, e)
      personalityScores = []
    }
    
    // Parsing seguro de personalityAspects (relación de Prisma)
    try {
      // personalityAspects es una relación de Prisma, no un string JSON
      if (philosopher.personalityAspects && philosopher.personalityAspects.length > 0) {
        // Mapeo correcto de nombres de aspectos a extremos (hardcodeados porque no están en DB)
        const aspectMapping: Record<string, { leftExtreme: string; rightExtreme: string }> = {
          "Enfoque Cognitivo": { leftExtreme: "Creativo", rightExtreme: "Conservador" },
          "Orientación Práctica": { leftExtreme: "Idealista", rightExtreme: "Pragmático" },
          "Método de Conocimiento": { leftExtreme: "Intuitivo", rightExtreme: "Sistemático" },
          "Actitud hacia el Cambio": { leftExtreme: "Revolucionario", rightExtreme: "Tradicional" },
          "Estilo de Razonamiento": { leftExtreme: "Sintético", rightExtreme: "Analítico" }
        }
        
        // Convertir los aspectos de personalidad a formato del wizard
        personalityAspects = {
          attributes: philosopher.personalityAspects.map((aspect: any) => {
            const mapping = aspectMapping[aspect.aspectName] || { leftExtreme: "Mínimo", rightExtreme: "Máximo" }
            return {
              name: aspect.aspectName,
              leftExtreme: mapping.leftExtreme,
              rightExtreme: mapping.rightExtreme,
              value: aspect.value
            }
          })
        }
        
        console.log('✅ PersonalityAspects convertidos para wizard:', JSON.stringify(personalityAspects, null, 2))
      }
    } catch (e) {
      console.warn(`Error processing personalityAspects for philosopher ${philosopher.id}:`, e)
      personalityAspects = null
    }

    const formattedPhilosopher = {
      ...philosopher,
      tags,
      coreBeliefs,
      personalityScores,
      personalityTraits: personalityScores,
      personalityAspects,
      isFavorite: !!isFavorite
    }

    return NextResponse.json({
      success: true,
      data: formattedPhilosopher,
    })

  } catch (error) {
    console.error('Error fetching philosopher:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado',
      }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updatePhilosopherSchema.parse(body)

    // Verificar que el filósofo existe
    const existingPhilosopher = await prisma.philosopher.findUnique({
      where: { id },
      select: { id: true, createdBy: true }
    })

    if (!existingPhilosopher) {
      return NextResponse.json({
        success: false,
        error: 'Filósofo no encontrado',
      }, { status: 404 })
    }

    // Verificar permisos: solo el creador puede editar O admin puede editar todos
    if (existingPhilosopher.createdBy !== session.user?.id && !session.user?.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'No tienes permisos para editar este filósofo',
      }, { status: 403 })
    }

    // Verificar que no existe otro filósofo con el mismo nombre (excepto el actual)
    const duplicatePhilosopher = await prisma.philosopher.findFirst({
      where: {
        name: validatedData.name,
        id: { not: id }
      }
    })

    if (duplicatePhilosopher) {
      return NextResponse.json({
        success: false,
        error: 'Ya existe un filósofo con ese nombre',
      }, { status: 400 })
    }

    // Actualizar el filósofo
    const updateData: any = {
      name: validatedData.name,
      description: validatedData.description,
      philosophicalSchool: validatedData.philosophicalSchool,
      argumentStyle: validatedData.argumentStyle,
      questioningApproach: validatedData.questioningApproach,
      isActive: validatedData.isActive ?? true,
    }

    // Agregar campos opcionales del laboratorio si están presentes
    if (validatedData.personalityScores) {
      updateData.personalityTraits = JSON.stringify(validatedData.personalityScores)
    }
    
    if (validatedData.tags) {
      updateData.tags = JSON.stringify(validatedData.tags)
    }
    
    if (validatedData.coreBeliefs) {
      updateData.coreBeliefs = JSON.stringify(validatedData.coreBeliefs)
    }
    
    if (validatedData.photoUrl !== undefined) {
      updateData.photoUrl = validatedData.photoUrl
    }

    const updatedPhilosopher = await prisma.philosopher.update({
      where: { id },
      data: updateData
    })

    // Actualizar aspectos de personalidad si se proporcionaron
    if (validatedData.personalityAspects) {
      console.log('💾 Actualizando personalityAspects para filósofo:', id)
      console.log('📋 Datos recibidos:', JSON.stringify(validatedData.personalityAspects, null, 2))
      
      // Primero eliminar los aspectos existentes
      await prisma.philosopherPersonalityAspect.deleteMany({
        where: { philosopherId: id }
      })

      // Crear los nuevos aspectos
      let attributesToCreate: Array<{
        name: string;
        leftExtreme?: string;
        rightExtreme?: string;
        value: number;
      }> = [];

      // Manejar tanto el formato objeto como array
      if (Array.isArray(validatedData.personalityAspects)) {
        attributesToCreate = validatedData.personalityAspects;
        console.log('✅ Using array format for personalityAspects')
      } else if (validatedData.personalityAspects.attributes) {
        attributesToCreate = validatedData.personalityAspects.attributes;
        console.log('✅ Using object.attributes format for personalityAspects')
      }

      console.log('🎯 Atributos a crear:', JSON.stringify(attributesToCreate, null, 2))

      if (attributesToCreate.length > 0) {
        const aspectsToInsert = attributesToCreate.map(aspect => ({
          philosopherId: id,
          aspectName: aspect.name, // aspect.name del wizard -> aspectName en la DB
          value: aspect.value
          // No incluir leftExtreme y rightExtreme porque no existen en el schema
        }))
        
        console.log('💾 Insertando en DB:', JSON.stringify(aspectsToInsert, null, 2))
        
        await prisma.philosopherPersonalityAspect.createMany({
          data: aspectsToInsert
        })
        
        console.log('✅ PersonalityAspects guardados exitosamente')
      }
    }

    console.log('✅ Filósofo actualizado:', updatedPhilosopher.name)

    return NextResponse.json({
      success: true,
      data: updatedPhilosopher
    })

  } catch (error) {
    console.error('Error updating philosopher:', error)
    
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    // Verificar autenticación
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado',
      }, { status: 401 })
    }

    // Buscar el filósofo
    const philosopher = await prisma.philosopher.findUnique({
      where: { id: params.id }
    })

    if (!philosopher) {
      return NextResponse.json({
        success: false,
        error: 'Filósofo no encontrado',
      }, { status: 404 })
    }

    // Verificar si está siendo usado en debates activos
    const activeDebates = await prisma.debateParticipant.count({
      where: {
        philosopherId: params.id,
        debate: {
          status: {
            in: ['TOPIC_CLARIFICATION', 'ACTIVE_DEBATE', 'PAUSED']
          }
        }
      }
    })

    if (activeDebates > 0) {
      return NextResponse.json({
        success: false,
        error: `No se puede eliminar: el filósofo está participando en ${activeDebates} debate(s) activo(s)`,
      }, { status: 400 })
    }

    // Eliminar el filósofo
    await prisma.philosopher.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Filósofo eliminado correctamente',
    })

  } catch (error) {
    console.error('Error deleting philosopher:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
} 