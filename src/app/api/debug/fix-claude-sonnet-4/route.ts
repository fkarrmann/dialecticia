import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 EMERGENCY DEBUG: Verificando y corrigiendo modelo Claude Sonnet 4...')
    
    // 1. Verificar el modelo actual de Claude Sonnet 4
    const currentModel = await prisma.lLMModel.findFirst({
      where: {
        name: {
          contains: 'Claude Sonnet 4'
        }
      }
    })
    
    if (!currentModel) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró modelo Claude Sonnet 4'
      })
    }
    
    console.log(`🔍 Modelo actual encontrado:`)
    console.log(`   ID: ${currentModel.id}`)
    console.log(`   Nombre: ${currentModel.name}`)
    console.log(`   Identificador actual: ${currentModel.modelIdentifier}`)
    console.log(`   Proveedor: ${currentModel.providerId}`)
    
    // 2. Verificar cuál es el identificador correcto según la documentación oficial
    const correctIdentifier = 'claude-sonnet-4-20250514'
    
    if (currentModel.modelIdentifier === correctIdentifier) {
      return NextResponse.json({
        success: true,
        message: `El modelo ya tiene el identificador correcto: ${correctIdentifier}`,
        currentModel: {
          id: currentModel.id,
          name: currentModel.name,
          identifier: currentModel.modelIdentifier
        }
      })
    }
    
    // 3. Corregir el identificador
    console.log(`🔧 Corrigiendo identificador de "${currentModel.modelIdentifier}" a "${correctIdentifier}"`)
    
    const updatedModel = await prisma.lLMModel.update({
      where: { id: currentModel.id },
      data: {
        modelIdentifier: correctIdentifier
      }
    })
    
    console.log(`✅ Modelo corregido exitosamente`)
    
    // 4. Verificar la configuración LLM que usa este modelo
    const configurations = await prisma.lLMConfiguration.findMany({
      where: {
        modelId: currentModel.id,
        isActive: true
      },
      include: {
        provider: true,
        model: true,
        promptTemplate: true
      }
    })
    
    console.log(`📊 Encontradas ${configurations.length} configuraciones activas usando este modelo`)
    
    return NextResponse.json({
      success: true,
      message: `Identificador del modelo corregido exitosamente`,
      changes: {
        previousIdentifier: currentModel.modelIdentifier,
        newIdentifier: correctIdentifier
      },
      model: {
        id: updatedModel.id,
        name: updatedModel.name,
        identifier: updatedModel.modelIdentifier
      },
      activeConfigurations: configurations.length,
      configurationDetails: configurations.map(config => ({
        id: config.id,
        name: config.name,
        provider: config.provider.name,
        promptTemplate: config.promptTemplate?.name || 'DEFAULT'
      }))
    })
    
  } catch (error) {
    console.error('🔧 EMERGENCY DEBUG ERROR:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testApiCall } = body
    
    if (testApiCall) {
      console.log('🧪 TESTING: Probando llamada a la API con el modelo corregido...')
      
      // Hacer una llamada de prueba
      const testResult = await fetch('https://dialecticia.vercel.app/api/debug/test-philosopher-response')
      const testResponse = await testResult.json()
      
      return NextResponse.json({
        success: true,
        message: 'Prueba de API completada',
        testResult: testResponse
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Acción no reconocida'
    })
    
  } catch (error) {
    console.error('🔧 EMERGENCY POST ERROR:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
} 