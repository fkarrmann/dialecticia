const { PrismaClient } = require('@prisma/client')

async function fixAdminUser() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_POSTGRES_URL
      }
    }
  })

  try {
    console.log('🔧 Fixing admin user in PostgreSQL...')
    
    // Find the ADMIN invitation code
    const adminCode = await prisma.invitationCode.findUnique({
      where: { code: 'ADMIN' },
      include: { 
        sessions: {
          include: { user: true }
        }
      }
    })
    
    if (adminCode && adminCode.sessions.length > 0) {
      // Update the user to be admin
      const user = adminCode.sessions[0].user
      await prisma.user.update({
        where: { id: user.id },
        data: { isAdmin: true }
      })
      
      console.log(`✅ User ${user.name} is now admin`)
    } else {
      console.log('❌ No sessions found with ADMIN code')
      
      // List all users and sessions for debugging
      const allUsers = await prisma.user.findMany()
      console.log('👥 All users:')
      allUsers.forEach(u => {
        console.log(`  - ${u.name} (${u.email}) - Admin: ${u.isAdmin}`)
      })
      
      const allCodes = await prisma.invitationCode.findMany({
        include: { sessions: { include: { user: true } } }
      })
      console.log('🎫 All invitation codes:')
      allCodes.forEach(code => {
        console.log(`  - ${code.code}: ${code.sessions.length} sessions`)
        code.sessions.forEach(session => {
          console.log(`    → ${session.user.name}`)
        })
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAdminUser() 