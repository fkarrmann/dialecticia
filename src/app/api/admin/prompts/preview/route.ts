import { NextRequest, NextResponse } from 'next/server'
import { generatePhilosopherResponse } from '@/lib/llm'
import { prisma } from '@/lib/db'

// POST: Generar preview de prompt con contexto simulado
export async function POST(request: NextRequest) {
  try {
    const { promptType, context, prompts } = await request.json()

    // Validar datos
    if (!promptType || !context || !prompts) {
      return NextResponse.json(
        { error: 'Datos insuficientes para preview' },
        { status: 400 }
      )
    }

    // Obtener filósofo de la base de datos (o usar mock)
    let philosopher
    try {
      philosopher = await prisma.philosopher.findFirst({
        where: { name: context.filosofo }
      })
    } catch (error) {
      // Si no hay DB, usar mock
      philosopher = {
        id: 'mock',
        name: context.filosofo,
        description: `Filósofo ${context.filosofo} simulado`,
        school: 'Escuela Simulada',
        coreBeliefs: JSON.stringify(['Creencia simulada 1', 'Creencia simulada 2']),
        argumentStyle: 'Estilo argumentativo simulado',
        questioningApproach: 'Enfoque de cuestionamiento simulado',
        personalityTraits: JSON.stringify({
          formality: 7,
          aggression: 5,
          humor: 6,
          complexity: 8
        }),
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    // Simular historial de conversación
    const mockHistory = [
      {
        sender: 'Usuario',
        content: context.mensajeUsuario,
        timestamp: new Date()
      }
    ]

    // Determinar rol específico basado en promptType
    let specificRole: any = undefined
    switch (promptType) {
      case 'SOCRATIC_MODERATOR_PLURAL':
        specificRole = 'SOCRATIC_MODERATOR_PLURAL'
        break
      case 'SOCRATIC_TO_USER':
        specificRole = 'SOCRATIC_TO_USER'
        break
      case 'SOCRATIC_TO_PHILOSOPHER':
        specificRole = 'SOCRATIC_TO_PHILOSOPHER'
        break
      case 'RESPONDING_TO_SOCRATES':
        specificRole = 'RESPONDING_TO_SOCRATES'
        break
      default:
        specificRole = undefined
    }

    // Generar respuesta usando el sistema LLM existente
    const response = await generatePhilosopherResponse(
      philosopher as any,
      context.tema,
      mockHistory,
      context.mensajeUsuario,
      specificRole
    )

    return NextResponse.json({
      preview: response.content,
      meta: {
        promptType,
        philosopher: context.filosofo,
        topic: context.tema,
        style: prompts.socraticPrompts[promptType].style,
        maxLength: prompts.socraticPrompts[promptType].maxLength,
        usage: response.usage
      }
    })
  } catch (error) {
    console.error('Error generating preview:', error)
    
    // Fallback a preview mock
    const mockPreview = generateMockPreview(await request.json())
    
    return NextResponse.json({
      preview: mockPreview,
      meta: {
        isMock: true,
        error: 'Usando preview simulado'
      }
    })
  }
}

function generateMockPreview(data: any): string {
  const { promptType, context, prompts } = data
  
  const mockResponses = {
    'SOCRATIC_MODERATOR_PLURAL': `¿Qué opinas, ${context.filosofo}, de lo que dice nuestro amigo sobre ${context.tema}? ¿Coincides con esta perspectiva o tu experiencia te sugiere otra cosa?`,
    
    'SOCRATIC_TO_USER': `Dime, ¿no te parece contradictorio afirmar que "${context.mensajeUsuario.substring(0, 50)}..." cuando no has definido claramente qué entiendes por realidad?`,
    
    'SOCRATIC_TO_PHILOSOPHER': `${context.filosofo}, ¿no crees que tu enfoque ${context.filosofo === 'Platín' ? 'idealista' : 'empirista'} tiene puntos ciegos evidentes en este tema?`,
    
    'RESPONDING_TO_SOCRATES': context.filosofo === 'Platín' 
      ? 'Como idealista, considero que la verdadera realidad trasciende lo meramente sensible. Las formas perfectas son más reales que estas sombras materiales.'
      : 'Desde mi perspectiva empirista, solo confío en lo que puedo observar y verificar. La experiencia directa es la única fuente confiable de conocimiento.',
    
    'SOCRATIC_DEFAULT': `¿Y si lo que consideras "${context.tema}" es solo una cómoda ilusión que evita enfrentar preguntas más profundas?`
  }

  return mockResponses[promptType as keyof typeof mockResponses] || 
    `[PREVIEW MOCK] Respuesta ${prompts.socraticPrompts[promptType].style} para el contexto: "${context.mensajeUsuario}"`
} 