import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Basic query successful:', result)
    
    // Test invitation codes table
    const codes = await prisma.invitationCode.findMany({
      take: 3,
      select: {
        code: true,
        currentUses: true,
        maxUses: true,
        isActive: true
      }
    })
    console.log('✅ Invitation codes query successful:', codes)
    
    return NextResponse.json({
      success: true,
      basicQuery: result,
      invitationCodes: codes
    })
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 