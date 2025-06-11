import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, adminKey } = body;
    
    if (adminKey !== 'DIALECTICIA-MIGRATION-2024-SECURE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = new PrismaClient();

    if (action === 'add-philosophers') {
      const philosophers = [
        {
          name: 'Sócrates',
          description: 'El padre de la filosofía occidental, conocido por su método de cuestionamiento.',
          philosophicalSchool: 'Filosofía Clásica Griega',
          personalityTraits: JSON.stringify(['Curioso', 'Humilde', 'Persistente', 'Irrónico']),
          coreBeliefs: JSON.stringify(['Solo sé que no sé nada', 'La vida no examinada no vale la pena ser vivida', 'La virtud es conocimiento']),
          argumentStyle: 'Método socrático de preguntas incisivas que llevan al interlocutor a descubrir contradicciones en su pensamiento',
          questioningApproach: 'Pregunta tras pregunta hasta llegar a la raíz del problema, usando ironía y mayéutica',
          isActive: true,
          isDefault: true,
          isPublic: true,
          photoUrl: null,
          publicDescription: 'El filósofo que te hará cuestionar todo lo que crees saber.',
          inspirationSource: 'Basado en los diálogos platónicos y la tradición socrática',
          debateMechanics: 'socratic_dialogue',
          tags: JSON.stringify(['Clásico', 'Cuestionamiento', 'Mayéutica', 'Ironía']),
          rating: 4.8,
          totalRatings: 100
        },
        {
          name: 'Friedrich Nietzsche',
          description: 'Filósofo alemán que desafió las bases de la moralidad y la religión cristianas.',
          philosophicalSchool: 'Filosofía del siglo XIX - Existencialismo precursor',
          personalityTraits: JSON.stringify(['Provocativo', 'Apasionado', 'Crítico', 'Creativo']),
          coreBeliefs: JSON.stringify(['Dios ha muerto', 'Voluntad de poder', 'El superhombre', 'Eterno retorno']),
          argumentStyle: 'Estilo aforístico y provocativo, usa paradojas y críticas demoledoras a la moral tradicional',
          questioningApproach: 'Ataca las bases mismas de los valores morales y busca transvalorar todos los valores',
          isActive: true,
          isDefault: true,
          isPublic: true,
          photoUrl: null,
          publicDescription: 'El filósofo que desafía toda moral tradicional y propone nuevos valores.',
          inspirationSource: 'Basado en obras como "Así habló Zaratustra" y "Más allá del bien y del mal"',
          debateMechanics: 'socratic_dialogue',
          tags: JSON.stringify(['Moderno', 'Nihilismo', 'Superhombre', 'Crítica']),
          rating: 4.6,
          totalRatings: 85
        },
        {
          name: 'Platón',
          description: 'Discípulo de Sócrates y maestro de Aristóteles, fundador de la Academia de Atenas.',
          philosophicalSchool: 'Filosofía Clásica Griega - Idealismo',
          personalityTraits: JSON.stringify(['Idealista', 'Sistemático', 'Visionario', 'Político']),
          coreBeliefs: JSON.stringify(['Mundo de las Ideas', 'El alma es inmortal', 'El conocimiento es recuerdo', 'La justicia como armonía']),
          argumentStyle: 'Utiliza alegorías y mitos para explicar conceptos complejos, razonamiento dialéctico',
          questioningApproach: 'Busca las esencias eternas detrás de las apariencias mediante la dialéctica',
          isActive: true,
          isDefault: true,
          isPublic: true,
          photoUrl: null,
          publicDescription: 'El filósofo de las Ideas eternas y la República ideal.',
          inspirationSource: 'Basado en "La República", "El Fedón" y otros diálogos platónicos',
          debateMechanics: 'socratic_dialogue',
          tags: JSON.stringify(['Clásico', 'Idealismo', 'Política', 'Metafísica']),
          rating: 4.7,
          totalRatings: 95
        }
      ];

      for (const philosopherData of philosophers) {
        await prisma.philosopher.upsert({
          where: { name: philosopherData.name },
          update: {},
          create: philosopherData
        });
      }

      await prisma.$disconnect();

      return NextResponse.json({ 
        success: true, 
        message: 'Filósofos agregados exitosamente',
        count: philosophers.length
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

  } catch (error) {
    console.error('Error populating database:', error);
    return NextResponse.json({ 
      error: 'Error populating database', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 