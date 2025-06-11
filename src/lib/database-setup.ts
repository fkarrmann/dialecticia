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
    
    // Try to query a table - if it fails, we need to setup
    await prisma.invitationCode.findFirst()
    console.log('✅ Database is ready')
    
  } catch (error) {
    console.log('🚨 Database needs setup, applying schema...')
    
    try {
      // Apply the schema programmatically
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "email" TEXT,
          "name" TEXT,
          "isAdmin" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        );
      `
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "invitation_codes" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "code" TEXT NOT NULL UNIQUE,
          "description" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "maxUses" INTEGER NOT NULL DEFAULT 1,
          "currentUses" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "expiresAt" TIMESTAMP(3),
          "createdBy" TEXT
        );
      `
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "sessions" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "invitationCodeId" TEXT NOT NULL,
          "token" TEXT NOT NULL UNIQUE,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "lastAccessAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
          FOREIGN KEY ("invitationCodeId") REFERENCES "invitation_codes"("id")
        );
      `
      
      // Insert test invitation code if not exists
      await prisma.$executeRaw`
        INSERT INTO "invitation_codes" ("id", "code", "description", "maxUses")
        VALUES ('test-id-001', 'DIALECTICIA-TEST', '10 usos para desarrollo', 10)
        ON CONFLICT ("code") DO NOTHING;
      `
      
      console.log('✅ Database schema applied successfully')
      
    } catch (setupError) {
      console.error('❌ Failed to setup database:', setupError)
      throw setupError
    }
  } finally {
    await prisma.$disconnect()
  }
} 