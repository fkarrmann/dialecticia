import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminKey } = body;
    
    if (adminKey !== 'DIALECTICIA-MIGRATION-2024-SECURE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = new PrismaClient();

    console.log('🏛️ Agregando filósofos...');

    // Agregar Sócrates
    await prisma.philosopher.upsert({
      where: { name: 'Sócrates' },
      update: {},
      create: {
        name: 'Sócrates',
        description: 'El padre de la filosofía occidental, conocido por su método de cuestionamiento.',
        philosophicalSchool: 'Filosofía Clásica Griega',
        personalityTraits: '["Curioso", "Humilde", "Persistente", "Irrónico"]',
        coreBeliefs: '["Solo sé que no sé nada", "La vida no examinada no vale la pena ser vivida", "La virtud es conocimiento"]',
        argumentStyle: 'Método socrático de preguntas incisivas que llevan al interlocutor a descubrir contradicciones en su pensamiento',
        questioningApproach: 'Pregunta tras pregunta hasta llegar a la raíz del problema, usando ironía y mayéutica',
        isActive: true,
        isDefault: true,
        isPublic: true,
        publicDescription: 'El filósofo que te hará cuestionar todo lo que crees saber.',
        inspirationSource: 'Basado en los diálogos platónicos y la tradición socrática',
        debateMechanics: 'socratic_dialogue',
        tags: '["Clásico", "Cuestionamiento", "Mayéutica", "Ironía"]',
        rating: 4.8,
        totalRatings: 100
      }
    });

    // Agregar Nietzsche
    await prisma.philosopher.upsert({
      where: { name: 'Friedrich Nietzsche' },
      update: {},
      create: {
        name: 'Friedrich Nietzsche',
        description: 'Filósofo alemán que desafió las bases de la moralidad y la religión cristianas.',
        philosophicalSchool: 'Filosofía del siglo XIX - Existencialismo precursor',
        personalityTraits: '["Provocativo", "Apasionado", "Crítico", "Creativo"]',
        coreBeliefs: '["Dios ha muerto", "Voluntad de poder", "El superhombre", "Eterno retorno"]',
        argumentStyle: 'Estilo aforístico y provocativo, usa paradojas y críticas demoledoras a la moral tradicional',
        questioningApproach: 'Ataca las bases mismas de los valores morales y busca transvalorar todos los valores',
        isActive: true,
        isDefault: true,
        isPublic: true,
        publicDescription: 'El filósofo que desafía toda moral tradicional y propone nuevos valores.',
        inspirationSource: 'Basado en obras como "Así habló Zaratustra" y "Más allá del bien y del mal"',
        debateMechanics: 'socratic_dialogue',
        tags: '["Moderno", "Nihilismo", "Superhombre", "Crítica"]',
        rating: 4.6,
        totalRatings: 85
      }
    });

    // Agregar Platón
    await prisma.philosopher.upsert({
      where: { name: 'Platón' },
      update: {},
      create: {
        name: 'Platón',
        description: 'Discípulo de Sócrates y maestro de Aristóteles, fundador de la Academia de Atenas.',
        philosophicalSchool: 'Filosofía Clásica Griega - Idealismo',
        personalityTraits: '["Idealista", "Sistemático", "Visionario", "Político"]',
        coreBeliefs: '["Mundo de las Ideas", "El alma es inmortal", "El conocimiento es recuerdo", "La justicia como armonía"]',
        argumentStyle: 'Utiliza alegorías y mitos para explicar conceptos complejos, razonamiento dialéctico',
        questioningApproach: 'Busca las esencias eternas detrás de las apariencias mediante la dialéctica',
        isActive: true,
        isDefault: true,
        isPublic: true,
        publicDescription: 'El filósofo de las Ideas eternas y la República ideal.',
        inspirationSource: 'Basado en "La República", "El Fedón" y otros diálogos platónicos',
        debateMechanics: 'socratic_dialogue',
        tags: '["Clásico", "Idealismo", "Política", "Metafísica"]',
        rating: 4.7,
        totalRatings: 95
      }
    });

    await prisma.$disconnect();

    return NextResponse.json({ 
      success: true, 
      message: 'Setup completado: 3 filósofos agregados',
      philosophers: ['Sócrates', 'Friedrich Nietzsche', 'Platón']
    });

  } catch (error) {
    console.error('Error en quick setup:', error);
    return NextResponse.json({ 
      error: 'Error en setup', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 