const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkMigration() {
  try {
    console.log('🔍 Verificando migración en PostgreSQL...\n');

    // 1. Verificar LLM Providers
    console.log('📡 LLM Providers:');
    const providers = await prisma.lLMProvider.findMany({
      select: { name: true, isActive: true, baseUrl: true }
    });
    console.table(providers);

    // 2. Verificar LLM Models
    console.log('\n🤖 LLM Models:');
    const models = await prisma.lLMModel.findMany({
      select: { 
        name: true, 
        modelIdentifier: true, 
        isActive: true,
        provider: { select: { name: true } }
      }
    });
    console.table(models);

    // 3. Verificar Usuario Admin
    console.log('\n👤 Usuarios Admin:');
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { email: true, name: true, isAdmin: true, createdAt: true }
    });
    console.table(admins);

    // 4. Verificar Códigos de Invitación
    console.log('\n🎫 Códigos de Invitación:');
    const codes = await prisma.invitationCode.findMany({
      select: { code: true, description: true, maxUses: true, currentUses: true, isActive: true }
    });
    console.table(codes);

    // 5. Verificar Filósofos
    console.log('\n🏛️ Filósofos:');
    const philosophers = await prisma.philosopher.findMany({
      select: { name: true, isActive: true, isDefault: true, isPublic: true }
    });
    console.table(philosophers);
    console.log(`Total filósofos: ${philosophers.length}`);

    // 6. Verificar Prompt Templates
    console.log('\n📝 Prompt Templates:');
    const templates = await prisma.promptTemplate.findMany({
      select: { name: true, category: true, isActive: true }
    });
    console.table(templates);
    console.log(`Total prompt templates: ${templates.length}`);

    // 7. Verificar LLM Configurations
    console.log('\n⚙️ LLM Configurations:');
    const configs = await prisma.lLMConfiguration.findMany({
      select: { 
        name: true, 
        isActive: true,
        model: { select: { name: true } },
        provider: { select: { name: true } }
      }
    });
    console.table(configs);

    // 8. Verificar Custom Tones
    console.log('\n🎨 Custom Tones:');
    const tones = await prisma.customTone.findMany({
      select: { title: true, isActive: true, usageCount: true }
    });
    console.table(tones);

    console.log('\n📊 RESUMEN DE MIGRACIÓN:');
    console.log(`✅ Proveedores LLM: ${providers.length}`);
    console.log(`✅ Modelos LLM: ${models.length}`);
    console.log(`✅ Usuarios Admin: ${admins.length}`);
    console.log(`✅ Códigos de Invitación: ${codes.length}`);
    console.log(`✅ Filósofos: ${philosophers.length}`);
    console.log(`✅ Prompt Templates: ${templates.length}`);
    console.log(`✅ Configuraciones LLM: ${configs.length}`);
    console.log(`✅ Tonos Personalizados: ${tones.length}`);

  } catch (error) {
    console.error('❌ Error verificando migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigration(); 