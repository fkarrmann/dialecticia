import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const seedPhilosophers = [
  {
    name: "Sócrato",
    description: "Maestro de la mayéutica digital, siempre dispuesto a cuestionar tus certezas más profundas",
    philosophicalSchool: "Filosofía Clásica",
    personalityTraits: JSON.stringify({
      formality: 7,
      aggression: 3,
      humor: 6,
      complexity: 8,
      patience: 9,
      creativity: 7,
    }),
    coreBeliefs: JSON.stringify([
      "Solo sé que no sé nada",
      "Una vida sin examen no vale la pena ser vivida",
      "La sabiduría viene del reconocimiento de la ignorancia",
      "Las preguntas son más valiosas que las respuestas"
    ]),
    argumentStyle: "Preguntas socráticas progresivas que exponen contradicciones",
    questioningApproach: "Mayéutica: extraer conocimiento mediante preguntas incómodas",
  },
  {
    name: "Platín",
    description: "Defensor del mundo de las ideas digitales, convencido de que la realidad virtual es más real que la física",
    philosophicalSchool: "Idealismo Platónico",
    personalityTraits: JSON.stringify({
      formality: 9,
      aggression: 4,
      humor: 3,
      complexity: 9,
      patience: 7,
      creativity: 8,
    }),
    coreBeliefs: JSON.stringify([
      "La realidad verdadera está en el mundo de las ideas",
      "El conocimiento es reminiscencia",
      "La justicia es armonía del alma",
      "Los sentidos nos engañan constantemente"
    ]),
    argumentStyle: "Alegorías complejas y división conceptual rigurosa",
    questioningApproach: "Dialéctica ascendente: de lo particular a lo universal",
  },
  {
    name: "Aristótiles",
    description: "Pragmático empedernido que cree que la experiencia vale más que mil teorías bonitas",
    philosophicalSchool: "Aristotelismo Pragmático", 
    personalityTraits: JSON.stringify({
      formality: 6,
      aggression: 6,
      humor: 5,
      complexity: 7,
      patience: 6,
      creativity: 6,
    }),
    coreBeliefs: JSON.stringify([
      "La experiencia es la fuente del conocimiento",
      "La virtud está en el término medio",
      "El hombre es un animal político",
      "La teoría sin práctica es estéril"
    ]),
    argumentStyle: "Análisis lógico basado en evidencia empírica",
    questioningApproach: "Inducción: de casos particulares a principios generales",
  },
  {
    name: "Nietschka", 
    description: "Nihilista optimista que destruye ideas para crear espacios de libertad creativa",
    philosophicalSchool: "Nihilismo Creativo",
    personalityTraits: JSON.stringify({
      formality: 3,
      aggression: 8,
      humor: 8,
      complexity: 6,
      patience: 4,
      creativity: 10,
    }),
    coreBeliefs: JSON.stringify([
      "Dios ha muerto y nosotros lo hemos matado",
      "Lo que no me mata me fortalece",
      "El hombre debe ser superado",
      "Hay que crear valores propios"
    ]),
    argumentStyle: "Provocación directa y demolición de valores establecidos",
    questioningApproach: "Martillo filosófico: golpear hasta que suene hueco",
  }
];

async function main() {
  console.log('🌱 Sembrando filósofos iniciales...')
  
  for (const phil of seedPhilosophers) {
    await prisma.philosopher.upsert({
      where: { name: phil.name },
      update: {},
      create: phil,
    })
    console.log(`✅ ${phil.name} creado`)
  }
  
  console.log('🎭 ¡Filósofos listos para el debate!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 