import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentSession } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const createPhilosopherSchema = z.object({
  // Identidad básica
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre es muy largo'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(2000, 'La descripción es muy larga'),
  publicDescription: z.string().optional(),
  
  // Campos del Laboratorio
  photoUrl: z.union([
    z.string().url('URL inválida'), 
    z.null(), 
    z.literal(''), 
    z.undefined()
  ]).optional().transform(val => val || null),
  inspirationSource: z.string().optional(),
  philosophicalSchool: z.string().min(2, 'La escuela filosófica es requerida').max(100, 'La escuela filosófica es muy larga'),
  debateMechanics: z.string().default('socratic_dialogue'),
  customPrompt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  
  // Personalidad y creencias (del nuevo wizard) - flexible para objetos o arrays
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
  personalityScores: z.array(z.object({
    name: z.string(),
    value: z.number().min(0).max(5)
  })).optional(),
  coreBeliefs: z.array(z.string()).optional(),
  
  // Estilo de debate (ahora más flexible)
  argumentStyle: z.string().min(5, 'El estilo argumentativo debe tener al menos 5 caracteres'),
  questioningApproach: z.string().min(5, 'El enfoque de cuestionamiento debe tener al menos 5 caracteres'),
  
  // Configuración
  isPublic: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

const prismaClient = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado',
      }, { status: 401 })
    }

    const philosophers = await prismaClient.philosopher.findMany({
      where: {
        isActive: true,
        OR: [
          { isPublic: true },
          { isDefault: true }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        philosophicalSchool: true,
        personalityTraits: true,
        coreBeliefs: true,
        argumentStyle: true,
        questioningApproach: true,
        isActive: true,
        isDefault: true,
        isPublic: true,
        photoUrl: true,
        publicDescription: true,
        inspirationSource: true,
        debateMechanics: true,
        tags: true,
        rating: true,
        totalRatings: true,
        usageCount: true
      },
      orderBy: [
        { isDefault: 'desc' },
        { rating: 'desc' },
        { name: 'asc' }
      ]
    })

    // Obtener favoritos del usuario
    const favorites = await prisma.philosopherFavorite.findMany({
      where: { userId: session.user.id },
      select: { philosopherId: true }
    })
    const favoriteIds = favorites.map(f => f.philosopherId)

    // Encontrar el filósofo más recientemente usado (último favorito agregado)
    const lastUsedFavorite = await prisma.philosopherFavorite.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: { philosopherId: true }
    })
    const lastUsedPhilosopherId = lastUsedFavorite?.philosopherId

    // Parsear campos JSON y agregar información básica
    const formattedPhilosophers = philosophers.map(philosopher => {
      let tags = []
      let coreBeliefs = []
      let personalityTraits = []
      
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
      
      // Parsing seguro de personalityTraits
      try {
        personalityTraits = philosopher.personalityTraits ? JSON.parse(philosopher.personalityTraits) : []
      } catch (e) {
        console.warn(`Error parsing personalityTraits for philosopher ${philosopher.id}:`, e)
        personalityTraits = []
      }
      
      return {
        ...philosopher,
        tags,
        coreBeliefs,
        personalityTraits,
        isFavorite: favoriteIds.includes(philosopher.id),
        isActiveForUser: philosopher.id === lastUsedPhilosopherId
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedPhilosophers,
      activePhilosopherId: lastUsedPhilosopherId
    })

  } catch (error) {
    console.error('Error fetching philosophers:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado',
      }, { status: 401 })
    }

    const body = await request.json()
    
    // DEBUG: Verificar qué estamos recibiendo
    console.log('📝 Datos recibidos en POST /api/philosophers:', JSON.stringify(body, null, 2))

    const validatedData = createPhilosopherSchema.parse(body)

    // Verificar que no exista un filósofo con el mismo nombre
    const existingPhilosopher = await prisma.philosopher.findUnique({
      where: { name: validatedData.name }
    })

    if (existingPhilosopher) {
      return NextResponse.json({
        success: false,
        error: 'Ya existe un filósofo con ese nombre',
      }, { status: 400 })
    }

    // Crear el filósofo con todos los campos del laboratorio
    const newPhilosopher = await prisma.philosopher.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        publicDescription: validatedData.publicDescription || null,
        photoUrl: validatedData.photoUrl || null,
        philosophicalSchool: validatedData.philosophicalSchool,
        inspirationSource: validatedData.inspirationSource || null,
        debateMechanics: validatedData.debateMechanics || 'socratic_dialogue',
        customPrompt: validatedData.customPrompt || null,
        tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
        personalityTraits: '[]', // Default empty for new wizard structure
        coreBeliefs: validatedData.coreBeliefs ? JSON.stringify(validatedData.coreBeliefs) : '[]',
        argumentStyle: validatedData.argumentStyle,
        questioningApproach: validatedData.questioningApproach,
        isPublic: validatedData.isPublic,
        createdBy: session.user.id,
        isActive: true,
        usageCount: 0,
        isDeletable: true,
        isDefault: false
      }
    })

    // Crear aspectos de personalidad si se proporcionaron
    if (validatedData.personalityAspects) {
      let attributesToCreate: Array<{
        name: string;
        leftExtreme?: string;
        rightExtreme?: string;
        value: number;
      }> = [];

      // Manejar tanto el formato objeto como array
      if (Array.isArray(validatedData.personalityAspects)) {
        attributesToCreate = validatedData.personalityAspects;
      } else if (validatedData.personalityAspects.attributes) {
        attributesToCreate = validatedData.personalityAspects.attributes;
      }

      if (attributesToCreate.length > 0) {
        await prisma.philosopherPersonalityAspect.createMany({
          data: attributesToCreate.map(aspect => ({
            philosopherId: newPhilosopher.id,
            aspectName: aspect.name,
            value: aspect.value,
            generatedBy: 'USER'
          }))
        })
      }
    }

    // Crear puntuaciones de personalidad si se proporcionaron
    let finalPhilosopher = newPhilosopher
    if (validatedData.personalityScores && validatedData.personalityScores.length > 0) {
      // Almacenar como JSON en el campo personalityTraits por compatibilidad
      finalPhilosopher = await prisma.philosopher.update({
        where: { id: newPhilosopher.id },
        data: {
          personalityTraits: JSON.stringify(validatedData.personalityScores)
        }
      })
    }

    console.log('✅ Filósofo creado exitosamente:', finalPhilosopher.name)

    return NextResponse.json({
      success: true,
      data: finalPhilosopher,
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error creating philosopher:', error)
    
    if (error instanceof z.ZodError) {
      console.error('🔍 Detalles de validación:', error.errors)
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

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado',
      }, { status: 401 })
    }

    // Obtener ID del filósofo desde la URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const philosopherId = pathParts[pathParts.length - 1]

    if (!philosopherId) {
      return NextResponse.json({
        success: false,
        error: 'ID de filósofo requerido',
      }, { status: 400 })
    }

    // Verificar que el filósofo existe y pertenece al usuario
    const philosopher = await prisma.philosopher.findUnique({
      where: { id: philosopherId }
    })

    if (!philosopher) {
      return NextResponse.json({
        success: false,
        error: 'Filósofo no encontrado',
      }, { status: 404 })
    }

    // Verificar permisos: solo el creador puede eliminar O admin puede eliminar todos
    if (philosopher.createdBy !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'No tienes permisos para eliminar este filósofo',
      }, { status: 403 })
    }

    // Eliminar aspectos de personalidad relacionados
    await prisma.philosopherPersonalityAspect.deleteMany({
      where: { philosopherId }
    })

    // Eliminar favoritos relacionados
    await prisma.philosopherFavorite.deleteMany({
      where: { philosopherId }
    })

    // Eliminar el filósofo
    await prisma.philosopher.delete({
      where: { id: philosopherId }
    })

    console.log('✅ Filósofo eliminado exitosamente:', philosopher.name)

    return NextResponse.json({
      success: true,
      message: 'Filósofo eliminado exitosamente'
    })

  } catch (error) {
    console.error('❌ Error deleting philosopher:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
} 