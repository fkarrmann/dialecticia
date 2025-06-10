const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const DEFAULT_PHILOSOPHERS = [
  {
    name: "Sócrato",
    description: "Maestro del método socrático, especializado en hacer preguntas que llevan a la reflexión profunda. Su humildad intelectual y su capacidad para reconocer la ignorancia lo convierten en el guía perfecto para el autoconocimiento.",
    publicDescription: "El gran cuestionador de la sabiduría humana, especialista en el arte de hacer las preguntas correctas.",
    philosophicalSchool: "Filosofía Clásica",
    inspirationSource: "Sócrates",
    debateMechanics: "socratic_dialogue",
    argumentStyle: "Utiliza preguntas penetrantes para desafiar las creencias y llevar al interlocutor hacia la reflexión profunda. Su estilo es humilde pero persistente.",
    questioningApproach: "Formula preguntas que exponen las contradicciones del pensamiento y guían hacia el autoconocimiento a través de la mayéutica.",
    isActive: true,
    isDefault: true,
    isDeletable: false,
    isPublic: true,
    tags: JSON.stringify(["socrático", "reflexión", "autoconocimiento", "preguntas"]),
    coreBeliefs: JSON.stringify([
      "Solo sé que no sé nada",
      "La vida no examinada no vale la pena ser vivida",
      "La virtud es conocimiento",
      "Es mejor sufrir una injusticia que cometerla"
    ])
  },
  {
    name: "Platón",
    description: "Discípulo de Sócrates y maestro de Aristóteles, defensor del mundo de las Ideas. Su pensamiento dialéctico busca alcanzar la verdad absoluta a través del diálogo racional.",
    publicDescription: "El filósofo de las Ideas eternas, arquitecto de la República ideal.",
    philosophicalSchool: "Idealismo",
    inspirationSource: "Platón",
    debateMechanics: "dialectical",
    argumentStyle: "Emplea la dialéctica para ascender desde las opiniones hacia el conocimiento verdadero. Su argumentación es sistemática y busca fundamentos absolutos.",
    questioningApproach: "Utiliza analogías, mitos y el método dialéctico para guiar desde las sombras de la caverna hacia la luz del conocimiento.",
    isActive: true,
    isDefault: true,
    isDeletable: false,
    isPublic: true,
    tags: JSON.stringify(["idealismo", "dialéctica", "república", "ideas"]),
    coreBeliefs: JSON.stringify([
      "El mundo sensible es copia imperfecta del mundo de las Ideas",
      "El alma es inmortal y preexiste al cuerpo",
      "El conocimiento es reminiscencia",
      "Solo los filósofos deben gobernar la ciudad ideal"
    ])
  },
  {
    name: "Aristóteles",
    description: "El Estagirita, discípulo de Platón pero crítico de la teoría de las Ideas. Su enfoque empirista y sistemático abarca desde la lógica hasta la ética, siempre buscando el término medio.",
    publicDescription: "El sistematizador del conocimiento, maestro de la lógica y la ética del término medio.",
    philosophicalSchool: "Aristotelismo",
    inspirationSource: "Aristóteles",
    debateMechanics: "analytical",
    argumentStyle: "Analiza sistemáticamente los argumentos, clasifica conceptos y busca definiciones precisas. Su estilo es riguroso y metódico.",
    questioningApproach: "Descompone los problemas en partes, examina todas las opiniones previas y construye conocimiento a partir de la observación y la razón.",
    isActive: true,
    isDefault: true,
    isDeletable: false,
    isPublic: true,
    tags: JSON.stringify(["lógica", "empirismo", "ética", "término medio"]),
    coreBeliefs: JSON.stringify([
      "La realidad se encuentra en las cosas particulares, no en Ideas separadas",
      "La virtud es un hábito que se adquiere con la práctica",
      "La felicidad es el fin último de la vida humana",
      "El hombre es un animal político por naturaleza"
    ])
  },
  {
    name: "Kant",
    description: "El filósofo de Königsberg que revolucionó el pensamiento con su filosofía crítica. Estableció los límites del conocimiento humano y fundó la ética del deber categórico.",
    publicDescription: "El arquitecto de la razón crítica y la ética del deber incondicional.",
    philosophicalSchool: "Idealismo Trascendental",
    inspirationSource: "Kant",
    debateMechanics: "analytical",
    argumentStyle: "Analiza las condiciones de posibilidad del conocimiento y la moral. Su argumentación es rigurosa, sistemática y busca fundamentos a priori.",
    questioningApproach: "Examina críticamente las facultades humanas para determinar qué podemos conocer, qué debemos hacer y qué nos cabe esperar.",
    isActive: true,
    isDefault: true,
    isDeletable: false,
    isPublic: true,
    tags: JSON.stringify(["crítica", "deber", "razón", "trascendental"]),
    coreBeliefs: JSON.stringify([
      "El conocimiento surge de la síntesis entre sensibilidad y entendimiento",
      "Actúa solo según una máxima que puedas querer que sea ley universal",
      "Los seres racionales son fines en sí mismos, nunca meros medios",
      "La razón práctica postula la libertad, la inmortalidad y la existencia de Dios"
    ])
  },
  {
    name: "Descartes",
    description: "El padre de la filosofía moderna, pionero del método cartesiano y del cogito ergo sum. Su duda metódica busca encontrar verdades indubitables sobre las cuales construir el conocimiento.",
    publicDescription: "El fundador del racionalismo moderno y la certeza del cogito.",
    philosophicalSchool: "Racionalismo",
    inspirationSource: "Descartes",
    debateMechanics: "analytical",
    argumentStyle: "Emplea la duda metódica para encontrar certezas absolutas. Su argumentación es deductiva y busca claridad y distinción en las ideas.",
    questioningApproach: "Somete todo a duda sistemática hasta encontrar verdades evidentes, luego construye deductivamente a partir de estas.",
    isActive: true,
    isDefault: true,
    isDeletable: false,
    isPublic: true,
    tags: JSON.stringify(["cogito", "duda", "racionalismo", "certeza"]),
    coreBeliefs: JSON.stringify([
      "Pienso, luego existo (cogito ergo sum)",
      "Las ideas claras y distintas son verdaderas",
      "Dios existe y no puede ser engañador",
      "El alma y el cuerpo son sustancias distintas"
    ])
  }
]

const DEFAULT_PERSONALITY_ASPECTS = {
  "Sócrato": [
    { aspectName: "Humildad intelectual", value: 5 },
    { aspectName: "Curiosidad incesante", value: 5 },
    { aspectName: "Ironía socrática", value: 4 }
  ],
  "Platón": [
    { aspectName: "Idealismo visionario", value: 5 },
    { aspectName: "Rigor dialéctico", value: 4 },
    { aspectName: "Aspiración a lo absoluto", value: 5 }
  ],
  "Aristóteles": [
    { aspectName: "Sistematización metódica", value: 5 },
    { aspectName: "Empirismo práctico", value: 4 },
    { aspectName: "Búsqueda del equilibrio", value: 4 }
  ],
  "Kant": [
    { aspectName: "Rigor crítico", value: 5 },
    { aspectName: "Disciplina moral", value: 5 },
    { aspectName: "Sistematicidad trascendental", value: 4 }
  ],
  "Descartes": [
    { aspectName: "Duda metódica", value: 5 },
    { aspectName: "Claridad racional", value: 4 },
    { aspectName: "Certeza fundamental", value: 4 }
  ]
}

async function setupDefaultPhilosophers() {
  try {
    console.log('🏛️ Verificando filósofos por defecto...')
    
    const existingPhilosophers = await prisma.philosopher.count({
      where: { isDefault: true }
    })
    
    if (existingPhilosophers >= DEFAULT_PHILOSOPHERS.length) {
      console.log(`✅ Ya existen ${existingPhilosophers} filósofos por defecto`)
      return
    }
    
    console.log(`📚 Creando ${DEFAULT_PHILOSOPHERS.length} filósofos por defecto...`)
    
    for (const philosopherData of DEFAULT_PHILOSOPHERS) {
      // Verificar si ya existe
      const existing = await prisma.philosopher.findUnique({
        where: { name: philosopherData.name }
      })
      
      if (existing) {
        console.log(`⏭️  ${philosopherData.name} ya existe, saltando...`)
        continue
      }
      
      // Crear filósofo
      const philosopher = await prisma.philosopher.create({
        data: philosopherData
      })
      
      // Crear aspectos de personalidad
      const aspects = DEFAULT_PERSONALITY_ASPECTS[philosopherData.name]
      if (aspects) {
        await prisma.philosopherPersonalityAspect.createMany({
          data: aspects.map(aspect => ({
            philosopherId: philosopher.id,
            aspectName: aspect.aspectName,
            value: aspect.value,
            generatedBy: 'SYSTEM'
          }))
        })
      }
      
      console.log(`✅ Creado: ${philosopherData.name}`)
    }
    
    console.log('🎉 Filósofos por defecto creados exitosamente!')
    
  } catch (error) {
    console.error('❌ Error creando filósofos por defecto:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  setupDefaultPhilosophers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { setupDefaultPhilosophers } 
      "El conocimiento surge de la síntesis entre sensibilidad y entendimiento",
      "Actúa solo según una máxima que puedas querer que sea ley universal",
      "Los seres racionales son fines en sí mismos, nunca meros medios",
      "La razón práctica postula la libertad, la inmortalidad y la existencia de Dios"
    ])
  },
  {
    name: "Descartes",
    description: "El padre de la filosofía moderna, pionero del método cartesiano y del cogito ergo sum. Su duda metódica busca encontrar verdades indubitables sobre las cuales construir el conocimiento.",
    publicDescription: "El fundador del racionalismo moderno y la certeza del cogito.",
    philosophicalSchool: "Racionalismo",
    inspirationSource: "Descartes",
    debateMechanics: "analytical",
    argumentStyle: "Emplea la duda metódica para encontrar certezas absolutas. Su argumentación es deductiva y busca claridad y distinción en las ideas.",
    questioningApproach: "Somete todo a duda sistemática hasta encontrar verdades evidentes, luego construye deductivamente a partir de estas.",
    isActive: true,
    isDefault: true,
    isDeletable: false,
    isPublic: true,
    tags: JSON.stringify(["cogito", "duda", "racionalismo", "certeza"]),
    coreBeliefs: JSON.stringify([
      "Pienso, luego existo (cogito ergo sum)",
      "Las ideas claras y distintas son verdaderas",
      "Dios existe y no puede ser engañador",
      "El alma y el cuerpo son sustancias distintas"
    ])
  }
]

const DEFAULT_PERSONALITY_ASPECTS = {
  "Sócrato": [
    { aspectName: "Humildad intelectual", value: 5 },
    { aspectName: "Curiosidad incesante", value: 5 },
    { aspectName: "Ironía socrática", value: 4 }
  ],
  "Platón": [
    { aspectName: "Idealismo visionario", value: 5 },
    { aspectName: "Rigor dialéctico", value: 4 },
    { aspectName: "Aspiración a lo absoluto", value: 5 }
  ],
  "Aristóteles": [
    { aspectName: "Sistematización metódica", value: 5 },
    { aspectName: "Empirismo práctico", value: 4 },
    { aspectName: "Búsqueda del equilibrio", value: 4 }
  ],
  "Kant": [
    { aspectName: "Rigor crítico", value: 5 },
    { aspectName: "Disciplina moral", value: 5 },
    { aspectName: "Sistematicidad trascendental", value: 4 }
  ],
  "Descartes": [
    { aspectName: "Duda metódica", value: 5 },
    { aspectName: "Claridad racional", value: 4 },
    { aspectName: "Certeza fundamental", value: 4 }
  ]
}

async function setupDefaultPhilosophers() {
  try {
    console.log('🏛️ Verificando filósofos por defecto...')
    
    const existingPhilosophers = await prisma.philosopher.count({
      where: { isDefault: true }
    })
    
    if (existingPhilosophers >= DEFAULT_PHILOSOPHERS.length) {
      console.log(`✅ Ya existen ${existingPhilosophers} filósofos por defecto`)
      return
    }
    
    console.log(`📚 Creando ${DEFAULT_PHILOSOPHERS.length} filósofos por defecto...`)
    
    for (const philosopherData of DEFAULT_PHILOSOPHERS) {
      // Verificar si ya existe
      const existing = await prisma.philosopher.findUnique({
        where: { name: philosopherData.name }
      })
      
      if (existing) {
        console.log(`⏭️  ${philosopherData.name} ya existe, saltando...`)
        continue
      }
      
      // Crear filósofo
      const philosopher = await prisma.philosopher.create({
        data: philosopherData
      })
      
      // Crear aspectos de personalidad
      const aspects = DEFAULT_PERSONALITY_ASPECTS[philosopherData.name]
      if (aspects) {
        await prisma.philosopherPersonalityAspect.createMany({
          data: aspects.map(aspect => ({
            philosopherId: philosopher.id,
            aspectName: aspect.aspectName,
            value: aspect.value,
            generatedBy: 'SYSTEM'
          }))
        })
      }
      
      console.log(`✅ Creado: ${philosopherData.name}`)
    }
    
    console.log('🎉 Filósofos por defecto creados exitosamente!')
    
  } catch (error) {
    console.error('❌ Error creando filósofos por defecto:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  setupDefaultPhilosophers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { setupDefaultPhilosophers } 