import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function restoreGuilloteBeliefs() {
  console.log('🔧 Restaurando creencias auténticas de Guillote...')

  // Las creencias auténticas originales de Guillote
  const authenticBeliefs = [
    "La justicia social se logra con industria nacional y trabajadores organizados.",
    "El progresismo traiciona los valores cristianos y obreros del pueblo.",
    "La soberanía política requiere independencia económica y unidad latinoamericana."
  ]

  const philosopher = await prisma.philosopher.findFirst({
    where: { name: 'Guillote' }
  })

  if (!philosopher) {
    console.log('❌ No se encontró Guillote')
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

  console.log('\n🎉 ¡Creencias auténticas de Guillote restauradas exitosamente!')
  
  await prisma.$disconnect()
}

restoreGuilloteBeliefs().catch(console.error) 