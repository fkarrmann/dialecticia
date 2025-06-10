const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const realNamesToDeactivate = ['Platón', 'Aristóteles', 'Nietzsche', 'Kant', 'Descartes']

async function cleanDuplicatePhilosophers() {
  console.log('🧹 Limpiando filósofos duplicados...')

  try {
    // Primero, listar todos los filósofos
    const allPhilosophers = await prisma.philosopher.findMany({
      select: { id: true, name: true, usageCount: true, isActive: true }
    })
    
    console.log('📋 Filósofos actuales:')
    allPhilosophers.forEach(p => {
      console.log(`  - ${p.name} (usado ${p.usageCount} veces, activo: ${p.isActive})`)
    })

    // Desactivar los nombres reales
    for (const realName of realNamesToDeactivate) {
      const philosopher = await prisma.philosopher.findUnique({
        where: { name: realName }
      })
      
      if (philosopher) {
        console.log(`🔇 Desactivando ${realName}...`)
        await prisma.philosopher.update({
          where: { name: realName },
          data: { isActive: false }
        })
        console.log(`✅ ${realName} desactivado`)
      } else {
        console.log(`ℹ️  ${realName} no encontrado`)
      }
    }

    // Listar filósofos activos finales
    const activePhilosophers = await prisma.philosopher.findMany({
      where: { isActive: true },
      select: { name: true }
    })
    
    console.log('🎉 Filósofos activos finales:')
    activePhilosophers.forEach(p => {
      console.log(`  ✓ ${p.name}`)
    })
    
    console.log(`🏛️  Total activos: ${activePhilosophers.length} filósofos`)

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanDuplicatePhilosophers()
    .catch((error) => {
      console.error('💥 La limpieza falló:', error)
      process.exit(1)
    })
}

module.exports = { cleanDuplicatePhilosophers } 