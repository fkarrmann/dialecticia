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
    console.log('Error was:', error)
    
    try {
      // Create tables with PostgreSQL syntax
      console.log('Creating users table...')
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" TEXT NOT NULL,
          "email" TEXT,
          "name" TEXT,
          "isAdmin" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "users_email_key" UNIQUE ("email")
        );
      `
      
      console.log('Creating invitation_codes table...')
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "invitation_codes" (
          "id" TEXT NOT NULL,
          "code" TEXT NOT NULL,
          "description" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "maxUses" INTEGER NOT NULL DEFAULT 1,
          "currentUses" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "expiresAt" TIMESTAMP(3),
          "createdBy" TEXT,
          CONSTRAINT "invitation_codes_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "invitation_codes_code_key" UNIQUE ("code")
        );
      `
      
      console.log('Creating sessions table...')
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "sessions" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "invitationCodeId" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "lastAccessAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "sessions_token_key" UNIQUE ("token"),
          CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "sessions_invitationCodeId_fkey" FOREIGN KEY ("invitationCodeId") REFERENCES "invitation_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
      `
      
      console.log('Inserting test invitation code...')
      // Insert test invitation code if not exists
      const existingCode = await prisma.$queryRaw`
        SELECT "id" FROM "invitation_codes" WHERE "code" = 'DIALECTICIA-TEST' LIMIT 1;
      `
      
      if (!existingCode || (Array.isArray(existingCode) && existingCode.length === 0)) {
        await prisma.$executeRaw`
          INSERT INTO "invitation_codes" ("id", "code", "description", "maxUses", "currentUses", "isActive", "createdAt")
          VALUES ('test-id-001', 'DIALECTICIA-TEST', '10 usos para desarrollo', 10, 0, true, CURRENT_TIMESTAMP);
        `
        console.log('✅ Test invitation code created')
      } else {
        console.log('✅ Test invitation code already exists')
      }
      
      console.log('✅ Database schema applied successfully')
      
    } catch (setupError) {
      console.error('❌ Failed to setup database:', setupError)
      // Don't throw - let the app continue and show a better error
    }
  } finally {
    await prisma.$disconnect()
  }
} 