import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkNietzscheData() {
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
  
  console.log('📋 DATOS COMPLETOS DE NIETZSCHE:')
  console.log('=' .repeat(80))
  console.log('ID:', philosopher.id)
  console.log('Nombre:', philosopher.name)
  console.log('Descripción:', philosopher.description)
  console.log('Escuela Filosófica:', philosopher.philosophicalSchool)
  console.log('Fuente de Inspiración:', philosopher.inspirationSource)
  console.log('Mecánicas de Debate:', philosopher.debateMechanics)
  console.log('Prompt Personalizado:', philosopher.customPrompt)
  console.log('Estilo Argumentativo:', philosopher.argumentStyle)
  console.log('Enfoque de Cuestionamiento:', philosopher.questioningApproach)
  console.log('Creencias Fundamentales:', philosopher.coreBeliefs)
  console.log('Traits:', philosopher.personalityTraits)
  console.log('=' .repeat(80))
  
  await prisma.$disconnect()
}

checkNietzscheData().catch(console.error) 