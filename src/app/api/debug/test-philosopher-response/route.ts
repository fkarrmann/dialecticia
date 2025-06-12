import { NextRequest, NextResponse } from 'next/server'
import { generatePhilosopherResponse } from '@/lib/llm'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 DEBUG: Testing philosopher response generation...')
    
    // Obtener un filósofo de prueba
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
    
    console.log(`🧪 DEBUG: Using philosopher: ${philosopher.name}`)
    
    // Datos de prueba
    const testTopic = "¿Es la libertad absoluta?"
    const testDescription = "Creo que la libertad debe tener límites para proteger a otros."
    const testHistory = [
      {
        sender: 'Usuario',
        content: testDescription,
        timestamp: new Date()
      }
    ]
    
    console.log('🧪 DEBUG: Calling generatePhilosopherResponse...')
    
    // Intentar generar respuesta
    const response = await generatePhilosopherResponse(
      philosopher,
      testTopic,
      testHistory,
      testDescription,
      'SOCRATIC_TO_USER'
    )
    
    console.log('🧪 DEBUG: Response generated successfully!')
    
    return NextResponse.json({
      success: true,
      data: {
        philosopher: philosopher.name,
        response: response.content,
        usage: response.usage
      }
    })
    
  } catch (error) {
    console.error('🧪 DEBUG ERROR:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
} 