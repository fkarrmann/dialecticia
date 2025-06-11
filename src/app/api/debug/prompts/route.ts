import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Fetching prompts...')
    
    const prompts = await prisma.promptTemplate.findMany({
      orderBy: [
        { name: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    console.log(`📝 Found ${prompts.length} prompts:`)
    prompts.forEach((prompt, i) => {
      console.log(`  ${i+1}. ${prompt.name} (${prompt.category}) - ${prompt.isActive ? 'ACTIVE' : 'INACTIVE'}`)
    })

    return NextResponse.json({
      count: prompts.length,
      prompts: prompts.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        isActive: p.isActive,
        templateLength: p.template.length
      }))
    })

  } catch (error) {
    console.error('❌ Error fetching prompts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompts', details: error },
      { status: 500 }
    )
  }
} 