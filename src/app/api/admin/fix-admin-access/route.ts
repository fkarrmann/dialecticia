import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret } = body;
    
    if (secret !== 'FIX-ADMIN-DIALECTICIA-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = new PrismaClient();

    console.log('🔧 Arreglando acceso de administrador...');
    
    // 1. Actualizar usuario Federico para que sea admin
    const adminUser = await prisma.user.updateMany({
      where: { 
        OR: [
          { email: 'fkarrmann@gmail.com' },
          { name: 'Federico Karrmann' }
        ]
      },
      data: { 
        isAdmin: true,
        email: 'fkarrmann@gmail.com' // Asegurar que tenga email
      }
    });

    // 2. Crear nuevo código de invitación para admin
    const newAdminCode = await prisma.invitationCode.create({
      data: {
        code: 'FEDERICO-ADMIN-2024',
        description: 'Código de administrador para Federico - Renovado',
        maxUses: 1,
        currentUses: 0,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
      }
    });

    // 3. Agregar filósofos básicos
    const philosophers = [
      {
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
      },
      {
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
    ];

    let philosophersCreated = 0;
    for (const phil of philosophers) {
      try {
        await prisma.philosopher.upsert({
          where: { name: phil.name },
          update: {},
          create: phil
        });
        philosophersCreated++;
        console.log(`✅ Filósofo: ${phil.name}`);
      } catch (error) {
        console.log(`⚠️ Error creando ${phil.name}:`, error);
      }
    }

    // 4. Verificar estado final
    const finalUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'fkarrmann@gmail.com' },
          { name: 'Federico Karrmann' }
        ]
      }
    });

    const totalPhilosophers = await prisma.philosopher.count();

    await prisma.$disconnect();

    return NextResponse.json({ 
      success: true, 
      message: 'Acceso de administrador corregido',
      results: {
        userUpdated: adminUser.count,
        newAdminCode: newAdminCode.code,
        philosophersCreated,
        totalPhilosophers,
        adminUser: {
          name: finalUser?.name,
          email: finalUser?.email,
          isAdmin: finalUser?.isAdmin
        }
      }
    });

  } catch (error) {
    console.error('Error arreglando admin:', error);
    return NextResponse.json({ 
      error: 'Error en corrección', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 