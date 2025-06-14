import { NextRequest, NextResponse } from 'next/server'
import { LLMService } from '@/lib/llm-service'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 TRACE: Rastreando llamada LLMService.callLLM...')
    
    // Hacer exactamente la misma llamada que hace el sistema de filósofos
    const testRequest = {
      functionName: 'philosopher_chat_system',
      messages: [
        {
          role: 'system' as const,
          content: 'Eres un filósofo virtual de prueba.'
        },
        {
          role: 'user' as const,
          content: 'Hola, ¿puedes responder brevemente?'
        }
      ],
      temperature: 0.8,
      maxTokens: 300
    }
    
    console.log('🧪 TRACE: Llamando LLMService.callLLM con:', testRequest)
    
    const response = await LLMService.callLLM(testRequest)
    
    console.log('✅ TRACE: LLMService.callLLM exitoso!')
    
    return NextResponse.json({
      success: true,
      message: 'LLMService.callLLM funcionó correctamente',
      response: {
        content: response.content.substring(0, 200) + '...',
        provider: response.provider,
        model: response.model,
        usage: response.usage,
        cost: response.cost,
        latencyMs: response.latencyMs
      }
    })
    
  } catch (error) {
    console.error('🔍 TRACE ERROR:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
      details: {
        functionName: 'philosopher_chat_system',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    })
  }
} 