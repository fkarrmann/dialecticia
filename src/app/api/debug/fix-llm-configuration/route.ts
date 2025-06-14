import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 FIXING: Corrigiendo configuración LLM...')
    
    // 1. Obtener la configuración LLM activa
    const currentConfig = await prisma.lLMConfiguration.findFirst({
      where: { isActive: true },
      include: {
        provider: true,
        model: true,
        promptTemplate: true
      }
    })
    
    if (!currentConfig) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró configuración LLM activa'
      })
    }
    
    console.log(`🔍 Configuración actual:`)
    console.log(`   ID: ${currentConfig.id}`)
    console.log(`   Nombre: ${currentConfig.name}`)
    console.log(`   Modelo: ${currentConfig.model.name}`)
    console.log(`   Provider: ${currentConfig.provider.name}`)
    console.log(`   Prompt Template: ${currentConfig.promptTemplate?.name || 'NULL'}`)
    console.log(`   Prompt Template ID: ${currentConfig.promptTemplateId || 'NULL'}`)
    
    // 2. Buscar el prompt template philosopher_chat_system
    const philosopherTemplate = await prisma.promptTemplate.findFirst({
      where: { 
        name: 'philosopher_chat_system',
        isActive: true 
      }
    })
    
    if (!philosopherTemplate) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró el prompt template philosopher_chat_system activo'
      })
    }
    
    console.log(`✅ Template encontrado: ${philosopherTemplate.name} (ID: ${philosopherTemplate.id})`)
    
    // 3. Verificar si ya está correctamente configurado
    if (currentConfig.promptTemplateId === philosopherTemplate.id) {
      return NextResponse.json({
        success: true,
        message: 'La configuración ya está correcta',
        configuration: {
          id: currentConfig.id,
          name: currentConfig.name,
          model: currentConfig.model.name,
          provider: currentConfig.provider.name,
          promptTemplate: philosopherTemplate.name
        }
      })
    }
    
    // 4. Actualizar la configuración
    console.log(`🔧 Actualizando configuración para usar template ${philosopherTemplate.name}`)
    
    const updatedConfig = await prisma.lLMConfiguration.update({
      where: { id: currentConfig.id },
      data: {
        promptTemplateId: philosopherTemplate.id
      },
      include: {
        provider: true,
        model: true,
        promptTemplate: true
      }
    })
    
    console.log(`✅ Configuración actualizada exitosamente`)
    
    return NextResponse.json({
      success: true,
      message: 'Configuración LLM corregida exitosamente',
      changes: {
        previousTemplateId: currentConfig.promptTemplateId,
        newTemplateId: philosopherTemplate.id,
        templateName: philosopherTemplate.name
      },
      configuration: {
        id: updatedConfig.id,
        name: updatedConfig.name,
        model: updatedConfig.model.name,
        provider: updatedConfig.provider.name,
        promptTemplate: updatedConfig.promptTemplate?.name || 'NULL'
      }
    })
    
  } catch (error) {
    console.error('🔧 FIX CONFIGURATION ERROR:', error)
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
    const { testAfterFix } = body
    
    if (testAfterFix) {
      console.log('🧪 TESTING: Probando sistema después de la corrección...')
      
      // Hacer una llamada de prueba al sistema de filósofos
      const testResult = await fetch('https://dialecticia.vercel.app/api/debug/test-philosopher-response')
      const testResponse = await testResult.json()
      
      return NextResponse.json({
        success: true,
        message: 'Prueba del sistema completada',
        testResult: testResponse
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Acción no reconocida'
    })
    
  } catch (error) {
    console.error('🔧 FIX POST ERROR:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
} 