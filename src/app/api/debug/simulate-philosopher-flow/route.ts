import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { buildPhilosopherChatPrompt } from '@/lib/philosopher-chat-service'
import { LLMService } from '@/lib/llm-service'

export async function GET(request: NextRequest) {
  try {
    console.log('🎭 SIMULATE: Simulando flujo completo del sistema de filósofos...')
    
    // PASO 1: Obtener un filósofo de prueba
    console.log('📋 PASO 1: Obteniendo filósofo de prueba...')
    const philosopher = await prisma.philosopher.findFirst({
      where: { isActive: true },
      include: { personalityAspects: true }
    })
    
    if (!philosopher) {
      return NextResponse.json({
        success: false,
        error: 'No hay filósofos activos disponibles',
        step: 'PASO 1: Obtener filósofo'
      })
    }
    
    console.log(`✅ PASO 1 COMPLETADO: Filósofo encontrado: ${philosopher.name}`)
    
    // PASO 2: Preparar datos de prueba
    console.log('📋 PASO 2: Preparando datos de prueba...')
    const testTopic = "¿Es la libertad absoluta?"
    const testDescription = "Creo que la libertad debe tener límites para proteger a otros."
    const testHistory = [
      {
        sender: 'Usuario',
        content: testDescription,
        timestamp: new Date()
      }
    ]
    
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
    
    console.log('✅ PASO 2 COMPLETADO: Datos de prueba preparados')
    
    // PASO 3: Construir el prompt del filósofo
    console.log('📋 PASO 3: Construyendo prompt del filósofo...')
    let systemPrompt
    try {
      systemPrompt = await buildPhilosopherChatPrompt({
        philosopher,
        personality,
        beliefs,
        specificRole: 'SOCRATIC_TO_USER'
      })
      console.log('✅ PASO 3 COMPLETADO: Prompt construido exitosamente')
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        step: 'PASO 3: Construir prompt'
      })
    }
    
    // PASO 4: Preparar contexto
    console.log('📋 PASO 4: Preparando contexto...')
    const contextPrompt = `TEMA DEL DEBATE: "${testTopic}"\nÚLTIMO MENSAJE DEL USUARIO:\n"${testDescription}"\n\nResponde brevemente.`
    
    // PASO 5: Llamar al LLM
    console.log('📋 PASO 5: Llamando al LLM...')
    
    const llmRequest = {
      functionName: 'philosopher_chat_system',
      messages: [
        {
          role: 'system' as const,
          content: systemPrompt
        },
        {
          role: 'user' as const,
          content: contextPrompt
        }
      ],
      temperature: 0.8,
      maxTokens: 300
    }
    
    let llmResponse
    try {
      llmResponse = await LLMService.callLLM(llmRequest)
      console.log('✅ PASO 5 COMPLETADO: LLM respondió exitosamente')
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        step: 'PASO 5: Llamar al LLM',
        details: {
          functionName: llmRequest.functionName,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown'
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Simulación completada exitosamente',
      result: {
        philosopher: philosopher.name,
        response: llmResponse.content.substring(0, 200) + '...',
        usage: llmResponse.usage,
        provider: llmResponse.provider,
        model: llmResponse.model
      }
    })
    
  } catch (error) {
    console.error('🎭 SIMULATE ERROR:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      step: 'ERROR GENERAL'
    })
  }
} 