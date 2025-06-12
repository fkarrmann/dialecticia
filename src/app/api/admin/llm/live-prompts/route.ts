import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth'

// Store recent prompts in memory (temporary solution)
let recentPrompts: Array<{
  id: string
  timestamp: string
  functionName: string
  systemPrompt: string
  userPrompt: string
  response: string
  philosopher?: string
  debateTopic?: string
}> = []

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Return recent prompts
    return NextResponse.json({
      success: true,
      prompts: recentPrompts.slice(-20), // Last 20 prompts
      total: recentPrompts.length
    })

  } catch (error) {
    console.error('❌ Error fetching live prompts:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { functionName, systemPrompt, userPrompt, response, philosopher, debateTopic } = body

    // Add to recent prompts
    const promptEntry = {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      functionName,
      systemPrompt: systemPrompt || '',
      userPrompt: userPrompt || '',
      response: response || '',
      philosopher,
      debateTopic
    }

    recentPrompts.push(promptEntry)

    // Keep only last 100 prompts in memory
    if (recentPrompts.length > 100) {
      recentPrompts = recentPrompts.slice(-100)
    }

    return NextResponse.json({
      success: true,
      message: 'Prompt logged successfully'
    })

  } catch (error) {
    console.error('❌ Error logging prompt:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Export the prompts array for use in other modules
export { recentPrompts } 