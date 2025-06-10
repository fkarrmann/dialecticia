import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const MOCK_MODE = !process.env.OPENAI_API_KEY || 
      process.env.OPENAI_API_KEY === 'your-openai-api-key-here' ||
      process.env.OPENAI_API_KEY === 'sk-your-actual-openai-api-key-here'

    return NextResponse.json({
      success: true,
      data: {
        mode: MOCK_MODE ? 'MOCK' : 'OPENAI',
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        environment: process.env.NODE_ENV || 'development',
        hasApiKey: !!process.env.OPENAI_API_KEY,
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Error in status endpoint:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
    }, { status: 500 })
  }
} 