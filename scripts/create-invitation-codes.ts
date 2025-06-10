import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createInvitationCodes() {
  try {
    console.log('🔑 Creando códigos de invitación...')

    const codes = [
      {
        code: 'DIALECTICIA-TEST',
        description: 'Código de prueba para desarrollo',
        maxUses: 10
      },
      {
        code: 'FILOSOFO-BETA',
        description: 'Código para beta testers',
        maxUses: 5
      },
      {
        code: 'SOCRATES-VIP',
        description: 'Código VIP para acceso premium',
        maxUses: 3
      },
      {
        code: 'DEMO-ACCESS',
        description: 'Código para demostraciones',
        maxUses: 1
      }
    ]

    for (const codeData of codes) {
      const existingCode = await prisma.invitationCode.findUnique({
        where: { code: codeData.code }
      })

      if (existingCode) {
        console.log(`⚠️  Código ${codeData.code} ya existe, saltando...`)
        continue
      }

      const createdCode = await prisma.invitationCode.create({
        data: codeData
      })

      console.log(`✅ Código creado: ${createdCode.code} (${createdCode.description})`)
    }

    console.log('\n📊 Resumen de códigos de invitación:')
    const allCodes = await prisma.invitationCode.findMany({
      orderBy: { createdAt: 'desc' }
    })

    allCodes.forEach(code => {
      const status = code.isActive ? '🟢 Activo' : '🔴 Inactivo'
      const usage = `${code.currentUses}/${code.maxUses} usos`
      console.log(`  ${code.code} - ${status} - ${usage} - ${code.description}`)
    })

    console.log('\n🎉 Códigos de invitación listos!')
    
  } catch (error) {
    console.error('❌ Error creando códigos de invitación:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createInvitationCodes() 