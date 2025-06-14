import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 CHECKING: Verificando prompt templates...')
    
    // 1. Obtener todos los prompt templates
    const allTemplates = await prisma.promptTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`📊 Total de prompt templates: ${allTemplates.length}`)
    
    // 2. Obtener templates activos
    const activeTemplates = allTemplates.filter(t => t.isActive)
    console.log(`⚡ Templates activos: ${activeTemplates.length}`)
    
    // 3. Buscar templates específicos que usa el sistema de filósofos
    const philosopherTemplates = allTemplates.filter(t => 
      t.name.includes('philosopher') || 
      t.name.includes('chat') ||
      t.name.includes('system')
    )
    
    console.log(`🤖 Templates relacionados con filósofos: ${philosopherTemplates.length}`)
    
    // 4. Verificar configuraciones LLM y sus templates
    const configurationsWithTemplates = await prisma.lLMConfiguration.findMany({
      where: { isActive: true },
      include: {
        promptTemplate: true,
        model: true,
        provider: true
      }
    })
    
    return NextResponse.json({
      success: true,
      summary: {
        totalTemplates: allTemplates.length,
        activeTemplates: activeTemplates.length,
        philosopherTemplates: philosopherTemplates.length,
        configurationsWithTemplates: configurationsWithTemplates.length
      },
      allTemplates: allTemplates.map(template => ({
        id: template.id,
        name: template.name,
        isActive: template.isActive,
        createdAt: template.createdAt,
        templateLength: template.template.length
      })),
      activeTemplates: activeTemplates.map(template => ({
        id: template.id,
        name: template.name,
        templatePreview: template.template.substring(0, 200) + '...'
      })),
      philosopherTemplates: philosopherTemplates.map(template => ({
        id: template.id,
        name: template.name,
        isActive: template.isActive,
        templatePreview: template.template.substring(0, 200) + '...'
      })),
      configurationsWithTemplates: configurationsWithTemplates.map(config => ({
        id: config.id,
        name: config.name,
        model: config.model.name,
        provider: config.provider.name,
        promptTemplate: config.promptTemplate ? {
          id: config.promptTemplate.id,
          name: config.promptTemplate.name,
          isActive: config.promptTemplate.isActive
        } : null,
        promptTemplateId: config.promptTemplateId
      }))
    })
    
  } catch (error) {
    console.error('📋 CHECK TEMPLATES ERROR:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
} 