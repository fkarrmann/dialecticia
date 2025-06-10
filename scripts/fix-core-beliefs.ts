import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixCoreBeliefsForPhilosophers() {
  console.log('🔧 Iniciando corrección de coreBeliefs...')

  // Obtener todos los filósofos y filtrar programáticamente
  const allPhilosophers = await prisma.philosopher.findMany()
  
  const philosophersWithIssues = allPhilosophers.filter(philosopher => {
    if (!philosopher.coreBeliefs || philosopher.coreBeliefs === '' || philosopher.coreBeliefs === '[]') {
      return true
    }
    
    try {
      const parsed = JSON.parse(philosopher.coreBeliefs)
      if (!Array.isArray(parsed) || parsed.length === 0 || (parsed.length === 1 && parsed[0] === 'generated')) {
        return true
      }
    } catch {
      return true // JSON inválido
    }
    
    return false
  })

  console.log(`📊 Encontrados ${philosophersWithIssues.length} filósofos con problemas en coreBeliefs`)

  for (const philosopher of philosophersWithIssues) {
    console.log(`🔄 Corrigiendo: ${philosopher.name}`)
    
    try {
      // Llamar al endpoint de generación de campos
      const response = await fetch('http://localhost:3001/api/admin/llm/generate-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionName: 'core_beliefs_generation',
          data: {
            inspirationSource: philosopher.inspirationSource || philosopher.philosophicalSchool,
            secretSauce: philosopher.customPrompt || 'Enfoque filosófico tradicional y reflexivo',
            debateMechanics: philosopher.debateMechanics || 'contemplative'
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        const newCoreBeliefs = result.content || [
          `Los principios de ${philosopher.inspirationSource || philosopher.philosophicalSchool} son fundamentales`,
          'El diálogo filosófico es esencial para el desarrollo del pensamiento',
          'Las preguntas correctas son más valiosas que las respuestas fáciles'
        ]

        // Actualizar en la base de datos como JSON string
        await prisma.philosopher.update({
          where: { id: philosopher.id },
          data: { coreBeliefs: JSON.stringify(newCoreBeliefs) }
        })

        console.log(`✅ ${philosopher.name} - coreBeliefs actualizadas:`, newCoreBeliefs)
      } else {
        console.log(`❌ Error en ${philosopher.name} - respuesta ${response.status}`)
        
        // Fallback manual
        const fallbackBeliefs = [
          `Los principios de ${philosopher.inspirationSource || philosopher.philosophicalSchool} ofrecen sabiduría fundamental`,
          'El pensamiento crítico es esencial para la comprensión profunda',
          'Las ideas deben ser examinadas y cuestionadas constantemente'
        ]
        
        await prisma.philosopher.update({
          where: { id: philosopher.id },
          data: { coreBeliefs: JSON.stringify(fallbackBeliefs) }
        })
        
        console.log(`🔄 ${philosopher.name} - usando fallback:`, fallbackBeliefs)
      }
    } catch (error) {
      console.error(`❌ Error procesando ${philosopher.name}:`, error)
      
      // Fallback de emergencia
      const emergencyBeliefs = [
        'La sabiduría se encuentra en el cuestionamiento constante',
        'El diálogo es la herramienta principal del filósofo',
        'Las ideas deben ser probadas por la experiencia'
      ]
      
      await prisma.philosopher.update({
        where: { id: philosopher.id },
        data: { coreBeliefs: JSON.stringify(emergencyBeliefs) }
      })
      
      console.log(`🆘 ${philosopher.name} - usando creencias de emergencia`)
    }

    // Pequeña pausa para no sobrecargar el sistema
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('✅ Corrección de coreBeliefs completada')
}

fixCoreBeliefsForPhilosophers()
  .catch(console.error)
  .finally(() => prisma.$disconnect()) 