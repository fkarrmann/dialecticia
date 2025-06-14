import { NextRequest, NextResponse } from 'next/server'
import { LLMServiceV2 } from '@/lib/llm-service-v2'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Probando LLMServiceV2...')
    
    const testRequest = {
      messages: [
        {
          role: 'system' as const,
          content: 'Eres un asistente útil y conciso.'
        },
        {
          role: 'user' as const,
          content: 'Hola, ¿puedes responder brevemente si funciona el nuevo sistema?'
        }
      ],
      temperature: 0.7,
      maxTokens: 100
    }
    
    const response = await LLMServiceV2.callLLM(testRequest)
    
    return NextResponse.json({
      success: true,
      message: 'LLMServiceV2 funciona correctamente',
      response: {
        content: response.content,
        provider: response.provider,
        model: response.model,
        usage: response.usage,
        cost: response.cost,
        latencyMs: response.latencyMs
      }
    })
    
  } catch (error) {
    console.error('🧪 Error en LLMServiceV2:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
} 