import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { LLMServiceV2 } from '@/lib/llm-service-v2'
import { buildPhilosopherChatPrompt } from '@/lib/philosopher-chat-service'

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 TESTING V2: Probando inicio de debate con LLMServiceV2...')
    
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
    
    // 1. Buscar filósofo
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
    
    // 2. Construir prompt del filósofo
    const personality = {
      formality: 7,
      aggression: 5,
      humor: 3,
      complexity: 8
    }
    
    const beliefs = [
      "La verdad se encuentra a través del diálogo",
      "Las ideas deben ser cuestionadas constantemente"
    ]
    
    const systemPrompt = await buildPhilosopherChatPrompt({
      philosopher,
      personality,
      beliefs,
      specificRole: 'SOCRATIC_TO_USER'
    })
    
    console.log(`✅ Prompt construido: ${systemPrompt.length} caracteres`)
    
    // 3. Preparar contexto
    const contextPrompt = `TEMA DEL DEBATE: "${topic}"\nÚLTIMO MENSAJE DEL USUARIO:\n"${description}"\n\nResponde brevemente como filósofo.`
    
    // 4. Llamar al LLMServiceV2
    console.log('🚀 Llamando a LLMServiceV2...')
    
    const llmResponse = await LLMServiceV2.callLLM({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: contextPrompt
        }
      ],
      temperature: 0.8,
      maxTokens: 300
    })
    
    console.log('✅ LLMServiceV2 respondió exitosamente!')
    
    return NextResponse.json({
      success: true,
      message: 'Debate iniciado exitosamente con LLMServiceV2',
      result: {
        philosopher: philosopher.name,
        response: llmResponse.content.substring(0, 200) + '...',
        fullResponse: llmResponse.content,
        usage: llmResponse.usage,
        provider: llmResponse.provider,
        model: llmResponse.model,
        cost: llmResponse.cost,
        latencyMs: llmResponse.latencyMs
      }
    })
    
  } catch (error) {
    console.error('🚨 ERROR V2:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Endpoint de prueba de inicio de debate con LLMServiceV2. Usar POST con { "topic": "...", "description": "..." }'
  })
} 