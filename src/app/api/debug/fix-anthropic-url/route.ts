import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 ARREGLANDO URL DE ANTHROPIC...')
    
    // 1. Buscar el proveedor Anthropic
    const anthropicProvider = await prisma.lLMProvider.findFirst({
      where: { name: 'anthropic' }
    })
    
    if (!anthropicProvider) {
      return NextResponse.json({
        success: false,
        error: 'Proveedor Anthropic no encontrado'
      })
    }
    
    console.log(`📊 URL ACTUAL: ${anthropicProvider.baseUrl}`)
    console.log(`📊 URL CORRECTA: https://api.anthropic.com/v1`)
    
    // 2. Actualizar la URL si está incorrecta
    const correctUrl = 'https://api.anthropic.com/v1'
    
    if (anthropicProvider.baseUrl !== correctUrl) {
      console.log('🔧 Actualizando URL de Anthropic...')
      
      await prisma.lLMProvider.update({
        where: { id: anthropicProvider.id },
        data: { baseUrl: correctUrl }
      })
      
      console.log('✅ URL actualizada exitosamente')
      
      return NextResponse.json({
        success: true,
        message: 'URL de Anthropic corregida',
        changes: {
          before: anthropicProvider.baseUrl,
          after: correctUrl,
          fixed: true
        }
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'URL de Anthropic ya está correcta',
        changes: {
          current: anthropicProvider.baseUrl,
          expected: correctUrl,
          fixed: false
        }
      })
    }
    
  } catch (error) {
    console.error('🔧 ERROR arreglando URL:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
} 