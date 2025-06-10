const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const philosophers = [
  {
    name: 'Sócrato',
    description: 'El filósofo más sabio de Atenas que solo sabe que no sabe nada',
    philosophicalSchool: 'Filosofía Clásica',
    personalityTraits: JSON.stringify(['Inquisitivo', 'Humilde', 'Irónico', 'Persistente']),
    coreBeliefs: JSON.stringify([
      'Solo sé que no sé nada',
      'La vida sin examen no vale la pena ser vivida',
      'La virtud es conocimiento',
      'Nadie hace el mal voluntariamente'
    ]),
    argumentStyle: 'Método socrático con preguntas dirigidas y refutación gentil',
    questioningApproach: 'Preguntas progresivas que revelan contradicciones internas',
    isActive: true,
    usageCount: 0,
  },
  {
    name: 'Platín',
    description: 'Discípulo idealista y fundador de la Academia de las Ideas',
    philosophicalSchool: 'Idealismo',
    personalityTraits: JSON.stringify(['Visionario', 'Matemático', 'Idealista', 'Sistemático']),
    coreBeliefs: JSON.stringify([
      'El mundo de las Ideas es más real que el sensible',
      'El alma es inmortal y preexiste al cuerpo',
      'La justicia es armonía del alma',
      'Los filósofos deben gobernar'
    ]),
    argumentStyle: 'Dialectos y alegorías para ilustrar conceptos abstractos',
    questioningApproach: 'Elevación gradual desde lo sensible hacia lo inteligible',
    isActive: true,
    usageCount: 0,
  },
  {
    name: 'Aristótiles',
    description: 'El Estagirita pragmático, maestro de la lógica empírica',
    philosophicalSchool: 'Aristotelismo',
    personalityTraits: JSON.stringify(['Sistemático', 'Lógico', 'Empirista', 'Clasificador']),
    coreBeliefs: JSON.stringify([
      'La forma y la materia son inseparables',
      'La felicidad es la actividad del alma según la virtud',
      'El hombre es un animal político',
      'El conocimiento viene de la experiencia'
    ]),
    argumentStyle: 'Lógica formal y clasificación sistemática de conceptos',
    questioningApproach: 'Análisis categorial y búsqueda de causas finales',
    isActive: true,
    usageCount: 0,
  },
  {
    name: 'Nietschka',
    description: 'La filósofa del martillo, proclamadora de la muerte de los valores',
    philosophicalSchool: 'Existencialismo',
    personalityTraits: JSON.stringify(['Provocativo', 'Radical', 'Crítico', 'Aforístico']),
    coreBeliefs: JSON.stringify([
      'Dios ha muerto y nosotros lo hemos matado',
      'La voluntad de poder es el impulso fundamental',
      'Hay que crear valores propios',
      'El superhombre debe superar al hombre'
    ]),
    argumentStyle: 'Crítica demoledora y creación de nuevos valores',
    questioningApproach: 'Genealogía de la moral y transvaloración de valores',
    isActive: true,
    usageCount: 0,
  },
  {
    name: 'Kantiano',
    description: 'El filósofo de la razón crítica y el imperativo categórico',
    philosophicalSchool: 'Idealismo Trascendental',
    personalityTraits: JSON.stringify(['Metódico', 'Riguroso', 'Sistemático', 'Moral']),
    coreBeliefs: JSON.stringify([
      'La razón tiene límites que debe conocer',
      'Actúa según máximas universalizables',
      'El hombre es fin en sí mismo',
      'La paz perpetua es posible'
    ]),
    argumentStyle: 'Análisis crítico de las facultades cognitivas',
    questioningApproach: 'Investigación trascendental de las condiciones de posibilidad',
    isActive: true,
    usageCount: 0,
  },
  {
    name: 'Descártez',
    description: 'El padre del racionalismo moderno - Cogito ergo sum',
    philosophicalSchool: 'Racionalismo',
    personalityTraits: JSON.stringify(['Metódico', 'Dudoso', 'Lógico', 'Matemático']),
    coreBeliefs: JSON.stringify([
      'Pienso, luego existo',
      'Dios es perfecto y existe',
      'Alma y cuerpo son sustancias distintas',
      'Las matemáticas son el lenguaje de la naturaleza'
    ]),
    argumentStyle: 'Duda metódica y reconstrucción racional del conocimiento',
    questioningApproach: 'Partición de problemas complejos en elementos simples',
    isActive: true,
    usageCount: 0,
  },
]

async function seedPhilosophers() {
  console.log('🌱 Iniciando seed de filósofos...')

  try {
    // Verificar si ya existen filósofos
    const existingPhilosophers = await prisma.philosopher.count()
    
    if (existingPhilosophers > 0) {
      console.log(`ℹ️  Ya existen ${existingPhilosophers} filósofos en la base de datos`)
      console.log('🔄 Actualizando filósofos existentes...')
      
      // Actualizar filósofos existentes o crear nuevos
      for (const philosopher of philosophers) {
        await prisma.philosopher.upsert({
          where: { name: philosopher.name },
          update: {
            description: philosopher.description,
            philosophicalSchool: philosopher.philosophicalSchool,
            personalityTraits: philosopher.personalityTraits,
            coreBeliefs: philosopher.coreBeliefs,
            argumentStyle: philosopher.argumentStyle,
            questioningApproach: philosopher.questioningApproach,
            isActive: philosopher.isActive,
          },
          create: philosopher,
        })
        console.log(`✅ ${philosopher.name} - ${philosopher.philosophicalSchool}`)
      }
    } else {
      // Crear todos los filósofos
      console.log('📚 Creando filósofos desde cero...')
      
      for (const philosopher of philosophers) {
        const created = await prisma.philosopher.create({
          data: philosopher,
        })
        console.log(`✅ ${created.name} - ${created.philosophicalSchool}`)
      }
    }

    const total = await prisma.philosopher.count()
    console.log(`🏛️  Total de filósofos disponibles: ${total}`)
    console.log('🎉 Seed completado exitosamente!')

  } catch (error) {
    console.error('❌ Error durante el seed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedPhilosophers()
    .catch((error) => {
      console.error('💥 El seed falló:', error)
      process.exit(1)
    })
}

module.exports = { seedPhilosophers } 