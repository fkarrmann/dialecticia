import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkGuilloteData() {
  const philosopher = await prisma.philosopher.findFirst({
    where: {
      name: 'Guillote'
    }
  })
  
  if (!philosopher) {
    console.log('❌ No se encontró Guillote')
    return
  }
  
  console.log('📋 DATOS DE GUILLOTE:')
  console.log('=' .repeat(80))
  console.log('Nombre:', philosopher.name)
  console.log('coreBeliefs (RAW):', philosopher.coreBeliefs)
  console.log('Tipo de coreBeliefs:', typeof philosopher.coreBeliefs)
  
  if (philosopher.coreBeliefs) {
    try {
      const parsed = JSON.parse(philosopher.coreBeliefs)
      console.log('coreBeliefs (PARSED):', parsed)
      console.log('¿Es array?:', Array.isArray(parsed))
      if (Array.isArray(parsed)) {
        parsed.forEach((belief, index) => {
          console.log(`  ${index + 1}. ${belief}`)
        })
      }
    } catch (error) {
      console.log('❌ Error parseando coreBeliefs:', error)
    }
  }
  
  console.log('=' .repeat(80))
  
  await prisma.$disconnect()
}

checkGuilloteData().catch(console.error) 