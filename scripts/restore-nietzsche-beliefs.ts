import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function restoreNietzscheBeliefs() {
  console.log('🔧 Restaurando creencias auténticas de Nietzsche...')

  // Las creencias auténticas originales de Nietzsche
  const authenticBeliefs = [
    "Dios ha muerto y nosotros lo hemos matado",
    "La voluntad de poder es el impulso fundamental",
    "Hay que crear valores propios",
    "El superhombre debe superar al hombre"
  ]

  const philosopher = await prisma.philosopher.findFirst({
    where: {
      name: {
        contains: 'Nietzsch'
      }
    }
  })

  if (!philosopher) {
    console.log('❌ No se encontró Nietzsche')
    return
  }

  console.log('📝 Creencias actuales (incorrectas):')
  const currentBeliefs = JSON.parse(philosopher.coreBeliefs || '[]')
  currentBeliefs.forEach((belief: string, index: number) => {
    console.log(`  ${index + 1}. ${belief}`)
  })

  console.log('\n✅ Restaurando creencias auténticas:')
  authenticBeliefs.forEach((belief, index) => {
    console.log(`  ${index + 1}. ${belief}`)
  })

  // Actualizar en la base de datos
  await prisma.philosopher.update({
    where: { id: philosopher.id },
    data: {
      coreBeliefs: JSON.stringify(authenticBeliefs)
    }
  })

  console.log('\n🎉 ¡Creencias auténticas de Nietzsche restauradas exitosamente!')
  
  await prisma.$disconnect()
}

restoreNietzscheBeliefs().catch(console.error) 