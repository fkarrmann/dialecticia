import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        mode: 'DATABASE_DRIVEN',
        message: 'System uses ONLY database configurations - NO environment variable fallbacks',
        environment: process.env.NODE_ENV || 'development',
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