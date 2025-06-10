import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function generateNietzscheBeliefs() {
  console.log('🔍 Buscando filósofo Nietzsche/Nietschka...')

  // Buscar filósofos que contengan "Nietzsch" en el nombre
  const philosophers = await prisma.philosopher.findMany({
    where: {
      name: {
        contains: 'Nietzsch'
      }
    }
  })

  if (philosophers.length === 0) {
    console.log('❌ No se encontró ningún filósofo con "Nietzsch" en el nombre')
    
    // Mostrar todos los filósofos disponibles
    const allPhilosophers = await prisma.philosopher.findMany({
      select: { id: true, name: true }
    })
    
    console.log('📋 Filósofos disponibles:')
    allPhilosophers.forEach(p => console.log(`  - ${p.name} (${p.id})`))
    return
  }

  console.log(`✅ Encontrados ${philosophers.length} filósofos:`)
  philosophers.forEach(p => console.log(`  - ${p.name} (${p.id})`))

  const philosopher = philosophers[0] // Tomar el primero
  console.log(`\n🎯 Procesando: ${philosopher.name}`)
  console.log(`📝 Creencias actuales: ${philosopher.coreBeliefs}`)

  // Llamar al endpoint de generación de campos LLM
  try {
    const response = await fetch('http://localhost:3001/api/admin/llm/generate-field', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        functionName: 'core_beliefs_generation',
        data: {
          debateMechanics: philosopher.debateMechanics || 'contemplative',
          inspirationSource: philosopher.inspirationSource || philosopher.philosophicalSchool || 'Unknown',
          secretSauce: philosopher.customPrompt || 'Filosofía clásica'
        }
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('✅ Respuesta del servidor:', result)

    if (result.content) {
      console.log(`🎉 Creencias fundamentales generadas exitosamente para ${philosopher.name}:`)
      if (Array.isArray(result.content)) {
        result.content.forEach((belief: string, index: number) => {
          console.log(`  ${index + 1}. ${belief}`)
        })
      } else {
        console.log(`  ${result.content}`)
      }
      
      // Actualizar el filósofo en la base de datos
      await prisma.philosopher.update({
        where: { id: philosopher.id },
        data: {
          coreBeliefs: JSON.stringify(result.content)
        }
      })
      console.log('💾 Creencias actualizadas en la base de datos')
      
    } else {
      console.log('❌ Error:', result.error || 'Respuesta inesperada')
    }

  } catch (error) {
    console.error('❌ Error al llamar al endpoint:', error)
  }

  await prisma.$disconnect()
}

generateNietzscheBeliefs().catch(console.error) 