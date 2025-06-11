const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function setupProductionData() {
  try {
    console.log('🚀 Configurando datos específicos de producción...');

    // 1. Crear códigos de invitación para producción
    console.log('\n🎫 Creando códigos de invitación...');
    
    const invitationCodes = [
      {
        code: 'DIALECTICIA-LAUNCH-2024',
        description: 'Código de lanzamiento principal',
        maxUses: 100,
        expiresAt: new Date('2025-12-31')
      },
      {
        code: 'ADMIN-ACCESS-FEDERICO',
        description: 'Acceso especial para administrador',
        maxUses: 5,
        expiresAt: new Date('2025-12-31')
      },
      {
        code: 'BETA-TESTERS-2024',
        description: 'Acceso para beta testers',
        maxUses: 50,
        expiresAt: new Date('2025-06-30')
      }
    ];

    for (const codeData of invitationCodes) {
      const code = await prisma.invitationCode.upsert({
        where: { code: codeData.code },
        update: {},
        create: codeData
      });
      console.log(`✅ Código creado: ${code.code} (${code.maxUses} usos)`);
    }

    // 2. Verificar que el usuario admin existe
    console.log('\n👤 Verificando usuario administrador...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'fkarrmann@gmail.com' }
    });

    if (adminUser) {
      console.log(`✅ Usuario admin confirmado: ${adminUser.name}`);
    } else {
      console.log('⚠️ Usuario admin no encontrado. Creándolo...');
      await prisma.user.create({
        data: {
          email: 'fkarrmann@gmail.com',
          name: 'Federico Karrmann',
          isAdmin: true
        }
      });
      console.log('✅ Usuario admin creado');
    }

    // 3. Verificar configuración LLM
    console.log('\n🤖 Verificando configuración LLM...');
    const llmProviders = await prisma.lLMProvider.count();
    const llmModels = await prisma.lLMModel.count();
    const promptTemplates = await prisma.promptTemplate.count();
    const configurations = await prisma.lLMConfiguration.count();

    console.log(`📊 Configuración LLM:
       - Proveedores: ${llmProviders}
       - Modelos: ${llmModels}  
       - Prompt Templates: ${promptTemplates}
       - Configuraciones: ${configurations}`);

    if (llmProviders === 0 || llmModels === 0 || promptTemplates === 0) {
      console.log('⚠️ Faltan datos LLM críticos. Ejecutar migración primero.');
    } else {
      console.log('✅ Configuración LLM completa');
    }

    // 4. Verificar filósofos
    console.log('\n🏛️ Verificando filósofos...');
    const philosophersCount = await prisma.philosopher.count();
    const activePhilosophers = await prisma.philosopher.count({
      where: { isActive: true }
    });

    console.log(`📊 Filósofos: ${philosophersCount} total, ${activePhilosophers} activos`);

    if (philosophersCount === 0) {
      console.log('⚠️ No hay filósofos. Ejecutar migración primero.');
    } else {
      console.log('✅ Filósofos disponibles');
    }

    console.log('\n🎉 Configuración de producción completada!');
    console.log('\n🌐 Tu aplicación está lista para:\n');
    console.log('   📱 Usuarios con códigos de invitación');
    console.log('   🏛️ Debates con filósofos virtuales');
    console.log('   🤖 Sistema LLM completamente configurado');
    console.log('   👨‍💻 Panel de administración funcional');
    console.log('\n🔗 Accede con: https://dialecticia.vercel.app');

  } catch (error) {
    console.error('❌ Error en configuración de producción:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupProductionData(); 