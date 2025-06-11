import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting essential seed...')

  // Create invitation codes
  const invitationCodes = [
    {
      id: 'dialecticia-test-001',
      code: 'DIALECTICIA-TEST',
      description: '10 usos para desarrollo',
      maxUses: 10,
      currentUses: 0,
      isActive: true
    },
    {
      id: 'filosofo-beta-001', 
      code: 'FILOSOFO-BETA',
      description: '5 usos para beta testers',
      maxUses: 5,
      currentUses: 0,
      isActive: true
    },
    {
      id: 'socrates-vip-001',
      code: 'SOCRATES-VIP', 
      description: '3 usos para acceso VIP',
      maxUses: 3,
      currentUses: 0,
      isActive: true
    }
  ]

  for (const codeData of invitationCodes) {
    try {
      const existing = await prisma.invitationCode.findUnique({
        where: { code: codeData.code }
      })

      if (!existing) {
        await prisma.invitationCode.create({ data: codeData })
        console.log(`✅ Created invitation code: ${codeData.code}`)
      } else {
        console.log(`⏭️ Invitation code already exists: ${codeData.code}`)
      }
    } catch (error) {
      console.error(`❌ Failed to create ${codeData.code}:`, error)
    }
  }

  console.log('🎉 Essential seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 