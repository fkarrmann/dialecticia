const { PrismaClient } = require('@prisma/client')

async function createAdminCode() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_POSTGRES_URL
      }
    }
  })

  try {
    console.log('🔧 Creating ADMIN code in PostgreSQL...')
    
    // Create ADMIN code
    await prisma.invitationCode.upsert({
      where: { code: 'ADMIN' },
      update: {},
      create: {
        code: 'ADMIN',
        description: 'Admin access for Federico',
        maxUses: 10,
        isActive: true
      }
    })
    
    console.log('✅ ADMIN code created successfully')
    
    // List all codes
    const codes = await prisma.invitationCode.findMany()
    console.log('📋 All invitation codes:')
    codes.forEach(code => {
      console.log(`  - ${code.code}: ${code.usageCount}/${code.maxUses} uses`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminCode() 