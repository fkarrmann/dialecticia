import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 EMERGENCY: Probando inicio de debate real...')
    
    const body = await request.json()
    const { topic, description } = body
    
    if (!topic || !description) {
      return NextResponse.json({
        success: false,
        error: 'Se requieren topic y description'
      })
    }
    
    console.log(`📋 Tema: ${topic}`)
    console.log(`📋 Descripción: ${description}`)
    
    // Simular exactamente lo que hace el endpoint de debates
    // 1. Buscar filósofo antagónico
    console.log('🔍 Buscando filósofo antagónico...')
    
    // Por simplicidad, usar el primer filósofo activo
    const philosopher = await prisma.philosopher.findFirst({
      where: { isActive: true },
      include: { personalityAspects: true }
    })
    
    if (!philosopher) {
      return NextResponse.json({
        success: false,
        error: 'No hay filósofos activos disponibles'
      })
    }
    
    console.log(`✅ Filósofo seleccionado: ${philosopher.name}`)
    
    // 2. Crear el debate en la base de datos
    console.log('💾 Creando debate en la base de datos...')
    
    const debate = await prisma.debate.create({
      data: {
        topic,
        description,
        status: 'ACTIVE',
        currentTurn: 'PHILOSOPHER'
      }
    })
    
    console.log(`✅ Debate creado con ID: ${debate.id}`)
    
    // 3. Crear la participación del filósofo
    await prisma.debateParticipant.create({
      data: {
        debateId: debate.id,
        philosopherId: philosopher.id,
        role: 'COUNTERPOINT'
      }
    })
    
    console.log(`✅ Participación del filósofo creada`)
    
    // 4. Intentar generar la primera respuesta del filósofo
    console.log('🤖 Generando primera respuesta del filósofo...')
    
    try {
      // Importar dinámicamente para evitar problemas de dependencias circulares
      const { generatePhilosopherResponse } = await import('@/lib/llm')
      
      const conversationHistory = [
        {
          sender: 'Usuario',
          content: description,
          timestamp: new Date()
        }
      ]
      
      const response = await generatePhilosopherResponse(
        philosopher,
        topic,
        conversationHistory,
        description,
        'SOCRATIC_TO_USER'
      )
      
      console.log('✅ Respuesta generada exitosamente!')
      
      // 5. Guardar la respuesta en la base de datos
      await prisma.message.create({
        data: {
          debateId: debate.id,
          senderType: 'PHILOSOPHER',
          content: response.content,
          philosopherId: philosopher.id,
          turnNumber: 1
        }
      })
      
      console.log('✅ Respuesta guardada en la base de datos')
      
      return NextResponse.json({
        success: true,
        message: 'Debate iniciado exitosamente',
        debate: {
          id: debate.id,
          topic: debate.topic,
          philosopher: philosopher.name,
          firstResponse: response.content.substring(0, 200) + '...',
          usage: response.usage
        }
      })
      
    } catch (error) {
      console.error('❌ Error generando respuesta del filósofo:', error)
      
      // Eliminar el debate si falló la generación de respuesta
      await prisma.debate.delete({
        where: { id: debate.id }
      })
      
      return NextResponse.json({
        success: false,
        error: `Error generando respuesta del filósofo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        details: {
          debateId: debate.id,
          philosopher: philosopher.name,
          topic,
          description
        }
      })
    }
    
  } catch (error) {
    console.error('🚨 EMERGENCY ERROR:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Endpoint de prueba de inicio de debate. Usar POST con { "topic": "...", "description": "..." }'
  })
} 