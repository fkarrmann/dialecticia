import { PrismaClient } from '@prisma/client'

let setupPromise: Promise<void> | null = null

export async function ensureDatabaseSetup(): Promise<void> {
  if (setupPromise) {
    return setupPromise
  }

  setupPromise = performDatabaseSetup()
  return setupPromise
}

async function performDatabaseSetup(): Promise<void> {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 Checking database setup...')
    
    // Try to query a table - if it works, we're good
    await prisma.invitationCode.findFirst()
    console.log('✅ Database is ready')
    
  } catch (error) {
    console.error('❌ Database tables not found. This should have been created during build.') 
    console.error('Make sure prisma db push was executed during deployment.')
    console.error('Error details:', error)
    
    // Don't try to create tables here - that should happen during build
    throw new Error('Database not properly initialized. Contact administrator.')
    
  } finally {
    await prisma.$disconnect()
  }
} 